# Global provider localization

Integrated after `941f65a`, with a pending minor Changeset for `@plain/ui`.
The manifest remains the local 0.2.0 candidate; no npm publication is implied.

`PlainProvider` now accepts `locale`, `timeZone`, `messages` and `translations`
alongside theme settings. It supplies the existing language context to every
component, sets client document language and inferred direction, and restores
previous attributes on removal. Explicit direction remains authoritative.
`ThemeScope` supports the same language settings on its own element and portaled
descendants without changing the application document. Standalone
`LanguageProvider` / `TranslationProvider` remain available without a DOM wrapper.
SSR applications supply matching initial `html` language/direction attributes.

Locale tags are canonicalized, inherited dictionaries merge by key through base,
script/region and exact tags, and explicit message overrides remain scoped.
English and Arabic are built in. Other languages use application dictionaries
with English fallback. Numeric string-message placeholders use Intl formatting;
function messages keep raw values and the locale for custom plural rules.
Live language changes retain control values, queries and selected row IDs.

The internal-text audit covers command labels, slider names, tag tooltips,
color-picker instructions, file sizes, table summaries, filter values and numeric
navigation/selection feedback. Calendar captions, dates and week numbers use Intl
with labels consistent with the default engine's Gregorian geometry, including
Persian/Thai locales. Full-calendar and Gantt date labels follow the same geometry.
Chart data alternatives inherit the provider locale. Native refs/props, caller
labels, formatter overrides, raw form values and typed query values remain intact.
Application content and browser-owned text remain under their respective owners.
No dependency, semantic token, styling slot or default palette was added.

The localization guide includes a live English/Arabic/French example with date,
time, table, filtering and selection controls. The package README and packed
consumer document and compile global and scoped provider configuration.

Validation:

- TypeScript, ESLint/workspace boundaries, formatting, library/docs builds,
  installed-package verification and the final npm pack dry run passed.
- All 293 automated tests passed: 9 workspace checks, 278 library tests and
  6 documentation tests. Seventeen localization cases cover provider/document
  lifecycle, direction and timezone inheritance, canonical/script/region
  dictionaries, fallback and complete Arabic keys, numeric conventions, existing
  page-label overrides, live table state, boolean/numeric filters, scoped dialog
  portals, calendar geometry/overrides, time controls, files, commands, sliders,
  tag tooltips, Turkish option matching, charts, full-calendar, Gantt and SSR.
- Eight Chrome 157.0.8103.79 development Playwright cases passed: four localized
  layouts and four existing detached-table control regressions.
- Four final production cases passed at 1440px light/LTR, 800px dark/LTR,
  320px light/LTR and 390px dark/RTL. Each changes English to Arabic to French,
  retains values/search/selection, navigates localized months/years, preserves ISO
  date/time values and exercises responsive time and filter surfaces. Applicable
  scoped Axe WCAG A/AA scans passed. Overlay bounds fit, with no horizontal
  document/example overflow or page errors.
- Sampled desktop, tablet, phone and RTL screenshots were visually inspected.
  Additional production screenshots of an Arabic calendar, Arabic mobile time
  wheels and a French mobile filter sheet were inspected for labels and clipping.
- The verified archive contains 237 files and is 518,401 bytes. All 106 public
  examples and the modular provider/type consumer compile. Package SSR passes with
  React 18.3.1 and 19.3.0. The Button-only bundle is 17,601 bytes gzip, below the
  25kB budget and prior 20,174-byte baseline; unused localized scopes and heavy
  features are excluded. The docs download archive was refreshed.

Evidence is in ignored `.preview/localization-qa/`,
`.preview/localization-*.log` and `.preview/localization-pack-final.json`.
Physical devices, other browser engines, native browser-language settings and
screen-reader sessions were not tested.
