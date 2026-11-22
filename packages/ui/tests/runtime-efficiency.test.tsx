import * as React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from '../src/ui/media-query';
import { StyleProvider, useStyles } from '../src/ui/style-context';

afterEach(() => vi.restoreAllMocks());

describe('shared responsive subscriptions', () => {
  it('shares one native listener per query and releases it after the last consumer', () => {
    let matches = false;
    const changes = new Set<() => void>();
    const add = vi.fn((_event: string, listener: () => void) => changes.add(listener));
    const remove = vi.fn((_event: string, listener: () => void) => changes.delete(listener));
    const match = vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) =>
        ({
          media: query,
          get matches() {
            return matches;
          },
          addEventListener: add,
          removeEventListener: remove,
        }) as unknown as MediaQueryList,
    );
    function Consumer({ name }: { name: string }) {
      return <output aria-label={name}>{String(useMediaQuery('(max-width: 767px)'))}</output>;
    }
    function Fixture({ second = true }) {
      return (
        <>
          <Consumer name="first" />
          {second && <Consumer name="second" />}
        </>
      );
    }
    const { rerender, unmount } = render(<Fixture />);
    expect(match).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledTimes(1);
    act(() => {
      matches = true;
      changes.forEach((listener) => listener());
    });
    expect(screen.getByLabelText('first')).toHaveTextContent('true');
    expect(screen.getByLabelText('second')).toHaveTextContent('true');
    rerender(<Fixture second={false} />);
    expect(remove).not.toHaveBeenCalled();
    unmount();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(changes.size).toBe(0);
  });

  it('does not create or subscribe to a query when responsiveness is disabled', () => {
    const match = vi.spyOn(window, 'matchMedia');
    function Fixed() {
      return <output>{String(useMediaQuery('(min-width: 800px)', false))}</output>;
    }
    const { rerender } = render(<Fixed />);
    rerender(<Fixed />);
    expect(match).not.toHaveBeenCalled();
  });
});

it('does not invalidate styled memoized children during a no-op provider render', () => {
  const renders = vi.fn();
  const Child = React.memo(function Child() {
    renders();
    const styles = useStyles();
    return <div {...styles('input.root', '', undefined)}>Stable styles</div>;
  });
  const { rerender } = render(
    <StyleProvider>
      <Child />
    </StyleProvider>,
  );
  rerender(
    <StyleProvider>
      <Child />
    </StyleProvider>,
  );
  expect(renders).toHaveBeenCalledTimes(1);
});
