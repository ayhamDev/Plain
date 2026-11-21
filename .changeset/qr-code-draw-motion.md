---
'@plain/ui': minor
---

Replace all previous QR code animation effects with a single draw animation. Corner markers trace into place and alternating ink strokes write the pattern, then leave the complete code still. Drawing runs once on mount or encoded content changes, defaults to 1000ms, and respects duration/delay overrides, animation opt-out and reduced/none motion policies. The SVG mask uses at most 48 writing strokes, independently of matrix density; completed codes and standalone SVG downloads retain their encoded geometry.

Use `animation={{ preset: 'draw' }}` or the default `animation={true}`. Older preset names remain accepted as aliases for draw. The `qr-code.draw-stroke`, `draw-anchor`, `draw-center` and `draw-complete` slots replace the former `motion-tile`, `motion-anchor` and `scan` slots.
