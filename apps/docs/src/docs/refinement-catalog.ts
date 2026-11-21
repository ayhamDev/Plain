import type { ComponentDefinition, PropDefinition } from './catalog';
const p = (
  name: string,
  type: string,
  description: string,
  defaultValue?: string,
): PropDefinition => ({ name, type, description, defaultValue });
export const refinementComponents: ComponentDefinition[] = [
  {
    slug: 'list',
    name: 'List',
    category: 'Layout',
    description: 'Composable collections with explicit browsing and selection modes.',
    imports: ['List', 'ListItemTitle', 'ListItemDescription'],
    code: '<List items={[{ id: "design", title: "Design review", description: "Notes from the team" }, { id: "release", title: "Release checklist", description: "Package verification" }]} getItemKey={item => item.id} getItemLabel={item => item.title} selectable defaultMode="browse" renderItem={item => <><ListItemTitle>{item.title}</ListItemTitle><ListItemDescription>{item.description}</ListItemDescription></>} />',
    props: [
      p(
        'items / getItemKey',
        'readonly T[] / (item: T) => string',
        'Records and stable keys; filtering, loading and transport remain application-owned.',
      ),
      p(
        'renderItem / renderLeading / renderTrailing',
        '(item, state) => ReactNode',
        'Compose arbitrary row content. State exposes selectionMode, selected and disabled.',
      ),
      p('selectable', 'boolean', 'Enable selection and the Select/Done controls.', 'false'),
      p(
        'mode / defaultMode / onModeChange',
        'browse | selection / callback',
        'Controlled or uncontrolled interaction mode. Browsing has no checkboxes.',
        'browse',
      ),
      p(
        'selectedKeys / defaultSelectedKeys / onSelectedKeysChange',
        'readonly string[] / callback',
        'Selection survives pagination or filtering when owned by the application.',
      ),
      p('selectionType', 'single | multiple', 'Allow one or many selected rows.', 'multiple'),
      p('selectionActions', '(keys, clear) => ReactNode', 'Application-owned bulk actions.'),
      p(
        'showSelectionControls / clearSelectionOnExit',
        'boolean',
        'Opt out of built-in mode controls or retain selection on Done.',
        'true',
      ),
      p(
        'density / dividers / loading / renderEmpty',
        'options',
        'Row spacing, separators, loading placeholders and custom empty content.',
      ),
    ],
    accessibility:
      'Native list and checkbox semantics. Checkbox labels come from getItemLabel or stable keys. Nested buttons and links keep their own actions; keyboard users select with native checkboxes. The list does not impose an application schema or treat arbitrary interactive row content as a listbox.',
    usage:
      'Selected items are indicated by their checkboxes; selection does not fill the row. Enabled rows have the same hover treatment in browse and selection modes on devices that support hover. data-selected and the render state remain available for application styling. Long content wraps within the row.',
  },
  {
    slug: 'navigation-rail',
    name: 'Navigation rail',
    category: 'Navigation',
    description: 'A persistent icon column for app or workspace switching alongside Sidebar.',
    imports: [
      'NavigationRail',
      'SidebarProvider',
      'Sidebar',
      'SidebarHeader',
      'SidebarContent',
      'SidebarItem',
      'SidebarInset',
      'SidebarTrigger',
    ],
    code: '<SidebarProvider><NavigationRail aria-label="Workspaces" items={[{ value: "projects", label: "Projects", icon: <span>P</span> }, { value: "inbox", label: "Inbox", icon: <span>I</span>, badge: 3 }]} /><Sidebar><SidebarHeader>Workspace</SidebarHeader><SidebarContent><SidebarItem>Overview</SidebarItem><SidebarItem>Activity</SidebarItem></SidebarContent></Sidebar><SidebarInset><SidebarTrigger />Project workspace</SidebarInset></SidebarProvider>',
    props: [
      p(
        'items',
        'BottomNavigationItem[]',
        'Stable values, names, icons or avatars, links, badges and disabled states.',
      ),
      p(
        'value / defaultValue / onValueChange',
        'string / callback',
        'Controlled or uncontrolled active workspace.',
      ),
      p(
        'header / footer',
        'ReactNode',
        'Compose an app mark, search, account, or other independent tools.',
      ),
      p(
        'variant / side / width',
        'attached | inset | floating / start | end / CSS length',
        'Rail appearance, logical edge and width.',
      ),
      p(
        'hideOnMobile',
        'boolean',
        'Hide below 768px; use Sidebar and BottomNavigation for mobile navigation.',
        'true',
      ),
    ],
    accessibility:
      'A named navigation landmark with native links/buttons, disabled states and aria-current. Icon controls have accessible labels and tooltips. NavigationRail is the workspace column; the legacy SidebarRail remains the narrow collapse edge control.',
  },
];
export const refinementProps: Record<string, PropDefinition[]> = {
  'multi-select': [
    p(
      'selectionDisplay',
      'tags | summary',
      'Choose removable tags or a compact text summary with the same single-row height as Select. Both preserve selection labels, keyboard filtering and named form values.',
      'tags',
    ),
  ],
  card: [
    p(
      'variant',
      'outlined | filled | elevated | ghost',
      'Token-based card surface and elevation.',
      'outlined',
    ),
    p('size', 'sm | md | lg', 'Consistent padding for Header, Content and Footer.', 'md'),
    p(
      'interactive / selected',
      'boolean',
      'Hover/focus affordances and an explicit selected state. Interactive does not make a div a button.',
    ),
    p(
      'asChild',
      'boolean',
      'Use a real link or button for a whole-card action. Avoid nested interactive elements.',
    ),
  ],
  input: [
    p(
      'variant',
      'outlined | filled | ghost | contrast',
      'Contrast adds a strong token-based outline without changing native semantics.',
      'outlined',
    ),
  ],
  textarea: [
    p(
      'variant',
      'outlined | filled | ghost | contrast',
      'The same surface variants and contrast treatment as Input.',
      'outlined',
    ),
  ],
  sheet: [
    p(
      'handleOnly',
      'boolean',
      'Drag from non-interactive areas by default. Controls, mouse text selection and nested scroll regions keep their gestures. Set true to restrict dragging to SheetHandle. Use data-vaul-no-drag on custom interactive regions.',
      'false',
    ),
    p(
      'maxWidth',
      'number | string',
      'Constrain side panels or center top/bottom panels. Numbers are pixels.',
    ),
    p(
      'variant / gap / size',
      'attached | detached | floating / number / sm | md | lg | xl | full',
      'Inset edges, floating elevation and side-panel sizing.',
    ),
    p(
      'SheetContent.showHandle',
      'boolean',
      'Vertical sheets include a handle automatically. Set false for a custom nested handle.',
    ),
  ],
  drawer: [
    p(
      'handleOnly / maxWidth / variant / gap',
      'options',
      'The same gesture isolation, width constraints and detached configurations as Sheet.',
    ),
    p('showHandle', 'boolean', 'Bottom panels include a handle automatically.', 'true'),
  ],
  'number-input': [
    p(
      'showControls',
      'boolean',
      'Hide both decrement and increment controls without losing native arrow-key input.',
      'true',
    ),
    p(
      'variant / textAlign',
      'outlined | filled | ghost | contrast / start | center | end',
      'Input appearance and alignment; hidden controls default to start alignment.',
    ),
  ],
  'bottom-navigation': [
    p(
      'variant',
      'attached | inset | floating',
      'Full-width, inset, or elevated floating surface.',
      'attached',
    ),
    p('maxWidth', 'number | string', 'Constrain and center the navigation surface.'),
    p(
      'itemLayout / showLabels / indicator / size',
      'options',
      'Inline or stacked content, labels, moving icon/full highlight, and density.',
    ),
    p(
      'animated',
      'boolean',
      'Animate the active highlight, respecting reduced/none motion.',
      'true',
    ),
  ],
  tabs: [
    p(
      'TabsList.animated',
      'boolean',
      'Animate the shared active surface or underline between triggers. Supports vertical layout and RTL.',
      'true',
    ),
  ],
  'segmented-control': [
    p(
      'animated',
      'boolean',
      'One shared highlight follows selection, size changes and RTL; individual controls retain radio semantics.',
      'true',
    ),
  ],
  stepper: [
    p(
      'variant / size',
      'default | compact | dots / sm | md | lg',
      'Indicator treatment and density.',
    ),
    p(
      'labelPlacement / showLabels / showDescriptions',
      'bottom | inline / boolean',
      'Compose compact or detailed flows.',
    ),
    p(
      'renderIndicator / steps.status',
      'render function / complete | error | pending',
      'Custom icons and application-owned validation/completion states.',
    ),
    p(
      'keepMounted',
      'boolean',
      'Retain inactive content and input state while hiding it from focus and accessibility navigation.',
      'false',
    ),
  ],
  progress: [
    p(
      'segments',
      'ProgressSegment[]',
      'Stable id, label, finite value and optional color for each allocation. Over-capacity segments scale proportionally.',
    ),
    p(
      'showLegend / formatValue',
      'boolean / (value, max) => string',
      'Visible labels and values; accessible value text never depends on color alone.',
      'true',
    ),
  ],
  alert: [
    p(
      'appearance',
      'subtle | outlined | filled',
      'Neutral foreground with a semantic icon and optional tonal surface.',
      'subtle',
    ),
    p(
      'action / onDismiss / dismissLabel',
      'ReactNode / callback / string',
      'Independent action and dismissal controls.',
    ),
  ],
  toast: [
    p(
      'invert',
      'boolean',
      'Inverse notifications by default: dark on light themes and light on dark themes. Set false to use the current surface.',
      'true',
    ),
  ],
  'data-table': [
    p(
      'mode / defaultMode / onModeChange',
      'browse | selection / callback',
      'With selectable enabled, switch between browsing and checkbox selection. Omission preserves legacy selectable behavior.',
    ),
    p(
      'searchable / filterable / sortable / columnControls',
      'boolean',
      'Independently hide search, filter controls, sorting UI, and column controls.',
      'true',
    ),
    p(
      'showToolbar / showReset / pagination',
      'boolean',
      'Hide all toolbar UI or reset; disabling pagination renders all loaded pre-pagination rows.',
      'true',
    ),
    p(
      'showPageSize / showPageJump / showSummary / showSelectionControls',
      'boolean',
      'Independently hide pagination or mode controls.',
      'true',
    ),
    p(
      'filterPresentation',
      'auto | popover | sheet',
      'Filters and sorting use a bottom sheet on screens at or below 640px.',
      'auto',
    ),
    p(
      'clearSelectionOnExit',
      'boolean',
      'Clear selected row IDs on the built-in Done action. External mode/selection changes remain application-owned.',
      'true',
    ),
  ],
};
