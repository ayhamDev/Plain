import * as React from 'react';
import * as UI from '@plain/ui';
import type { PropPreview } from './previews';
const Example = React.lazy(() => import('./examples/RefinementExample'));
const render = (slug: string) => (state: Record<string, string | number | boolean>) => (
  <React.Suspense fallback={<UI.Spinner />}>
    <Example slug={slug} state={state} />
  </React.Suspense>
);
const option = (name: string, options: string[]) => ({ name, options });
const bool = (name: string) => ({ name });
const size = option('size', ['sm', 'md', 'lg']);
const attrs = (state: Record<string, string | number | boolean>) =>
  Object.entries(state)
    .map(([key, value]) =>
      typeof value === 'string' ? `${key}=${JSON.stringify(value)}` : `${key}={${value}}`,
    )
    .join(' ');
const items =
  '[{ value: "home", label: "Home", icon: <span>H</span> }, { value: "projects", label: "Projects", icon: <span>P</span> }, { value: "inbox", label: "Inbox", icon: <span>I</span>, badge: 3 }]';
const steps =
  '[{ value: "details", label: "Details", description: "Project basics" }, { value: "team", label: "Team", description: "Invite people" }, { value: "review", label: "Review", description: "Ready to create" }]';
export const refinementPreviews: Record<string, PropPreview> = {
  card: {
    defaults: { variant: 'outlined', size: 'md', interactive: false, selected: false },
    controls: [
      option('variant', ['outlined', 'filled', 'elevated', 'ghost']),
      size,
      bool('interactive'),
      bool('selected'),
    ],
    render: render('card'),
    code: (s) =>
      `<Card ${attrs(s)} style={{ width: '100%', maxWidth: 400 }}><CardHeader><CardTitle>Website redesign</CardTitle><CardDescription>Design, build, and review.</CardDescription></CardHeader><CardContent><Progress value={68} aria-label="Project progress" /></CardContent><CardFooter><Badge>In progress</Badge><Button size="sm" variant="outline">Open project</Button></CardFooter></Card>`,
  },
  list: {
    defaults: {
      mode: 'browse',
      selectable: true,
      density: 'comfortable',
      dividers: true,
      loading: false,
    },
    controls: [
      option('mode', ['browse', 'selection']),
      bool('selectable'),
      option('density', ['comfortable', 'compact']),
      bool('dividers'),
      bool('loading'),
    ],
    render: render('list'),
    code: (s) =>
      `<List items={[{ id: 'review', title: 'Design review notes', description: 'Sophie Chen: Ready for review.' }, { id: 'release', title: 'Release checklist', description: 'Alex Morgan: Verification is complete.' }]} getItemKey={item => item.id} getItemLabel={item => item.title} defaultMode="${s.mode}" ${attrs({ selectable: s.selectable, density: s.density, dividers: s.dividers, loading: s.loading })} renderItem={item => <><ListItemTitle>{item.title}</ListItemTitle><ListItemDescription>{item.description}</ListItemDescription></>} />`,
  },
  'navigation-rail': {
    defaults: {
      variant: 'attached',
      hideOnMobile: false,
      expandOnHover: false,
      expansionMode: 'inline',
      expanded: false,
      expandedWidth: 248,
      overlayBackdrop: true,
    },
    controls: [
      option('variant', ['attached', 'inset', 'floating']),
      bool('hideOnMobile'),
      bool('expandOnHover'),
      option('expansionMode', ['inline', 'overlay']),
      bool('expanded'),
      { name: 'expandedWidth', min: 160, max: 360 },
      bool('overlayBackdrop'),
    ],
    render: render('navigation-rail'),
    code: (s) =>
      `<SidebarProvider width="200px" style={{ minHeight: 400 }}><NavigationRail ${attrs(s)} aria-label="Workspaces" items={${items}} /><Sidebar label="Project navigation"><SidebarHeader collapsedContent={<span>P</span>}>Projects</SidebarHeader><SidebarContent><SidebarItem>Overview</SidebarItem><SidebarItem>Activity</SidebarItem></SidebarContent></Sidebar><SidebarInset><SidebarTrigger />Project workspace</SidebarInset></SidebarProvider>`,
  },
  'bottom-navigation': {
    defaults: {
      variant: 'attached',
      itemLayout: 'stacked',
      indicator: 'icon',
      size: 'md',
      showLabels: true,
      maxWidth: 480,
    },
    controls: [
      option('variant', ['attached', 'inset', 'floating']),
      option('itemLayout', ['stacked', 'inline']),
      option('indicator', ['icon', 'full']),
      size,
      bool('showLabels'),
      { name: 'maxWidth', min: 240, max: 960 },
    ],
    render: render('bottom-navigation'),
    code: (s) => `<BottomNavigation ${attrs(s)} defaultValue="projects" items={${items}} />`,
  },
  stepper: {
    defaults: {
      variant: 'default',
      size: 'md',
      orientation: 'horizontal',
      labelPlacement: 'bottom',
      linear: false,
      showLabels: true,
      showDescriptions: true,
      keepMounted: false,
    },
    controls: [
      option('variant', ['default', 'compact', 'dots']),
      size,
      option('orientation', ['horizontal', 'vertical']),
      option('labelPlacement', ['bottom', 'inline']),
      bool('linear'),
      bool('showLabels'),
      bool('showDescriptions'),
      bool('keepMounted'),
    ],
    render: render('stepper'),
    code: (s) =>
      `<Stepper ${attrs(s)} steps={${steps}} defaultValue="details" renderContent={step => <Field label={step.label + ' notes'}><Input placeholder="Add a note" /></Field>} />`,
  },
  progress: {
    defaults: { value: 64, size: 'lg', showLegend: true },
    controls: [{ name: 'value', min: 0, max: 100 }, size, bool('showLegend')],
    render: render('progress'),
    code: (s) =>
      `<Stack gap={4}><Progress value={${s.value}} size="${s.size}" aria-label="Upload progress" /><Progress size="${s.size}" showLegend={${s.showLegend}} max={100} aria-label="Workspace storage" formatValue={value => value + ' GB'} segments={[{ id: 'documents', label: 'Documents', value: 24, color: 'var(--ui-chart-1)' }, { id: 'images', label: 'Images', value: 32, color: 'var(--ui-chart-2)' }, { id: 'video', label: 'Video', value: 18, color: 'var(--ui-chart-3)' }]} /></Stack>`,
  },
  sheet: {
    defaults: {
      side: 'bottom',
      variant: 'attached',
      size: 'md',
      maxWidth: 560,
      gap: 12,
      handleOnly: false,
      showHandle: true,
    },
    controls: [
      option('side', ['bottom', 'top', 'left', 'right', 'start', 'end']),
      option('variant', ['attached', 'detached', 'floating']),
      option('size', ['sm', 'md', 'lg', 'xl', 'full']),
      { name: 'maxWidth', min: 240, max: 960 },
      { name: 'gap', min: 0, max: 32 },
      bool('handleOnly'),
      bool('showHandle'),
    ],
    render: (s) => (
      <UI.Sheet
        side={s.side as UI.SheetSide}
        variant={s.variant as 'attached' | 'detached' | 'floating'}
        size={s.size as 'sm' | 'md' | 'lg' | 'xl' | 'full'}
        maxWidth={Number(s.maxWidth)}
        gap={Number(s.gap)}
        handleOnly={!!s.handleOnly}
      >
        <UI.SheetTrigger asChild>
          <UI.Button variant="outline">Open preview sheet</UI.Button>
        </UI.SheetTrigger>
        <UI.SheetContent showHandle={!!s.showHandle}>
          <UI.SheetHeader>
            <UI.SheetTitle>Project settings</UI.SheetTitle>
            <UI.SheetDescription>Project appearance and sound.</UI.SheetDescription>
          </UI.SheetHeader>
          <UI.Stack gap={3}>
            <UI.Field label="Project name">
              <UI.Input defaultValue="Website redesign" />
            </UI.Field>
            <UI.Field label="Volume">
              <UI.Slider defaultValue={[50]} />
            </UI.Field>
            <UI.SheetClose asChild>
              <UI.Button>Save changes</UI.Button>
            </UI.SheetClose>
          </UI.Stack>
        </UI.SheetContent>
      </UI.Sheet>
    ),
    code: (s) =>
      `<Sheet ${attrs({ side: s.side, variant: s.variant, size: s.size, maxWidth: s.maxWidth, gap: s.gap, handleOnly: s.handleOnly })}><SheetTrigger asChild><Button variant="outline">Open preview sheet</Button></SheetTrigger><SheetContent showHandle={${s.showHandle}}><SheetHeader><SheetTitle>Project settings</SheetTitle><SheetDescription>Project appearance and sound.</SheetDescription></SheetHeader><Stack gap={3}><Field label="Project name"><Input defaultValue="Website redesign" /></Field><Field label="Volume"><Slider defaultValue={[50]} /></Field><SheetClose asChild><Button>Save changes</Button></SheetClose></Stack></SheetContent></Sheet>`,
  },
};
