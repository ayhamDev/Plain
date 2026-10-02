# Copy/Paste Examples

This directory is private documentation code, not part of the published UI package.
The gallery contains 120 blocks in twelve categories and 60 templates in five
platform categories. Previews use shared internal implementations to keep the
documentation fast. Consumers receive complete, editable TSX instead.

`npm run generate:compositions` follows each example's dependencies with the
TypeScript compiler API. It includes the required local functions, types, data and
CSS, and changes UI imports to their public package entries. Templates include
their screens and local navigation implementation. No downloaded example depends
on a library block/template renderer, registry or hidden documentation helper.

Generated source and its manifest live under `public/compositions/`; they are
website assets, are reproducible, and are excluded from the npm package. The
gallery fetches code only when requested and limits its source cache. Copy and
download return the same complete module. `verify:package` typechecks all 180
modules in an independent consumer against the real npm archive.

The source uses local prototype data. Authentication, payments, uploads, access
control and persistence require real application integration and server validation.
React DOM platform layouts are not React Native or desktop binaries.
