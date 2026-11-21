import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  Drawer,
  DrawerContent,
} from '../src/ui/overlays';
import { Slider } from '../src/ui/forms';

afterEach(() => vi.restoreAllMocks());
describe('safe panel gesture initiation', () => {
  for (const kind of ['sheet', 'drawer']) {
    it(`${kind} starts body dragging while retaining refs and native pointer callbacks`, () => {
      const Root = kind === 'sheet' ? Sheet : Drawer,
        Content = kind === 'sheet' ? SheetContent : DrawerContent;
      const capture = vi.spyOn(Element.prototype, 'setPointerCapture');
      const ref = React.createRef<HTMLDivElement>();
      const down = vi.fn((event: React.PointerEvent<HTMLDivElement>) =>
        expect(event.currentTarget).toBe(ref.current),
      );
      render(
        <Root defaultOpen>
          <Content ref={ref} onPointerDown={down} style={{ transform: 'none' }}>
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>Workspace settings.</SheetDescription>
            <div data-testid="body">Body area</div>
          </Content>
        </Root>,
      );
      const panel = screen.getByRole('dialog', { name: 'Settings' });
      expect(ref.current).toBe(panel);
      fireEvent.pointerDown(screen.getByTestId('body'), { pointerId: 1, button: 0 });
      expect(down).toHaveBeenCalledOnce();
      expect(capture).toHaveBeenCalledOnce();
      expect(capture.mock.instances[0]).toBe(screen.getByTestId('body'));
      fireEvent.pointerUp(screen.getByTestId('body'));
    });
  }
  it('does not capture controls, slider tracks, editable regions or custom widgets', () => {
    const capture = vi.spyOn(Element.prototype, 'setPointerCapture'),
      down = vi.fn();
    render(
      <Sheet defaultOpen>
        <SheetContent onPointerDown={down}>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>Workspace settings.</SheetDescription>
          <input aria-label="Name" />
          <Slider defaultValue={[30]} />
          <div contentEditable suppressContentEditableWarning data-testid="editor">
            Edit text
          </div>
          <div data-vaul-no-drag>
            <span data-testid="custom">Custom widget</span>
          </div>
          <p data-testid="prose">Selectable text</p>
          <button type="button">Action</button>
        </SheetContent>
      </Sheet>,
    );
    const targets = [
      screen.getByRole('textbox', { name: 'Name' }),
      screen
        .getByRole('slider')
        .closest('[data-ui="slider"][data-slot="root"]')!
        .querySelector('[data-slot="track"]')!,
      screen.getByTestId('editor'),
      screen.getByTestId('custom'),
      screen.getByTestId('prose'),
      screen.getByRole('button', { name: 'Action' }),
    ];
    for (const target of targets) {
      fireEvent.pointerDown(target, { pointerId: 1, button: 0 });
      fireEvent.pointerUp(target);
    }
    expect(down).toHaveBeenCalledTimes(targets.length);
    expect(capture.mock.instances).toEqual([targets[1]]);
  });
  it('honors handleOnly and caller cancellation before Vaul captures the pointer', () => {
    const capture = vi.spyOn(Element.prototype, 'setPointerCapture');
    function Example({ handleOnly = false, prevent = false }) {
      return (
        <Sheet defaultOpen handleOnly={handleOnly}>
          <SheetContent
            onPointerDown={(event) => {
              if (prevent) event.preventDefault();
            }}
          >
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>Workspace settings.</SheetDescription>
            <div data-testid="body">Body area</div>
          </SheetContent>
        </Sheet>
      );
    }
    const { rerender } = render(<Example prevent />);
    fireEvent.pointerDown(screen.getByTestId('body'), { pointerId: 1, button: 0 });
    expect(capture).not.toHaveBeenCalled();
    rerender(<Example handleOnly />);
    fireEvent.pointerDown(screen.getByTestId('body'), { pointerId: 1, button: 0 });
    expect(capture).not.toHaveBeenCalled();
  });
  it('preserves an asChild surface without adding a DOM wrapper', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Sheet defaultOpen>
        <SheetContent asChild ref={ref} showHandle={false} showClose={false}>
          <article>
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>Workspace settings.</SheetDescription>
          </article>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.getByRole('dialog')).toBe(ref.current);
    expect(screen.getByRole('dialog').tagName).toBe('ARTICLE');
  });
});
