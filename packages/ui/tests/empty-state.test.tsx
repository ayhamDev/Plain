import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Button,
  EmptyState,
  EmptyStateMedia,
  EmptyStateContent,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
  EmptyStateFooter,
} from '../src/ui/primitives';
import { PlainProvider } from '../src/ui/styling';

describe('composable empty states', () => {
  it('preserves shorthand, native refs and independent unlimited actions', async () => {
    const ref = createRef<HTMLDivElement>();
    const choose = vi.fn();
    const { container, rerender } = render(
      <EmptyState
        ref={ref}
        aria-label="Projects"
        title="No projects"
        action={<Button onClick={choose}>Legacy action</Button>}
      />,
    );
    expect(ref.current).toBe(screen.getByLabelText('Projects'));
    await userEvent.click(screen.getByRole('button', { name: 'Legacy action' }));
    expect(choose).toHaveBeenCalledOnce();
    rerender(
      <EmptyState
        ref={ref}
        title="No projects"
        action={<Button>Legacy action</Button>}
        actions={Array.from({ length: 12 }, (_, i) => (
          <Button key={i} disabled={i === 11} onClick={() => choose(i)}>
            Action {i + 1}
          </Button>
        ))}
        footer={<a href="/help">Read the guide</a>}
      />,
    );
    expect(screen.queryByText('Legacy action')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(12);
    await userEvent.click(screen.getByRole('button', { name: 'Action 7' }));
    expect(choose).toHaveBeenLastCalledWith(6);
    await userEvent.click(screen.getByRole('button', { name: 'Action 12' }));
    expect(choose).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('link', { name: 'Read the guide' })).toHaveAttribute('href', '/help');
    rerender(
      <EmptyState title="No projects" action={<Button>Legacy action</Button>} actions={null} />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    rerender(<EmptyState title="No projects" actions={false} footer={false} />);
    expect(container.querySelector('[data-slot="action"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="footer"]')).not.toBeInTheDocument();
  });

  it('allows custom media and explicitly hides the default icon', () => {
    const { container, rerender } = render(<EmptyState title="Empty" />);
    expect(container.querySelector('[data-slot="icon-wrapper"] svg')).toBeInTheDocument();
    for (const icon of [null, false]) {
      rerender(<EmptyState title="Empty" icon={icon} />);
      expect(container.querySelector('[data-slot="icon-wrapper"]')).not.toBeInTheDocument();
    }
    rerender(
      <EmptyState
        title="Empty"
        media={<img alt="A folder awaiting files" src="/illustration.svg" />}
      />,
    );
    expect(screen.getByRole('img', { name: 'A folder awaiting files' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="icon-wrapper"]')).not.toBeInTheDocument();
    rerender(<EmptyState title="Empty" media={null} icon={<span>Hidden icon</span>} />);
    expect(screen.queryByText('Hidden icon')).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="media"]')).not.toBeInTheDocument();
  });

  it('composes a native form, rich description, semantic heading and custom footer', async () => {
    const titleRef = createRef<HTMLHeadingElement>();
    const mediaRef = createRef<HTMLDivElement>();
    const footerRef = createRef<HTMLDivElement>();
    const submit = vi.fn();
    const { container } = render(
      <EmptyState title="Ignored shorthand" actions={<Button>Ignored action</Button>}>
        <EmptyStateMedia ref={mediaRef} variant="icon" shape="circle" aria-hidden="true">
          P
        </EmptyStateMedia>
        <EmptyStateContent>
          <EmptyStateTitle ref={titleRef} asChild>
            <h2 id="empty-heading">Create your first project</h2>
          </EmptyStateTitle>
          <EmptyStateDescription asChild>
            <div>
              <p>Bring your team together.</p>
              <ul>
                <li>Invite colleagues</li>
                <li>Share files</li>
              </ul>
            </div>
          </EmptyStateDescription>
          <form
            aria-labelledby="empty-heading"
            onSubmit={(event) => {
              event.preventDefault();
              submit(new FormData(event.currentTarget).get('project'));
            }}
          >
            <label>
              Project name
              <input name="project" required />
            </label>
            <EmptyStateActions layout="column" align="start">
              <Button type="submit">Create project</Button>
              <Button asChild variant="outline">
                <a href="/import">Import a project</a>
              </Button>
            </EmptyStateActions>
          </form>
          <EmptyStateFooter ref={footerRef}>
            <span>Need help?</span>
            <a href="/help">Read the guide</a>
          </EmptyStateFooter>
        </EmptyStateContent>
      </EmptyState>,
    );
    expect(titleRef.current).toBe(screen.getByRole('heading', { level: 2 }));
    expect(mediaRef.current).toHaveAttribute('aria-hidden', 'true');
    expect(footerRef.current).toHaveTextContent('Need help?');
    expect(screen.queryByText('Ignored shorthand')).not.toBeInTheDocument();
    expect(screen.queryByText('Ignored action')).not.toBeInTheDocument();
    expect(container.querySelector('p ul')).not.toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox', { name: 'Project name' }), 'Launch');
    fireEvent.submit(screen.getByRole('form', { name: 'Create your first project' }));
    expect(submit).toHaveBeenCalledWith('Launch');
  });

  it('keeps styling slots, caller props and inherited unstyled behavior on every part', () => {
    const { container, rerender } = render(
      <PlainProvider
        persist={false}
        styles={{ 'empty-state.media': 'custom-media', 'empty-state.footer': 'custom-footer' }}
      >
        <EmptyState
          unstyled
          variant="outlined"
          size="sm"
          align="start"
          dir="rtl"
          style={{ padding: 12 }}
        >
          <EmptyStateMedia>Media</EmptyStateMedia>
          <EmptyStateContent>
            <EmptyStateTitle>Empty</EmptyStateTitle>
            <EmptyStateDescription>Nothing here yet.</EmptyStateDescription>
            <EmptyStateActions>
              <Button>Start</Button>
            </EmptyStateActions>
            <EmptyStateFooter>Help</EmptyStateFooter>
          </EmptyStateContent>
        </EmptyState>
      </PlainProvider>,
    );
    const root = container.querySelector('[data-slot="root"][data-ui="empty-state"]');
    expect(root).toHaveStyle({ padding: '12px' });
    expect(root).toHaveAttribute('dir', 'rtl');
    expect(container.querySelector('.custom-media')).toHaveTextContent('Media');
    expect(container.querySelector('.custom-footer')).toHaveTextContent('Help');
    expect(container.querySelector('[class*="ui-empty-state"]')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).not.toHaveClass('ui-interactive');
    rerender(<EmptyState title="Default" />);
    expect(screen.getByRole('heading')).toHaveAttribute('data-slot', 'title');
  });
});
