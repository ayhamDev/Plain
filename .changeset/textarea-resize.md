---
'@plain/ui': minor
---

Add a typed `resize` prop to Textarea with `none`, `vertical`, `horizontal` and `both` modes. Vertical resizing remains the default; `none` removes the native resize handle. Horizontal resizing stays within the parent width, with Field containers able to shrink inside flex/grid layouts to prevent page overflow. Preserve native refs, form props, input appearances and styling overrides, and document all modes in the API and interactive playground.
