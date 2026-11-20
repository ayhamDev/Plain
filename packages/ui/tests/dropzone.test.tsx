import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { Dropzone, type DropzoneRenderState } from '../src/ui/advanced';
import { Field } from '../src/ui/forms';
import { LanguageProvider } from '../src/ui/i18n';
import { StyleProvider } from '../src/ui/styling';
import { tokensToStyle } from '../src/ui/token-contract';

const documentFile = (name = 'review.txt', body = 'review') =>
  new File([body], name, { type: 'text/plain' });
const transfer = (files: File[] = []) => ({ files, types: ['Files'], dropEffect: 'none' });

describe('Dropzone', () => {
  it('keeps native labels, input props, ref and picker handlers on the file input', async () => {
    const ref = React.createRef<HTMLInputElement>();
    const native = vi.fn();
    const changed = vi.fn();
    render(
      <form id="attachments">
        <Field label="Project files" description="For the design review">
          <Dropzone
            ref={ref}
            name="documents"
            required
            multiple
            accept=".txt"
            onChange={(event) => native(event.currentTarget)}
            onFilesChange={changed}
          />
        </Field>
      </form>,
    );
    const input = screen.getByLabelText('Project files');
    expect(ref.current).toBe(input);
    expect(ref.current?.type).toBe('file');
    expect(ref.current?.form?.id).toBe('attachments');
    expect(input).toHaveAttribute('name', 'documents');
    expect(input).toBeRequired();
    expect(input).toHaveAccessibleDescription(/For the design review/);
    const file = documentFile();
    await userEvent.upload(input, file);
    expect(native).toHaveBeenCalledExactlyOnceWith(input);
    expect(changed).toHaveBeenCalledExactlyOnceWith([file]);
    expect(screen.getByRole('list', { name: 'Selected files' })).toHaveTextContent(file.name);
    expect(screen.getByRole('status')).toHaveTextContent('1 file selected.');
  });

  it('reports all rejection reasons and retains the previous accepted batch', async () => {
    const rejected = vi.fn();
    const changed = vi.fn();
    const user = userEvent.setup({ applyAccept: false });
    render(
      <Dropzone
        aria-label="Attachments"
        multiple
        accept=".txt,image/*"
        maxFiles={2}
        maxSize={10}
        onReject={rejected}
        onValueChange={changed}
      />,
    );
    const input = screen.getByLabelText('Attachments');
    const saved = documentFile();
    await user.upload(input, saved);
    const wrong = new File(['a'], 'archive.zip', { type: 'application/zip' });
    const large = documentFile('large.txt', 'x'.repeat(11));
    const extra = documentFile('extra.txt');
    await user.upload(input, [documentFile('first.txt'), wrong, large, extra]);
    expect(rejected).toHaveBeenCalledExactlyOnceWith([
      { file: wrong, reason: 'type' },
      { file: large, reason: 'size' },
      { file: extra, reason: 'count' },
    ]);
    expect(changed).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('list', { name: 'Selected files' })).toHaveTextContent(saved.name);
    expect(screen.getByRole('alert')).toHaveTextContent('This file type is not accepted.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/This file is too large/);
    await user.upload(input, documentFile('replacement.TXT'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('list', { name: 'Selected files' })).toHaveTextContent(
      'replacement.TXT',
    );
  });

  it('uses the same validation for native files dropped onto the area', () => {
    const changed = vi.fn();
    const { container } = render(
      <Dropzone aria-label="Attachments" accept="text/plain" onFilesChange={changed} />,
    );
    const file = documentFile();
    fireEvent.drop(container.querySelector('.ui-dropzone-area')!, {
      dataTransfer: transfer([file]),
    });
    expect(changed).toHaveBeenCalledExactlyOnceWith([file]);
    expect(screen.getByRole('list', { name: 'Selected files' })).toHaveTextContent(file.name);
  });

  it('tracks nested file drags without highlighting text drags or flickering between descendants', () => {
    const { container } = render(
      <Dropzone>
        <span>Drop area</span>
      </Dropzone>,
    );
    const area = container.querySelector('.ui-dropzone-area')!;
    const root = container.querySelector('.ui-dropzone')!;
    const child = screen.getByText('Drop area');
    fireEvent.dragEnter(area, { dataTransfer: { types: ['text/plain'] } });
    expect(root).not.toHaveAttribute('data-dragging');
    fireEvent.dragEnter(area, { dataTransfer: transfer() });
    fireEvent.dragEnter(child, { dataTransfer: transfer() });
    fireEvent.dragLeave(child, { dataTransfer: transfer() });
    expect(root).toHaveAttribute('data-dragging', 'true');
    fireEvent.dragLeave(area, { dataTransfer: transfer() });
    expect(root).not.toHaveAttribute('data-dragging');
  });

  it('lets native picker and drop handlers cancel a selection', async () => {
    const changed = vi.fn();
    render(
      <Dropzone
        aria-label="Attachments"
        onValueChange={changed}
        onChange={(event) => event.preventDefault()}
        onDrop={(event) => event.preventDefault()}
      />,
    );
    const input = screen.getByLabelText('Attachments');
    await userEvent.upload(input, documentFile());
    fireEvent.drop(input, { dataTransfer: transfer([documentFile()]) });
    expect(changed).not.toHaveBeenCalled();
    expect(screen.queryByRole('list', { name: 'Selected files' })).not.toBeInTheDocument();
    expect((input as HTMLInputElement).files).toHaveLength(0);
  });

  it('retains controlled files until the parent commits the proposed value', async () => {
    const first = documentFile('existing.txt');
    const next = documentFile('replacement.txt');
    const changed = vi.fn();
    const { rerender } = render(
      <Dropzone aria-label="Attachments" value={[first]} onValueChange={changed} />,
    );
    await userEvent.upload(screen.getByLabelText('Attachments'), next);
    expect(changed).toHaveBeenCalledExactlyOnceWith([next]);
    expect(screen.getByRole('list', { name: 'Selected files' })).toHaveTextContent(first.name);
    expect(screen.getByRole('list', { name: 'Selected files' })).not.toHaveTextContent(next.name);
    rerender(<Dropzone aria-label="Attachments" value={[next]} onValueChange={changed} />);
    expect(screen.getByRole('list', { name: 'Selected files' })).toHaveTextContent(next.name);
  });

  it('removes selected files and restores native input focus', async () => {
    const changed = vi.fn();
    render(<Dropzone aria-label="Attachments" onFilesChange={changed} />);
    const input = screen.getByLabelText('Attachments');
    await userEvent.upload(input, documentFile());
    await userEvent.click(screen.getByRole('button', { name: 'Remove review.txt' }));
    expect(changed).toHaveBeenLastCalledWith([]);
    expect(input).toHaveFocus();
    expect((input as HTMLInputElement).files).toHaveLength(0);
    expect(screen.getByRole('status')).toHaveTextContent('No files selected.');
  });

  it.each(['controlled', 'uncontrolled'] as const)(
    'restores %s defaults and clears feedback on form reset',
    async (mode) => {
      const saved = documentFile('saved.txt');
      const { container } = render(
        <form>
          <Dropzone
            aria-label="Attachments"
            accept=".txt"
            {...(mode === 'controlled' ? { value: [saved] } : { defaultValue: [saved] })}
          />
        </form>,
      );
      await userEvent
        .setup({ applyAccept: false })
        .upload(
          screen.getByLabelText('Attachments'),
          new File(['x'], 'wrong.pdf', { type: 'application/pdf' }),
        );
      expect(screen.getByRole('alert')).toBeInTheDocument();
      fireEvent.reset(container.querySelector('form')!);
      await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
      expect(screen.getByRole('list', { name: 'Selected files' })).toHaveTextContent(saved.name);
    },
  );

  it('honors canceled form resets and supports an externally associated form', async () => {
    const { container } = render(
      <>
        <form id="external" onReset={(event) => event.preventDefault()} />
        <Dropzone form="external" aria-label="Attachments" />
      </>,
    );
    await userEvent.upload(screen.getByLabelText('Attachments'), documentFile());
    fireEvent.reset(container.querySelector('form')!);
    await waitFor(() =>
      expect(screen.getByRole('list', { name: 'Selected files' })).toHaveTextContent('review.txt'),
    );
  });

  it('blocks disabled selections and clears an active drag when disabled', () => {
    const changed = vi.fn();
    const { container, rerender } = render(
      <Dropzone aria-label="Attachments" onFilesChange={changed} />,
    );
    const area = container.querySelector('.ui-dropzone-area')!;
    fireEvent.dragEnter(area, { dataTransfer: transfer() });
    expect(container.querySelector('.ui-dropzone')).toHaveAttribute('data-dragging');
    rerender(<Dropzone aria-label="Attachments" disabled onFilesChange={changed} />);
    expect(container.querySelector('.ui-dropzone')).not.toHaveAttribute('data-dragging');
    fireEvent.drop(area, { dataTransfer: transfer([documentFile()]) });
    expect(changed).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Attachments')).toBeDisabled();
  });

  it('supports render state, optional lists, typed slots, local tokens and unstyled composition', () => {
    const file = documentFile();
    const content = vi.fn(({ files, dragging }: DropzoneRenderState) => (
      <span>{dragging ? 'Release files' : `${files.length} attachments`}</span>
    ));
    const { container, rerender } = render(
      <StyleProvider styles={{ 'dropzone.area': 'custom-area' }}>
        <Dropzone
          aria-label="Attachments"
          defaultValue={[file]}
          showFileList={false}
          className="native-input"
          dir="rtl"
          style={tokensToStyle({ 'dropzone.radius': '12px' })}
        >
          {content}
        </Dropzone>
      </StyleProvider>,
    );
    expect(screen.getByText('1 attachments')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(container.querySelector('.custom-area')).toBeInTheDocument();
    expect(screen.getByLabelText('Attachments')).toHaveClass('native-input');
    expect(container.querySelector('.ui-dropzone')).toHaveAttribute('dir', 'rtl');
    expect(
      (container.querySelector('.ui-dropzone') as HTMLElement).style.getPropertyValue(
        '--ui-dropzone-radius',
      ),
    ).toBe('12px');
    rerender(
      <Dropzone aria-label="Attachments" unstyled icon={null} label={null} description={null} />,
    );
    expect(screen.getByLabelText('Attachments').className).toBe('');
    expect(container.querySelector('[class*="ui-"]')).not.toBeInTheDocument();
  });

  it('localizes built-in feedback and renders safely on the server', () => {
    render(
      <LanguageProvider locale="ar">
        <Dropzone aria-label="مرفقات" accept=".txt" />
      </LanguageProvider>,
    );
    expect(screen.getByText('أفلت الملفات هنا')).toBeInTheDocument();
    fireEvent.drop(screen.getByLabelText('مرفقات'), {
      dataTransfer: transfer([new File(['x'], 'wrong.pdf', { type: 'application/pdf' })]),
    });
    expect(screen.getByRole('alert')).toHaveTextContent('نوع الملف غير مقبول');
    expect(renderToString(<Dropzone name="files" />)).toContain('type="file"');
  });
});
