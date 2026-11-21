import * as React from 'react';
import { useStyles } from './styling';

const usePanelEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;
const appearanceAttributes = [
  'class',
  'data-state',
  'data-ui-motion',
  'data-variant',
  'data-size',
  'data-vaul-snap-points',
  'data-vaul-animate',
  'data-vaul-custom-container',
  'data-viewport-expandable',
];

/** A decorative sibling: the dialog keeps its native scrolling, refs and hit area. */
export function PanelOverflowFill({
  panel,
  side,
}: {
  panel: HTMLElement;
  side: 'top' | 'bottom' | 'left' | 'right';
}) {
  const styles = useStyles();
  const fillRef = React.useRef<HTMLDivElement>(null);
  usePanelEffect(() => {
    const fill = fillRef.current;
    const view = panel.ownerDocument.defaultView;
    if (!fill || !view) return;
    let idleTransform = 'none';
    let previousStyle = '';
    const layoutStyle = () =>
      [
        Array.from(panel.style)
          .filter((name) => name !== 'transform' && name !== '--ui-panel-radius-scale')
          .map((name) => `${name}:${panel.style.getPropertyValue(name)}`)
          .join(';'),
        ...appearanceAttributes.map((name) => panel.getAttribute(name) ?? ''),
      ].join('|');
    const move = () => {
      fill.style.transform = panel.style.transform || idleTransform;
    };
    const refresh = () => {
      previousStyle = layoutStyle();
      const computed = view.getComputedStyle(panel);
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const enabled =
        computed.position === 'fixed' &&
        width > 0 &&
        height > 0 &&
        (panel.dataset.variant === 'attached' ||
          panel.dataset.size === 'full' ||
          (panel.dataset.viewportExpandable === 'true' &&
            Number(computed.getPropertyValue('--ui-panel-radius-scale')) < 1)) &&
        panel.dataset.vaulCustomContainer !== 'true';
      fill.style.visibility = enabled ? 'visible' : 'hidden';
      if (!enabled) return;
      let left = panel.offsetLeft;
      let top = panel.offsetTop;
      // Cover the attachment border plus one pixel for fractional drag transforms.
      // Without the small overlap, antialiasing can leave a hairline at the join.
      if (side === 'bottom') top += height - (parseFloat(computed.borderBottomWidth) || 0) - 1;
      if (side === 'top') top -= height - (parseFloat(computed.borderTopWidth) || 0) - 1;
      if (side === 'right') left += width - (parseFloat(computed.borderRightWidth) || 0) - 1;
      if (side === 'left') left -= width - (parseFloat(computed.borderLeftWidth) || 0) - 1;
      Object.assign(fill.style, {
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        background: computed.background,
        opacity: computed.opacity,
        backdropFilter: computed.backdropFilter,
        animation: computed.animation,
        transition: computed.transition,
      });
      fill.parentElement!.style.zIndex = computed.zIndex;
      // Match Vaul's percentage-based entry/exit motion using the same box size.
      for (const name of ['--initial-transform', '--snap-point-height']) {
        fill.style.setProperty(name, computed.getPropertyValue(name));
      }
      idleTransform = computed.transform;
      move();
    };
    refresh();
    const observer = new MutationObserver(() => {
      if (layoutStyle() !== previousStyle) {
        refresh();
      } else {
        // Vaul mutates its transform while dragging. Mirror it before paint;
        // no React update, layout measurement or computed-style read per move.
        move();
      }
    });
    observer.observe(panel, {
      attributes: true,
      attributeFilter: ['style', ...appearanceAttributes],
    });
    const ancestors = new MutationObserver(refresh);
    for (let ancestor = panel.parentElement; ancestor; ancestor = ancestor.parentElement) {
      ancestors.observe(ancestor, {
        attributes: true,
        attributeFilter: [
          'style',
          'class',
          'data-theme',
          'data-motion',
          'data-density',
          'data-borders',
        ],
      });
    }
    const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(refresh);
    resize?.observe(panel);
    view.addEventListener('resize', refresh);
    return () => {
      observer.disconnect();
      ancestors.disconnect();
      resize?.disconnect();
      view.removeEventListener('resize', refresh);
    };
  }, [panel, side]);
  return (
    <div className="ui-panel-overflow-clip" aria-hidden="true">
      <div
        ref={fillRef}
        {...styles('sheet.overflow-fill', 'ui-panel-overflow-fill')}
        data-side={side}
        aria-hidden="true"
        style={{ visibility: 'hidden' }}
      />
    </div>
  );
}
