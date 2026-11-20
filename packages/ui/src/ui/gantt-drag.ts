import * as React from 'react';
import { ganttEdit, type GanttEditMode } from './gantt-model';
import type { GanttTask } from './gantt';

export function useGanttDrag<T>(
  viewport: React.RefObject<HTMLDivElement | null>,
  px: number,
  dir: 'ltr' | 'rtl',
  snapDays: number,
  onCommit?: (next: GanttTask<T>, previous: GanttTask<T>, reason: 'move' | 'resize') => void,
) {
  const [preview, setPreview] = React.useState<{ id: string; start: string; end: string }>();
  const suppressClick = React.useRef(false);
  const active = React.useRef<{
    task: GanttTask<T>;
    mode: GanttEditMode;
    pointer: number;
    element: HTMLElement;
    x: number;
    scroll: number;
    delta: number;
    moved: boolean;
  }>(undefined);
  const finish = React.useCallback(
    (commit: boolean) => {
      const drag = active.current;
      active.current = undefined;
      setPreview(undefined);
      if (!drag) return;
      if (drag.element.hasPointerCapture(drag.pointer))
        drag.element.releasePointerCapture(drag.pointer);
      if (drag.moved) suppressClick.current = true;
      const dates = ganttEdit(drag.task, drag.mode, drag.delta);
      if (
        commit &&
        drag.moved &&
        dates &&
        (dates.start !== drag.task.start || dates.end !== drag.task.end)
      )
        onCommit?.({ ...drag.task, ...dates }, drag.task, drag.mode === 'move' ? 'move' : 'resize');
    },
    [onCommit],
  );
  React.useEffect(() => {
    // A zoom or direction change invalidates the gesture's pixel-to-date mapping.
    const drag = active.current;
    active.current = undefined;
    if (drag?.element.hasPointerCapture(drag.pointer))
      drag.element.releasePointerCapture(drag.pointer);
    setPreview(undefined);
  }, [px, dir]);
  React.useEffect(
    () => () => {
      const drag = active.current;
      active.current = undefined;
      if (drag?.element.hasPointerCapture(drag.pointer))
        drag.element.releasePointerCapture(drag.pointer);
    },
    [],
  );
  const handlers = (task: GanttTask<T>, mode: GanttEditMode) => ({
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      suppressClick.current = false;
      if (
        !onCommit ||
        active.current ||
        !event.isPrimary ||
        task.disabled ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      event.currentTarget.focus();
      event.currentTarget.setPointerCapture(event.pointerId);
      active.current = {
        task,
        mode,
        pointer: event.pointerId,
        element: event.currentTarget,
        x: event.clientX,
        scroll: viewport.current?.scrollLeft ?? 0,
        delta: 0,
        moved: false,
      };
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      const drag = active.current;
      if (!drag || drag.pointer !== event.pointerId) return;
      const offset =
        (event.clientX - drag.x + (viewport.current?.scrollLeft ?? 0) - drag.scroll) *
        (dir === 'rtl' ? -1 : 1);
      if (!drag.moved && Math.abs(offset) < 4) return;
      drag.moved = true;
      event.preventDefault();
      const delta = Math.round(offset / px / snapDays) * snapDays;
      if (delta === drag.delta) return;
      drag.delta = delta;
      const dates = ganttEdit(drag.task, drag.mode, delta);
      if (dates) setPreview({ id: task.id, ...dates });
    },
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
      if (active.current?.pointer === event.pointerId) finish(true);
    },
    onPointerCancel: (event: React.PointerEvent<HTMLElement>) => {
      if (active.current?.pointer === event.pointerId) finish(false);
    },
    onLostPointerCapture: (event: React.PointerEvent<HTMLElement>) => {
      if (active.current?.pointer === event.pointerId) finish(false);
    },
  });
  return {
    preview,
    handlers,
    cancel: () => finish(false),
    preventClick: (event: React.MouseEvent) => {
      if (!suppressClick.current) return false;
      suppressClick.current = false;
      event.preventDefault();
      event.stopPropagation();
      return true;
    },
  };
}
