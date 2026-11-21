import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemTrailing,
  ItemActions,
} from '../src/ui/item';
import { StyleProvider } from '../src/ui/styling';

describe('Item interaction contracts', () => {
  it('uses a native action button without implicit selection or form submission', async () => {
    const user = userEvent.setup(),
      click = vi.fn(),
      submit = vi.fn();
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <form onSubmit={submit}>
        <Item ref={ref} onClick={click} name="file" value="index.ts">
          Open file
        </Item>
      </form>,
    );
    const item = screen.getByRole('button', { name: 'Open file' });
    expect(ref.current).toBe(item);
    await user.tab();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(click).toHaveBeenCalledTimes(2);
    expect(submit).not.toHaveBeenCalled();
    expect(item).not.toHaveAttribute('aria-pressed');
    expect(item).toHaveAttribute('name', 'file');
  });
  it('toggles uncontrolled selection with native mouse and keyboard activation', async () => {
    const user = userEvent.setup(),
      change = vi.fn();
    render(
      <Item defaultSelected onSelectedChange={change}>
        Choose file
      </Item>,
    );
    const item = screen.getByRole('button', { name: 'Choose file' });
    expect(item).toHaveAttribute('aria-pressed', 'true');
    await user.click(item);
    expect(item).toHaveAttribute('aria-pressed', 'false');
    await user.keyboard(' ');
    expect(item).toHaveAttribute('aria-pressed', 'true');
    expect(change.mock.calls.map(([value]) => value)).toEqual([false, true]);
  });
  it('keeps controlled selection owned by its caller and honors cancellation', async () => {
    const user = userEvent.setup(),
      change = vi.fn();
    const { rerender } = render(
      <Item selected={false} onSelectedChange={change}>
        Controlled file
      </Item>,
    );
    const item = screen.getByRole('button', { name: 'Controlled file' });
    await user.click(item);
    expect(change).toHaveBeenLastCalledWith(true);
    expect(item).toHaveAttribute('aria-pressed', 'false');
    rerender(
      <Item selected onSelectedChange={change} onClick={(event) => event.preventDefault()}>
        Controlled file
      </Item>,
    );
    await user.click(item);
    expect(change).toHaveBeenCalledTimes(1);
    expect(item).toHaveAttribute('aria-pressed', 'true');
  });
  it('preserves a composed link, ref, native attributes and child cancellation', async () => {
    const user = userEvent.setup(),
      change = vi.fn(),
      click = vi.fn();
    const ref = React.createRef<HTMLAnchorElement>();
    render(
      <Item asChild selected ref={ref} onSelectedChange={change} onClick={click}>
        <a
          href="#file"
          target="_blank"
          download="index.ts"
          onClick={(event) => event.preventDefault()}
        >
          Source file
        </a>
      </Item>,
    );
    const item = screen.getByRole('link', { name: 'Source file' });
    expect(ref.current).toBe(item);
    expect(item).toHaveAttribute('href', '#file');
    expect(item).toHaveAttribute('download', 'index.ts');
    expect(item).toHaveAttribute('aria-current', 'true');
    expect(item).not.toHaveAttribute('aria-pressed');
    await user.click(item);
    expect(click).toHaveBeenCalledOnce();
    expect(change).not.toHaveBeenCalled();
  });
  it('blocks disabled native and composed controls before their handlers and restores a link', async () => {
    const user = userEvent.setup(),
      childClick = vi.fn(),
      click = vi.fn(),
      change = vi.fn();
    const { rerender } = render(
      <>
        <Item disabled onClick={click}>
          Disabled action
        </Item>
        <Item asChild disabled defaultSelected onClick={click} onSelectedChange={change}>
          <a href="#destination" onClick={childClick}>
            Disabled link
          </a>
        </Item>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Disabled action' })).toBeDisabled();
    const link = screen.getByText('Disabled link');
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('tabindex', '-1');
    fireEvent.click(link);
    fireEvent(link, new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 }));
    expect(childClick).not.toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();
    rerender(
      <Item asChild onClick={click}>
        <a href="#destination" onClick={childClick}>
          Disabled link
        </a>
      </Item>,
    );
    await user.click(screen.getByRole('link', { name: 'Disabled link' }));
    expect(childClick).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
  });
  it('supports rich static rows with independent actions and no outer selection activation', async () => {
    const user = userEvent.setup(),
      action = vi.fn(),
      change = vi.fn();
    const ref = React.createRef<HTMLSpanElement>();
    const { container } = render(
      <Item interactive={false} selected onSelectedChange={change}>
        <ItemMedia>TS</ItemMedia>
        <ItemContent ref={ref}>
          <ItemTitle>index.ts</ItemTitle>
          <ItemDescription>Public exports</ItemDescription>
        </ItemContent>
        <ItemTrailing>2 KB</ItemTrailing>
        <ItemActions>
          <button type="button" onClick={action}>
            Rename file
          </button>
        </ItemActions>
      </Item>,
    );
    expect(container.querySelector('[data-ui="item"][data-slot="root"]')?.tagName).toBe('DIV');
    expect(ref.current).toContainElement(screen.getByText('index.ts'));
    await user.click(screen.getByRole('button', { name: 'Rename file' }));
    expect(action).toHaveBeenCalledOnce();
    expect(change).not.toHaveBeenCalled();
    expect(container.querySelector('[aria-pressed]')).toBeNull();
  });
  it('uses the final child selection role without adding incompatible button state', () => {
    render(
      <div role="listbox" aria-label="Files">
        <Item asChild selected role="button">
          <button role="option">File option</button>
        </Item>
      </div>,
    );
    const item = screen.getByRole('option');
    expect(item).toHaveAttribute('aria-selected', 'true');
    expect(item).not.toHaveAttribute('aria-pressed');
  });
  it('retains native interactions and caller classes under unstyled composition', async () => {
    const user = userEvent.setup();
    render(
      <StyleProvider unstyled>
        <Item defaultSelected className="app-row">
          <ItemContent>
            <ItemTitle>Unstyled file</ItemTitle>
          </ItemContent>
        </Item>
      </StyleProvider>,
    );
    const item = screen.getByRole('button', { name: 'Unstyled file' });
    expect(item.className).toBe('app-row');
    await user.click(item);
    expect(item).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Unstyled file').className).toBe('');
  });
  it('supports the shared tooltip prop on icon-only items', async () => {
    const user = userEvent.setup();
    render(
      <Item tooltip={{ content: 'Open source file', delayDuration: 0 }}>
        <svg aria-hidden="true" />
      </Item>,
    );
    const item = screen.getByRole('button', { name: 'Open source file' });
    await user.tab();
    expect(item).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Open source file');
  });
  it('renders selected native semantics on the server without leaking component props', () => {
    const html = renderToString(
      <Item defaultSelected size="sm">
        <ItemContent>
          <ItemTitle>Server file</ItemTitle>
        </ItemContent>
      </Item>,
    );
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('type="button"');
    expect(html).toContain('Server file');
    expect(html).not.toMatch(/\s(?:selected|defaultSelected|interactive|size)=/);
  });
});
