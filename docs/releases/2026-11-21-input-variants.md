# Shared input appearances

Validated after `f9d4567` on 2026-11-21 with a pending minor Changeset for
`@plain/ui`. The package remains 0.2.0; this record does not imply publication
or deployment.

The input family supports `outlined`, `filled`, `ghost` and `contrast` through
the shared `InputVariant` type. Coverage includes Input, Textarea, NumberInput,
SearchInput, PasswordInput, PinInput, TagsInput, MultiSelect, SelectTrigger,
Combobox, ColorPicker, FileUpload, Dropzone, DatePicker, DateRangePicker,
TimePicker, DateTimePicker, TimeRangePicker and DateTimeRangePicker.
CommandInput accepts the same optional variant and keeps its integrated header
when omitted. SearchView exposes `inputVariant` independently of its surface
mode. DataTableSearch inherits the SearchInput API.

Variants paint the visible control boundary, every PIN slot and both endpoints
of a range. Internal native fields retain their refs, names, values, handlers,
labels, readonly/disabled behavior and form submission. Combobox and DatePicker
use the shared field styling on their native button triggers. Focus retains the
resting border and shows the separate outer outline. Error borders remain
available in all variants; explicitly selected contrast styling stays distinct
from focus. Filled tags retain a separate chip surface.

Shared appearance tokens are `input.filled-background`, `input.ghost-hover`,
`input.contrast-background`, `input.contrast-foreground` and
`input.contrast-border`. Component radius, height, focus and styling slots remain
available. Unstyled controls retain data attributes and behavior without default
variant classes. Documentation adds variant controls and matching source to
all affected field previews, including PIN, CommandInput and upload fields.

Validation:

- All 417 repository tests passed: 9 infrastructure, 402 library and 6 docs tests.
  Fourteen new tests exercise native form values across all appearances, PIN
  paste/completion/reset and refs, search clearing, password reveal, numeric
  controls, tags, unstyled slots and server rendering. Existing tooltip,
  selection, date/time, mobile-picker and control suites also passed. Docs tests
  compile every playground default, enum choice, boolean and numeric boundary.
- TypeScript, ESLint, workspace boundaries, formatting, library/docs builds,
  Changesets status, diff checks and package dry-run passed.
- Installed package verification compiled 106 documented examples and the
  consumer fixture. PIN variants and native Combobox triggers rendered on the
  server with React 18.3.1 and 19.3.0 without leaking a native `variant` attribute.
  The docs archive contains 287 files and is 621,111 bytes. Eager Button/Layout
  gzip remains 19,512/17,776 bytes, below the unchanged 25 kB budgets; existing
  heavy-feature exclusions remain enforced.
- Fourteen Chrome scenarios passed against compiled package/docs code. Eight
  new scenarios cover 20 field/control types in all four variants at 1440px
  light/LTR, 390px dark/LTR and 320px light/RTL, computed surfaces/borders,
  focus without border changes, shared tokens, disabled hover and invalid states,
  selection/picker keyboard interaction, mobile date/time steps and PIN docs
  controls/source. The viewport matrices reported no Axe violations, page errors
  or horizontal document overflow. Six existing focus scenarios verify editing,
  dark/RTL, borderless themes and forced colors. Desktop comparison and a compact
  dark/RTL mobile PIN comparison were visually inspected. Private screenshots
  and logs live under `.preview/input-variants-screenshots` and
  `.preview/input-variants-*.log`.

Browser checks use Chromium emulation. Physical-device and screen-reader testing,
other browser engines and remote CI were not performed in this local run.
