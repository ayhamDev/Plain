import * as React from 'react';
import {
  LayoutDashboard,
  Folder,
  Settings,
  Home,
  User,
  Plus,
  FileCode2,
  ChevronDown,
  MoreHorizontal,
  RotateCcw,
} from 'lucide-react';
import * as UI from '../ui';

const ChartExample = React.lazy(() => import('./examples/ChartExample'));
const ScheduleExample = React.lazy(() => import('./examples/ScheduleExample'));
const MotionExample = React.lazy(() => import('./examples/MotionExample'));
const records = Array.from({ length: 1000 }, (_, index) => ({
  id: String(index),
  name: `Project ${index + 1}`,
}));
const layouts = new Set([
  'box',
  'flex',
  'stack',
  'inline',
  'grid',
  'container',
  'center',
  'spacer',
  'masonry',
  'split-pane',
]);

function LayoutExample({ slug }: { slug: string }) {
  const items = ['Research', 'Design', 'Development'];
  const cell = (item: string, index: number) => (
    <UI.Box
      key={item}
      padding={2}
      style={{
        minHeight: slug === 'masonry' ? 80 + index * 24 : 64,
        background: 'var(--ui-surface-container)',
        borderRadius: 'var(--ui-radius)',
      }}
    >
      {item}
    </UI.Box>
  );
  if (slug === 'split-pane') return <SplitWorkspace />;
  if (slug === 'grid')
    return (
      <UI.Grid columns={{ base: 1, sm: 3 }} gap={2} style={{ width: '100%' }}>
        {items.map(cell)}
      </UI.Grid>
    );
  if (slug === 'masonry')
    return (
      <UI.Masonry columns={{ base: 1, sm: 2, lg: 3 }} style={{ width: '100%' }}>
        {[...items, 'Testing', 'Delivery', 'Archive'].map(cell)}
      </UI.Masonry>
    );
  if (slug === 'stack')
    return (
      <UI.Stack gap={2} style={{ width: '100%' }}>
        {items.map(cell)}
      </UI.Stack>
    );
  if (slug === 'inline')
    return (
      <UI.Inline gap={1}>
        {items.map((item) => (
          <UI.Badge key={item}>{item}</UI.Badge>
        ))}
      </UI.Inline>
    );
  if (slug === 'center')
    return (
      <UI.Center style={{ width: '100%', minHeight: 180, background: 'var(--ui-muted)' }}>
        <UI.Badge>All caught up</UI.Badge>
      </UI.Center>
    );
  if (slug === 'container')
    return (
      <UI.Container maxWidth="32rem" gutter={2}>
        <UI.Box padding={3} style={{ background: 'var(--ui-muted)' }}>
          Project workspace
        </UI.Box>
      </UI.Container>
    );
  if (slug === 'box')
    return (
      <UI.Box padding={{ base: 2, md: 4 }} style={{ background: 'var(--ui-muted)' }}>
        Project notes
      </UI.Box>
    );
  return (
    <UI.Flex align="center" justify="between" gap={2} wrap style={{ width: '100%' }}>
      <span>Project workspace</span>
      {slug === 'spacer' && <UI.Spacer />}
      <UI.Button variant="outline">
        <Plus aria-hidden="true" />
        New project
      </UI.Button>
    </UI.Flex>
  );
}

function SplitWorkspace() {
  const group = UI.useGroupRef();
  const [file, setFile] = React.useState('button.tsx');
  const [query, setQuery] = React.useState('');
  const [code, setCode] = React.useState(
    "import { Button } from '@plain/ui';\n\nexport function Save() {\n  return <Button>Save changes</Button>;\n}",
  );
  return (
    <div className="split-workspace">
      <UI.SplitPane groupRef={group} style={{ height: 400, width: '100%' }} mobileBreakpoint={520}>
        <UI.SplitPanePanel
          id="files"
          defaultSize="30%"
          minSize="18%"
          collapsible
          collapsedSize="0%"
          style={{ overflow: 'auto' }}
        >
          <div className="workspace-heading workspace-explorer-heading">
            <UI.Strong>Explorer</UI.Strong>
            <UI.Badge variant="outline">3</UI.Badge>
          </div>
          <div className="workspace-search">
            <UI.SearchInput
              value={query}
              onValueChange={setQuery}
              aria-label="Find a file"
              placeholder="Find a file"
            />
          </div>
          <div className="workspace-files">
            {['button.tsx', 'theme.css', 'index.ts']
              .filter((name) => name.includes(query))
              .map((name) => (
                <UI.Button
                  key={name}
                  variant="ghost"
                  aria-pressed={name === file}
                  className="workspace-file"
                  onClick={() => setFile(name)}
                >
                  <FileCode2 size={14} aria-hidden="true" />
                  {name}
                </UI.Button>
              ))}
          </div>
        </UI.SplitPanePanel>
        <UI.SplitPaneHandle aria-label="Resize explorer" />
        <UI.SplitPanePanel id="editor" minSize="30%">
          <div className="workspace-heading">
            <span>
              <FileCode2 size={14} aria-hidden="true" />
              {file}
            </span>
            <UI.Button
              size="icon"
              variant="ghost"
              title="Reset panel sizes"
              aria-label="Reset panel sizes"
              onClick={() => group.current?.setLayout({ files: 30, editor: 70 })}
            >
              <RotateCcw size={16} />
            </UI.Button>
          </div>
          <UI.Textarea
            className="workspace-editor"
            dir="ltr"
            aria-label={`Edit ${file}`}
            spellCheck={false}
            value={
              file === 'button.tsx'
                ? code
                : file === 'theme.css'
                  ? ':root {\n  --ui-radius: 6px;\n}'
                  : "export { Save } from './button';"
            }
            onChange={(event) => {
              if (file === 'button.tsx') setCode(event.target.value);
            }}
            readOnly={file !== 'button.tsx'}
          />
          <div className="workspace-status">
            <UI.Small>TypeScript</UI.Small>
            <UI.Small>{code.split('\n').length} lines</UI.Small>
          </div>
        </UI.SplitPanePanel>
      </UI.SplitPane>
    </div>
  );
}

function SidebarWorkspace() {
  const [destination, setDestination] = React.useState('Overview');
  const [search, setSearch] = React.useState('');
  const [variant, setVariant] = React.useState<'sidebar' | 'inset' | 'floating'>('sidebar');
  return (
    <div className="sidebar-workspace">
      <UI.SidebarProvider
        width="224px"
        mobileWidth="288px"
        style={{ width: '100%', minHeight: 400 }}
      >
        <UI.Sidebar variant={variant} label="Workspace navigation">
          <UI.SidebarHeader>
            <span className="workspace-brand">p.</span>
            <UI.Strong>Workspace</UI.Strong>
          </UI.SidebarHeader>
          <div className="workspace-search">
            <UI.SidebarInput
              placeholder="Search workspace"
              aria-label="Search workspace"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <UI.SidebarContent>
            <UI.SidebarGroup>
              <UI.SidebarGroupLabel>Workspace</UI.SidebarGroupLabel>
              <UI.SidebarGroupAction
                aria-label="Create project"
                title="Create project"
                onClick={() => setDestination('New project')}
              >
                <Plus />
              </UI.SidebarGroupAction>
              <UI.SidebarMenu>
                {['Overview', 'Inbox']
                  .filter((name) => name.toLowerCase().includes(search.toLowerCase()))
                  .map((name) => (
                    <UI.SidebarMenuItem key={name}>
                      <UI.SidebarMenuButton
                        label={name}
                        active={destination === name}
                        icon={<LayoutDashboard />}
                        onClick={() => setDestination(name)}
                      >
                        {name}
                      </UI.SidebarMenuButton>
                      {name === 'Inbox' && <UI.SidebarMenuBadge>8</UI.SidebarMenuBadge>}
                    </UI.SidebarMenuItem>
                  ))}
                <UI.SidebarMenuItem>
                  <UI.Collapsible defaultOpen>
                    <UI.CollapsibleTrigger asChild>
                      <UI.SidebarMenuButton
                        label="Projects"
                        icon={<Folder />}
                        closeOnSelect={false}
                      >
                        <span className="workspace-sub-heading">
                          Projects
                          <ChevronDown size={14} />
                        </span>
                      </UI.SidebarMenuButton>
                    </UI.CollapsibleTrigger>
                    <UI.CollapsibleContent>
                      <UI.SidebarMenuSub>
                        {['Website', 'Design system', 'Mobile app']
                          .filter((name) => name.toLowerCase().includes(search.toLowerCase()))
                          .map((name) => (
                            <UI.SidebarMenuSubItem key={name}>
                              <UI.SidebarMenuSubButton
                                active={destination === name}
                                onClick={() => setDestination(name)}
                              >
                                {name}
                              </UI.SidebarMenuSubButton>
                            </UI.SidebarMenuSubItem>
                          ))}
                      </UI.SidebarMenuSub>
                    </UI.CollapsibleContent>
                  </UI.Collapsible>
                </UI.SidebarMenuItem>
              </UI.SidebarMenu>
            </UI.SidebarGroup>
            <UI.SidebarSeparator />
            <UI.SidebarGroup label="Tools">
              <UI.SidebarMenu>
                <UI.SidebarMenuItem>
                  <UI.SidebarMenuButton
                    icon={<Settings />}
                    active={destination === 'Settings'}
                    onClick={() => setDestination('Settings')}
                  >
                    Settings
                  </UI.SidebarMenuButton>
                  <UI.SidebarMenuAction
                    showOnHover
                    title="Settings actions"
                    aria-label="Settings actions"
                    onClick={() => setDestination('Preferences')}
                  >
                    <MoreHorizontal />
                  </UI.SidebarMenuAction>
                </UI.SidebarMenuItem>
              </UI.SidebarMenu>
            </UI.SidebarGroup>
          </UI.SidebarContent>
          <UI.SidebarFooter>
            <UI.Avatar className="size-7">
              <UI.AvatarFallback>AM</UI.AvatarFallback>
            </UI.Avatar>
            <div className="workspace-account">
              <UI.Strong>Alex Morgan</UI.Strong>
              <UI.Small>Personal workspace</UI.Small>
            </div>
          </UI.SidebarFooter>
          <UI.SidebarRail />
        </UI.Sidebar>
        <UI.SidebarInset asChild>
          <div className="workspace-main">
            <div className="workspace-heading">
              <UI.SidebarTrigger />
              <UI.Strong>{destination}</UI.Strong>
              <UI.Select
                value={variant}
                onValueChange={(value) => setVariant(value as typeof variant)}
              >
                <UI.SelectTrigger
                  aria-label="Sidebar appearance"
                  style={{ width: 128, maxWidth: '100%', flexShrink: 0, marginInlineStart: 'auto' }}
                >
                  <UI.SelectValue />
                </UI.SelectTrigger>
                <UI.SelectContent>
                  <UI.SelectItem value="sidebar">Sidebar</UI.SelectItem>
                  <UI.SelectItem value="inset">Inset</UI.SelectItem>
                  <UI.SelectItem value="floating">Floating</UI.SelectItem>
                </UI.SelectContent>
              </UI.Select>
            </div>
            <div className="workspace-page">
              <UI.H3>{destination}</UI.H3>
              <UI.P tone="muted" size="sm">
                Your workspace, all in one place.
              </UI.P>
              <UI.SearchInput placeholder="Search projects" aria-label="Search projects" />
              <UI.Ul className="workspace-project-list">
                {['Website redesign', 'Component library', 'Mobile experience'].map((project) => (
                  <UI.Li key={project}>
                    <Folder size={16} />
                    <span>{project}</span>
                    <UI.Badge variant="outline">In progress</UI.Badge>
                  </UI.Li>
                ))}
              </UI.Ul>
            </div>
          </div>
        </UI.SidebarInset>
      </UI.SidebarProvider>
    </div>
  );
}

export function AppShellPreview() {
  const [direction] = React.useState<UI.TextDirection>(() => {
    try {
      return localStorage.getItem('plainui-direction') === 'rtl' ? 'rtl' : 'ltr';
    } catch {
      return 'ltr';
    }
  });
  return (
    <UI.PlainProvider dir={direction}>
      <UI.AppShell
        header={
          <UI.Flex align="center" justify="between">
            <strong>Workspace</strong>
            <UI.Button size="sm" variant="outline">
              New project
            </UI.Button>
          </UI.Flex>
        }
        footer={<span>All changes saved</span>}
      >
        <UI.Stack padding={3}>
          <h1 style={{ fontSize: 24 }}>Project overview</h1>
          <UI.Stack gap={1}>
            <UI.Small>Active projects</UI.Small>
            <UI.Strong>24</UI.Strong>
            <UI.Small>3 added this week</UI.Small>
          </UI.Stack>
          <p>Discovery, design and delivery.</p>
        </UI.Stack>
      </UI.AppShell>
    </UI.PlainProvider>
  );
}

export default function ExtendedExamples({ slug }: { slug: string }) {
  const [metric, setMetric] = React.useState('week');
  const [menuAction, setMenuAction] = React.useState('Ready');
  const [busy, setBusy] = React.useState(true);
  if (slug === 'typography')
    return (
      <UI.Stack gap={2} style={{ width: '100%', maxWidth: 520 }}>
        <UI.H1>Project overview</UI.H1>
        <UI.P>
          A clear starting point for <UI.Strong>your next idea</UI.Strong>.
        </UI.P>
        <UI.H2>What matters</UI.H2>
        <UI.P tone="muted" size="sm">
          Keep the hierarchy quiet and the content readable.
        </UI.P>
        <UI.Blockquote>Start plain. Make it your own.</UI.Blockquote>
        <UI.Ul>
          <UI.Li>Native semantics</UI.Li>
          <UI.Li>Every direction</UI.Li>
        </UI.Ul>
        <UI.P>
          <UI.Em>Built with care.</UI.Em> Read the{' '}
          <UI.A href="/docs/accessibility">accessibility guide</UI.A>.
        </UI.P>
        <UI.P>
          <UI.Code dir="ltr">@plain/ui</UI.Code>{' '}
          <UI.Small tone="muted">React and TypeScript</UI.Small>
        </UI.P>
      </UI.Stack>
    );
  if (layouts.has(slug)) return <LayoutExample slug={slug} />;
  if (slug.endsWith('-chart'))
    return (
      <React.Suspense fallback={<UI.Skeleton style={{ height: 280, width: '100%' }} />}>
        <ChartExample slug={slug} />
      </React.Suspense>
    );
  if (slug === 'full-calendar')
    return (
      <React.Suspense fallback={<UI.Skeleton style={{ height: 480, width: '100%' }} />}>
        <ScheduleExample />
      </React.Suspense>
    );
  if (slug === 'motion')
    return (
      <React.Suspense fallback={<UI.Spinner />}>
        <MotionExample />
      </React.Suspense>
    );
  const field = (label: string, control: React.ComponentProps<typeof UI.Field>['children']) => (
    <div className="demo-form-stack">
      <UI.Field label={label}>{control}</UI.Field>
    </div>
  );
  const renderRow = (item: (typeof records)[number], index: number) => (
    <div
      style={{
        padding: 16,
        minHeight: slug === 'virtual-masonry' ? 56 + (index % 3) * 24 : 56,
        borderBottom: '1px solid var(--ui-border)',
      }}
    >
      {item.name}
    </div>
  );
  switch (slug) {
    case 'virtual-list':
      return (
        <UI.VirtualList
          items={records}
          getItemKey={(item) => item.id}
          height={280}
          estimateSize={56}
          renderItem={renderRow}
          style={{ width: '100%' }}
          aria-label="Project records"
        />
      );
    case 'virtual-grid':
      return (
        <UI.VirtualGrid
          items={records}
          getItemKey={(item) => item.id}
          height={280}
          rowHeight={64}
          columns={{ base: 1, sm: 2, lg: 3 }}
          renderItem={renderRow}
          style={{ width: '100%' }}
          aria-label="Project records"
        />
      );
    case 'virtual-masonry':
      return (
        <UI.VirtualMasonry
          items={records}
          getItemKey={(item) => item.id}
          height={280}
          estimateSize={80}
          lanes={{ base: 1, sm: 2, lg: 3 }}
          renderItem={renderRow}
          style={{ width: '100%' }}
          aria-label="Project records"
        />
      );
    case 'sidebar':
      return <SidebarWorkspace />;
    case 'app-shell':
      return (
        <iframe
          title="App shell preview"
          src="/preview/app-shell"
          style={{ width: '100%', height: 320, border: 0 }}
        />
      );
    case 'bottom-navigation':
      return (
        <UI.BottomNavigation
          value={metric}
          onValueChange={setMetric}
          items={[
            { value: 'week', label: 'Home', icon: <Home /> },
            { value: 'projects', label: 'Projects', icon: <Folder /> },
            { value: 'account', label: 'Account', icon: <User /> },
          ]}
          style={{ width: '100%' }}
        />
      );
    case 'stepper':
      return (
        <UI.Stepper
          value={metric}
          onValueChange={setMetric}
          steps={[
            { value: 'week', label: 'Details', description: 'Project basics' },
            { value: 'team', label: 'Team', description: 'Invite people' },
            { value: 'review', label: 'Review', description: 'Ready to create' },
          ]}
          style={{ width: '100%' }}
        />
      );
    case 'segmented-control':
      return (
        <UI.SegmentedControl
          aria-label="Reporting interval"
          value={metric}
          onValueChange={setMetric}
          options={[
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
          ]}
        />
      );
    case 'tree-view':
      return (
        <UI.TreeView
          aria-label="Project files"
          defaultExpandedIds={['project']}
          nodes={[
            {
              id: 'project',
              label: 'Website',
              icon: <Folder />,
              children: [
                { id: 'design', label: 'Design files' },
                {
                  id: 'source',
                  label: 'Source code',
                  children: [{ id: 'index', label: 'index.tsx' }],
                },
              ],
            },
          ]}
          style={{ width: '100%', maxWidth: 320 }}
        />
      );
    case 'number-input':
      return field('Seats', <UI.NumberInput defaultValue={5} min={1} max={100} />);
    case 'search-input':
      return field('Search projects', <UI.SearchInput placeholder="Find a project..." />);
    case 'password-input':
      return field(
        'Password',
        <UI.PasswordInput defaultValue="strong-example" autoComplete="new-password" />,
      );
    case 'pin-input':
      return field('Verification code', <UI.PinInput length={6} />);
    case 'file-upload':
      return (
        <UI.FileUpload
          aria-label="Upload project documents"
          accept=".pdf,.txt"
          multiple
          maxFiles={5}
          maxSize={5000000}
          style={{ width: '100%', maxWidth: 400 }}
        />
      );
    case 'color-picker':
      return field(
        'Project color',
        <UI.ColorPicker defaultValue="#087f5b" swatches={['#087f5b', '#2563eb', '#be185d']} />,
      );
    case 'rating':
      return <UI.Rating aria-label="Rate your experience" defaultValue={4} />;
    case 'tags-input':
      return field(
        'Project tags',
        <UI.TagsInput
          defaultValue={['design', 'research']}
          maxTags={8}
          placeholder="Add a tag..."
        />,
      );
    case 'multi-select':
      return field(
        'Team',
        <UI.MultiSelect
          defaultValue={['design']}
          options={[
            { value: 'design', label: 'Design' },
            { value: 'engineering', label: 'Engineering' },
            { value: 'research', label: 'Research' },
          ]}
        />,
      );
    case 'menubar':
      return (
        <UI.Stack>
          <UI.Menubar>
            <UI.MenubarMenu>
              <UI.MenubarTrigger>File</UI.MenubarTrigger>
              <UI.MenubarContent>
                <UI.MenubarItem onSelect={() => setMenuAction('New project created')}>
                  New project
                </UI.MenubarItem>
                <UI.MenubarItem onSelect={() => setMenuAction('Project opened')}>
                  Open project
                </UI.MenubarItem>
                <UI.MenubarSeparator />
                <UI.MenubarItem onSelect={() => setMenuAction('Project exported')}>
                  Export
                </UI.MenubarItem>
              </UI.MenubarContent>
            </UI.MenubarMenu>
            <UI.MenubarMenu>
              <UI.MenubarTrigger>Edit</UI.MenubarTrigger>
              <UI.MenubarContent>
                <UI.MenubarItem onSelect={() => setMenuAction('Change undone')}>
                  Undo
                </UI.MenubarItem>
              </UI.MenubarContent>
            </UI.MenubarMenu>
          </UI.Menubar>
          <p role="status" className="demo-muted">
            {menuAction}
          </p>
        </UI.Stack>
      );
    case 'context-menu':
      return (
        <UI.ContextMenu>
          <UI.ContextMenuTrigger asChild>
            <div
              tabIndex={0}
              style={{
                padding: 32,
                border: '1px solid var(--ui-border)',
                borderRadius: 'var(--ui-radius)',
              }}
            >
              {menuAction === 'Ready' ? 'Project workspace' : menuAction}
            </div>
          </UI.ContextMenuTrigger>
          <UI.ContextMenuContent>
            <UI.ContextMenuItem onSelect={() => setMenuAction('Project opened')}>
              Open project
            </UI.ContextMenuItem>
            <UI.ContextMenuItem onSelect={() => setMenuAction('Project duplicated')}>
              Duplicate
            </UI.ContextMenuItem>
          </UI.ContextMenuContent>
        </UI.ContextMenu>
      );
    case 'hover-card':
      return (
        <UI.HoverCard>
          <UI.HoverCardTrigger asChild>
            <a className="text-link" href="#profile">
              Alex Morgan
            </a>
          </UI.HoverCardTrigger>
          <UI.HoverCardContent>
            <UI.Stack gap={1}>
              <strong>Alex Morgan</strong>
              <span>Product designer</span>
              <span className="demo-muted">Working on the website redesign.</span>
            </UI.Stack>
          </UI.HoverCardContent>
        </UI.HoverCard>
      );
    case 'timeline':
      return (
        <UI.Timeline
          items={[
            {
              id: '1',
              title: 'Project created',
              time: '09:00',
              dateTime: '2026-10-01T09:00',
              description: 'Alex started the workspace.',
            },
            {
              id: '2',
              title: 'Design approved',
              time: '10:30',
              dateTime: '2026-10-01T10:30',
              status: 'current',
            },
            { id: '3', title: 'Ready for development', status: 'pending' },
          ]}
        />
      );
    case 'banner':
      return (
        <UI.Banner title="Scheduled maintenance" variant="info" dismissible>
          October 12, 02:00-03:00 UTC.
        </UI.Banner>
      );
    case 'loading-overlay':
      return (
        <UI.Stack style={{ width: '100%', maxWidth: 360 }}>
          <UI.LoadingOverlay label="Saving changes" visible={busy} style={{ minHeight: 144 }}>
            <UI.Box padding={3}>
              <p>Project settings</p>
              <UI.Button>Save project</UI.Button>
            </UI.Box>
          </UI.LoadingOverlay>
          <UI.Button variant="outline" onClick={() => setBusy(!busy)}>
            {busy ? 'Finish saving' : 'Save again'}
          </UI.Button>
        </UI.Stack>
      );
    case 'time-picker':
      return field('Start time', <UI.TimePicker defaultValue="09:00" min="08:00" max="18:00" />);
    case 'time-range-picker':
      return (
        <UI.TimeRangePicker
          aria-label="Office hours"
          defaultValue={{ from: '09:00', to: '17:00' }}
        />
      );
    case 'date-range-picker':
      return field(
        'Project dates',
        <UI.DateRangePicker
          defaultValue={{ from: new Date(2026, 9, 5), to: new Date(2026, 9, 12) }}
          calendarProps={{ defaultMonth: new Date(2026, 9) }}
        />,
      );
    case 'date-time-picker':
      return field(
        'Meeting',
        <UI.DateTimePicker defaultValue="2026-10-05T09:30" timeZone="Africa/Cairo" />,
      );
    case 'date-time-range-picker':
      return (
        <UI.DateTimeRangePicker
          aria-label="Maintenance window"
          defaultValue={{ from: '2026-10-05T09:00', to: '2026-10-05T17:00' }}
        />
      );
    default:
      return null;
  }
}
