---
'@plain/ui': minor
---

Replace the detached circular QR decoration with an integrated dot field on the encoded matrix grid. Circular codes use a larger readable matrix, slightly spaced dots and round dotted finder rings with solid centers. Keep the encoded data, full function modules, finder separators, deterministic SSR, animation and SVG exports intact. Add finderShape="dots" and circlePattern="integrated" | "separated"; true selects the integrated default, separated retains a square quiet zone, and false removes the outer pattern. Circular margin surrounds the full silhouette in integrated mode. Existing square defaults and explicit styling overrides remain supported.
