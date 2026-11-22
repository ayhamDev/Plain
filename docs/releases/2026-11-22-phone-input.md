# Phone input

Validated locally on 2026-11-22, based on `3f76f68`. The preceding theme color
palette utility was completed and pushed before this work. A minor Changeset
records this compatible addition; the package remains 0.2.0 and has not been
published or deployed.

`PhoneInput`, `PhoneInputProps`, `PhoneInputDetails` and `PhoneCountry` are exported
from `@plain/ui` and `@plain/ui/phone-input`. The component combines
`react-phone-number-input/max` formatting and metadata with P.UI's country
combobox, command search and collision-aware scoped popover. Country names use
the provider locale, with explicit locale/name overrides. Search accepts names,
ISO codes and calling codes; no flag images are downloaded.

The native ref, field label, descriptions, events and ARIA reach the actual tel
input. Native `onChange` remains separate from normalized `onValueChange` and can
cancel an edit. `name` submits one international value, including its leading +;
incomplete edits can emit partial values. Empty values use an empty string.
Required and possible-length validation participate in native forms; strict
pattern validation and application-owned validation are optional. Native input
length/pattern constraints apply to the formatted display. Extensions and number
ownership verification are outside this component's scope.

Controlled values, rejected controlled edits, native and canceled form resets,
external form owners, disabled/read-only behavior and caret-aware middle edits
are covered. Accepted edits retain the native node and callback ref. Country
selection can be hidden or restricted. All four input variants, input theme
tokens, typed phone-input slots, tooltips, unstyled presentation, scoped portals
and RTL are supported. Telephone digits remain LTR.

The docs include the phone-input page, configurable preview, API reference and
copyable examples. The shared package README and installed-consumer fixture
cover both public entry points.

Verification:

- Sixteen phone-input unit tests passed. Thirty-one existing input-appearance and
  localization regression tests and six documentation preview tests passed.
- Six Chrome 157.0.8103.79 browser checks passed against compiled package code:
  1440px light/LTR, 390px dark/LTR, 320px light/Arabic RTL and a 320x480 viewport.
  Checks include every input appearance, stable focus borders, editable and
  read-only states, keyboard country search and focus restoration, bounded
  popovers, local theme overrides, canonical submission, reset, controlled state,
  middle editing and the docs preview. Axe scans and document overflow checks
  passed. Dark and narrow RTL screenshots were visually inspected.
- The phone-input page and country menu were verified on the existing 5173 docs
  server. It was preserved; compiled checks used an owned 5224 preview.
- TypeScript, ESLint, formatting, workspace boundaries, library/docs builds,
  Changesets planning and diff checks passed.
- Installed-package verification compiled 108 component examples and the
  consumer fixture. Phone input SSR, formatting, canonical form markup and public
  entry identity passed with React 18.3.1 and 19.3.0. Button/Layout eager bundles
  remain 19,512/17,776 bytes gzip and exclude the new phone engines. The refreshed
  archive contains 307 files and is 658,174 bytes.

Evidence is under `.preview/phone-*`. The full repository suite, physical devices,
screen readers, other browser engines and remote CI were not exercised.
