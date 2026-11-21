import * as React from 'react';

const usePanelEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;
const cornerDistance = 64;

/** Follow Vaul's real transform without owning its drag, snaps or React state. */
export function usePanelViewport(
  panel: HTMLElement | null,
  side: 'top' | 'bottom' | 'left' | 'right',
  enabled: boolean,
  snapPoints?: readonly (number | string)[],
) {
  usePanelEffect(() => {
    const view = panel?.ownerDocument.defaultView;
    if (!panel || !view || !enabled || panel.dataset.vaulCustomContainer === 'true') return;
    const vertical = side === 'top' || side === 'bottom';
    const sign = side === 'bottom' || side === 'right' ? 1 : -1;
    let frame = 0;
    let extent = 0;
    let crossExtent = 0;
    let viewport = 0;
    let crossViewport = 0;
    let signature = '';
    let lastScale = '';
    const originalScale = panel.style.getPropertyValue('--ui-panel-radius-scale');
    const originalExpandable = panel.getAttribute('data-viewport-expandable');
    const originalCovered = panel.getAttribute('data-viewport-covered');
    const update = () => {
      frame = 0;
      if (!extent || !viewport) return;
      const transform = view.getComputedStyle(panel).transform;
      const matrix = new view.DOMMatrixReadOnly(transform === 'none' ? undefined : transform);
      const translated = vertical ? matrix.m42 : matrix.m41;
      // Scaled background panels still need their corners while a nested panel is open.
      const scaled = Math.abs(matrix.m11 - 1) > 0.001 || Math.abs(matrix.m22 - 1) > 0.001;
      const gap = viewport - extent + sign * translated;
      const scale = (scaled ? 1 : Math.max(0, Math.min(1, gap / cornerDistance))).toFixed(4);
      if (scale !== lastScale) {
        lastScale = scale;
        panel.style.setProperty('--ui-panel-radius-scale', scale);
      }
      const covered =
        !scaled && gap <= 0.5 && extent >= viewport - 1 && crossExtent >= crossViewport - 1;
      if ((panel.dataset.viewportCovered === 'true') !== covered)
        panel.setAttribute('data-viewport-covered', String(covered));
      // Only sample while the engine is actually animating a transform. Pointer
      // moves schedule one frame; a resting panel has no running RAF or timer.
      if (
        panel
          .getAnimations?.()
          .some(
            (animation) =>
              animation.playState === 'running' &&
              animation.effect instanceof KeyframeEffect &&
              animation.effect.getKeyframes().some((keyframe) => keyframe.transform !== undefined),
          )
      )
        schedule();
    };
    const schedule = () => {
      if (!frame) frame = view.requestAnimationFrame(update);
    };
    const resize = () => {
      viewport = vertical ? view.innerHeight : view.innerWidth;
      crossViewport = vertical ? view.innerWidth : view.innerHeight;
      const expandable =
        snapPoints?.some((point) =>
          typeof point === 'number' ? point >= 1 : parseInt(point, 10) >= viewport,
        ) ?? false;
      if ((panel.dataset.viewportExpandable === 'true') !== expandable)
        panel.setAttribute('data-viewport-expandable', String(expandable));
      extent = vertical ? panel.offsetHeight : panel.offsetWidth;
      crossExtent = vertical ? panel.offsetWidth : panel.offsetHeight;
      schedule();
    };
    const styleSignature = () =>
      [
        panel.style.transform,
        panel.style.transition,
        panel.style.height,
        panel.style.width,
        panel.style.maxWidth,
        panel.style.maxHeight,
        panel.style.getPropertyValue('--snap-point-height'),
        panel.getAttribute('class'),
        panel.getAttribute('data-state'),
        panel.getAttribute('data-variant'),
      ].join('|');
    const mutations = new MutationObserver(() => {
      const next = styleSignature();
      if (next === signature) return; // Ignore our own radius/coverage writes.
      signature = next;
      schedule();
    });
    resize();
    signature = styleSignature();
    mutations.observe(panel, {
      attributes: true,
      attributeFilter: ['style', 'class', 'data-state', 'data-variant'],
    });
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(resize);
    observer?.observe(panel);
    view.addEventListener('resize', resize);
    view.visualViewport?.addEventListener('resize', resize);
    panel.addEventListener('transitionrun', schedule);
    panel.addEventListener('animationstart', schedule);
    return () => {
      mutations.disconnect();
      observer?.disconnect();
      view.removeEventListener('resize', resize);
      view.visualViewport?.removeEventListener('resize', resize);
      panel.removeEventListener('transitionrun', schedule);
      panel.removeEventListener('animationstart', schedule);
      if (frame) view.cancelAnimationFrame(frame);
      if (originalScale) panel.style.setProperty('--ui-panel-radius-scale', originalScale);
      else panel.style.removeProperty('--ui-panel-radius-scale');
      for (const [name, value] of [
        ['data-viewport-expandable', originalExpandable],
        ['data-viewport-covered', originalCovered],
      ] as const) {
        if (value === null) panel.removeAttribute(name);
        else panel.setAttribute(name, value);
      }
    };
  }, [panel, side, enabled, snapPoints]);
}
