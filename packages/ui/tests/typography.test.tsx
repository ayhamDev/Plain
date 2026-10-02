import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  A,
  Blockquote,
  Code,
  Em,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Li,
  Mark,
  Ol,
  P,
  Pre,
  Small,
  Span,
  Strong,
  Ul,
} from '../src/ui/typography';
import { StyleProvider } from '../src/ui/styling';

describe('semantic typography', () => {
  it('keeps all native tags and heading levels independent from visual size', () => {
    const tags = {
      H1,
      H2,
      H3,
      H4,
      H5,
      H6,
      P,
      Span,
      Small,
      Strong,
      Em,
      A,
      Code,
      Pre,
      Blockquote,
      Mark,
    };
    render(
      <>
        {Object.entries(tags).map(([name, Component]) => (
          <Component key={name} data-testid={name} size="sm">
            {name}
          </Component>
        ))}
        <Ul>
          <Li>Unordered</Li>
        </Ul>
        <Ol start={3}>
          <Li value={4}>Ordered</Li>
        </Ol>
      </>,
    );
    for (const name of Object.keys(tags)) {
      expect(screen.getByTestId(name).tagName.toLowerCase()).toBe(name.toLowerCase());
      expect(screen.getByTestId(name).style.getPropertyValue('--ui-text-size')).toBe('14px');
    }
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('H1');
    expect(screen.getAllByRole('list')).toHaveLength(2);
    expect(screen.getByText('Ordered')).toHaveAttribute('value', '4');
    expect(screen.getByText('Ordered').parentElement).toHaveAttribute('start', '3');
  });

  it('forwards native element refs, link attributes, and consumer handlers', async () => {
    const link = React.createRef<HTMLAnchorElement>();
    const quote = React.createRef<HTMLQuoteElement>();
    const click = vi.fn((event: React.MouseEvent<HTMLAnchorElement>) => event.preventDefault());
    render(
      <>
        <A ref={link} href="/projects" download="projects.txt" onClick={click}>
          Projects
        </A>
        <Blockquote ref={quote} cite="https://example.com">
          Quoted text
        </Blockquote>
      </>,
    );
    expect(link.current).toBe(screen.getByRole('link'));
    expect(quote.current).toBe(screen.getByText('Quoted text'));
    expect(link.current).toHaveAttribute('download', 'projects.txt');
    expect(quote.current).toHaveAttribute('cite', 'https://example.com');
    await userEvent.click(link.current!);
    expect(click).toHaveBeenCalledOnce();
  });

  it('supports slots, local styling, unstyled composition, and logical alignment', () => {
    render(
      <StyleProvider styles={{ 'typography.root': 'brand-text' }}>
        <P
          data-testid="styled"
          tone="muted"
          align="start"
          weight="bold"
          wrap="pretty"
          truncate
          style={{ fontWeight: 500 }}
        >
          Styled text
        </P>
        <P data-testid="bare" unstyled className="app-text">
          Bare text
        </P>
      </StyleProvider>,
    );
    const styled = screen.getByTestId('styled');
    expect(styled).toHaveClass('ui-typography', 'brand-text');
    expect(styled).toHaveAttribute('data-tone', 'muted');
    expect(styled).toHaveAttribute('data-truncate', 'true');
    expect(styled.style.textAlign).toBe('start');
    expect(styled.style.fontWeight).toBe('500');
    expect(styled.style.textWrap).toBe('pretty');
    expect(screen.getByTestId('bare')).toHaveClass('brand-text', 'app-text');
    expect(screen.getByTestId('bare')).not.toHaveClass('ui-typography');
  });
});
