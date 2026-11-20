---
'@plain/ui': minor
---

ScrollArea and ScrollBar now animate a wider thumb on hover and drag while keeping
the overlay hit area and viewport geometry fixed. Add base/hover size controls and
an opt-out, using the existing scrollbar.width and new scrollbar.hover-width tokens.

Add opt-in scroll-aware faded content edges with configurable logical edges,
distance, intensity, persistent mode and boundary tolerance. Masking preserves the
underlying surface rather than painting a fixed background color. Resize/content
changes update the edge state without React renders on scroll. Keyboard-visible
focus and forced colors remove the mask; reduced/none motion suppresses transitions.
The default remains no edge fade, and existing viewport refs and scroll handlers
retain their native targets.
