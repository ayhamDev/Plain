import * as React from 'react';
import * as UI from '@plain/ui';
import { Folder, Home, Inbox, Settings, User } from 'lucide-react';

type State = Record<string, string | number | boolean>;
const choice = <const T extends string>(state: State, key: string, values: readonly T[]) =>
  values.find((value) => value === state[key]) ?? values[0];
const messages = [
  {
    id: 'review',
    title: 'Design review notes',
    description: 'Sophie Chen: The new navigation is ready for review.',
    initials: 'SC',
    time: '2 h',
    unread: 3,
  },
  {
    id: 'release',
    title: 'Release checklist',
    description: 'Alex Morgan: Package verification is complete.',
    initials: 'AM',
    time: '5 h',
    unread: 0,
  },
  {
    id: 'research',
    title: 'Customer research',
    description: 'James Wilson: Interview notes and recordings.',
    initials: 'JW',
    time: '1 d',
    unread: 7,
  },
  {
    id: 'planning',
    title: 'Planning the next sprint',
    description: 'Emma Taylor: Priorities for the mobile workspace.',
    initials: 'ET',
    time: '2 d',
    unread: 0,
  },
];
const destinations = [
  { value: 'home', label: 'Home', icon: <Home /> },
  { value: 'projects', label: 'Projects', icon: <Folder /> },
  { value: 'inbox', label: 'Inbox', icon: <Inbox />, badge: 3 },
];
const steps = [
  { value: 'details', label: 'Details', description: 'Project basics' },
  { value: 'team', label: 'Team', description: 'Invite people' },
  { value: 'review', label: 'Review', description: 'Ready to create' },
];

export default function RefinementExample({ slug, state = {} }: { slug: string; state?: State }) {
  const [destination, setDestination] = React.useState('projects');
  const [step, setStep] = React.useState('details');
  const [section, setSection] = React.useState('Overview');
  if (slug === 'list')
    return (
      <div style={{ width: '100%', maxWidth: 640 }}>
        <UI.List
          key={`${state.mode}-${state.loading}`}
          aria-label="Team discussions"
          items={messages}
          getItemKey={(item) => item.id}
          getItemLabel={(item) => item.title}
          selectable={state.selectable !== false}
          defaultMode={choice(state, 'mode', ['browse', 'selection'])}
          density={choice(state, 'density', ['comfortable', 'compact'])}
          dividers={state.dividers !== false}
          loading={!!state.loading}
          renderLeading={(item) => (
            <UI.Avatar>
              <UI.AvatarFallback>{item.initials}</UI.AvatarFallback>
            </UI.Avatar>
          )}
          renderItem={(item) => (
            <>
              <UI.ListItemTitle>{item.title}</UI.ListItemTitle>
              <UI.ListItemDescription>{item.description}</UI.ListItemDescription>
            </>
          )}
          renderTrailing={(item) => (
            <UI.Stack gap={1} align="end">
              <span>{item.time}</span>
              {item.unread > 0 && <UI.Badge variant="outline">{item.unread}</UI.Badge>}
            </UI.Stack>
          )}
          selectionActions={(keys, clear) => (
            <UI.Button
              size="sm"
              onClick={() => {
                UI.toast.success(`${keys.length} discussions archived`);
                clear();
              }}
            >
              Archive selection
            </UI.Button>
          )}
        />
      </div>
    );
  if (slug === 'navigation-rail')
    return (
      <UI.SidebarProvider width="200px" style={{ minHeight: 400, width: '100%' }}>
        <UI.NavigationRail
          items={destinations}
          value={destination}
          onValueChange={setDestination}
          variant={choice(state, 'variant', ['attached', 'inset', 'floating'])}
          hideOnMobile={!!state.hideOnMobile}
          aria-label="Workspaces"
          header={<UI.Strong aria-label="P.UI">p.</UI.Strong>}
          footer={
            <UI.Button
              variant="ghost"
              size="icon"
              aria-label="Account"
              onClick={() => UI.toast('Signed in as Alex Morgan')}
            >
              <User />
            </UI.Button>
          }
        />
        <UI.Sidebar label="Project navigation">
          <UI.SidebarHeader collapsedContent={<Folder />}>
            <Folder />
            <UI.Strong>{destinations.find((item) => item.value === destination)?.label}</UI.Strong>
          </UI.SidebarHeader>
          <UI.SidebarContent>
            <UI.SidebarGroup label="Workspace">
              <UI.SidebarMenu>
                {['Overview', 'Activity', 'Members'].map((label) => (
                  <UI.SidebarMenuItem key={label}>
                    <UI.SidebarItem
                      icon={<Folder />}
                      active={section === label}
                      onClick={() => setSection(label)}
                    >
                      {label}
                    </UI.SidebarItem>
                  </UI.SidebarMenuItem>
                ))}
              </UI.SidebarMenu>
            </UI.SidebarGroup>
          </UI.SidebarContent>
          <UI.SidebarFooter collapsedContent={<Settings />}>
            <Settings />
            <UI.Small>Workspace settings</UI.Small>
          </UI.SidebarFooter>
        </UI.Sidebar>
        <UI.SidebarInset asChild>
          <div style={{ padding: 16 }}>
            <UI.SidebarTrigger />
            <UI.H3 size="lg" style={{ marginTop: 16 }}>
              {destinations.find((item) => item.value === destination)?.label}
            </UI.H3>
            <UI.P size="sm" role="status">
              {section}
            </UI.P>
          </div>
        </UI.SidebarInset>
      </UI.SidebarProvider>
    );
  if (slug === 'bottom-navigation')
    return (
      <UI.BottomNavigation
        items={destinations}
        value={destination}
        onValueChange={setDestination}
        variant={choice(state, 'variant', ['attached', 'inset', 'floating'])}
        itemLayout={choice(state, 'itemLayout', ['stacked', 'inline'])}
        indicator={choice(state, 'indicator', ['icon', 'full'])}
        size={choice(state, 'size', ['md', 'sm', 'lg'])}
        showLabels={state.showLabels !== false}
        maxWidth={Number(state.maxWidth) || undefined}
      />
    );
  if (slug === 'stepper')
    return (
      <UI.Stepper
        steps={steps}
        value={step}
        onValueChange={setStep}
        variant={choice(state, 'variant', ['default', 'compact', 'dots'])}
        orientation={choice(state, 'orientation', ['horizontal', 'vertical'])}
        size={choice(state, 'size', ['md', 'sm', 'lg'])}
        labelPlacement={choice(state, 'labelPlacement', ['bottom', 'inline'])}
        linear={!!state.linear}
        showLabels={state.showLabels !== false}
        showDescriptions={state.showDescriptions !== false}
        keepMounted={!!state.keepMounted}
        renderContent={(current) => (
          <UI.Field label={`${current.label} notes`}>
            <UI.Input placeholder="Add a note" />
          </UI.Field>
        )}
        style={{ width: '100%' }}
      />
    );
  if (slug === 'card')
    return (
      <UI.Card
        variant={choice(state, 'variant', ['outlined', 'filled', 'elevated', 'ghost'])}
        size={choice(state, 'size', ['md', 'sm', 'lg'])}
        interactive={!!state.interactive}
        selected={!!state.selected}
        style={{ width: '100%', maxWidth: 400 }}
      >
        <UI.CardHeader>
          <UI.CardTitle>Website redesign</UI.CardTitle>
          <UI.CardDescription>Design, build, and review.</UI.CardDescription>
        </UI.CardHeader>
        <UI.CardContent>
          <UI.Progress value={68} aria-label="Project progress" />
        </UI.CardContent>
        <UI.CardFooter>
          <UI.Badge>In progress</UI.Badge>
          <UI.Button
            size="sm"
            variant="outline"
            style={{ marginInlineStart: 'auto' }}
            onClick={() => UI.toast.success('Project opened')}
          >
            Open project
          </UI.Button>
        </UI.CardFooter>
      </UI.Card>
    );
  if (slug === 'progress')
    return (
      <div style={{ width: '100%', maxWidth: 480 }}>
        <UI.Stack gap={4}>
          <UI.Field label="Upload progress">
            <UI.Progress
              value={Number(state.value ?? 64)}
              size={choice(state, 'size', ['md', 'sm', 'lg'])}
            />
          </UI.Field>
          <div>
            <UI.P size="sm" style={{ marginBottom: 12 }}>
              Workspace storage
            </UI.P>
            <UI.Progress
              max={100}
              size={choice(state, 'size', ['lg', 'md', 'sm'])}
              aria-label="Workspace storage"
              showLegend={state.showLegend !== false}
              formatValue={(value) => `${value} GB`}
              segments={[
                { id: 'documents', label: 'Documents', value: 24, color: 'var(--ui-chart-1)' },
                { id: 'images', label: 'Images', value: 32, color: 'var(--ui-chart-2)' },
                { id: 'video', label: 'Video', value: 18, color: 'var(--ui-chart-3)' },
              ]}
            />
          </div>
        </UI.Stack>
      </div>
    );
  return null;
}
