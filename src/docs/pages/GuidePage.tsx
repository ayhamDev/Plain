import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Check, MoveHorizontal, Paintbrush } from 'lucide-react';
import {
  Alert,
  AlertTitle,
  AlertDescription,
  Badge,
  Button,
  Field,
  Grid,
  Input,
  Label,
  Switch,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ThemeScope,
  componentTokenAliases,
  createTheme,
  darkTokens,
  lightTokens,
  tokenNames,
  tokenVariable,
  type ThemeToken,
  type ThemeTokens,
} from '../../ui';
import { CodeBlock } from '../shared';
import { useAppPreferences } from '../preferences';
import { useDocsVersions, versionDestination } from '../versioning';

const guideInfo: Record<string, { title: string; description: string }> = {
  introduction: {
    title: 'P.UI',
    description: 'A neutral React DOM foundation for real application workflows.',
  },
  installation: {
    title: 'Installation',
    description: 'Use @plain/ui 0.2, its precompiled styles, and the optional entries you need.',
  },
  versions: {
    title: 'Documentation versions',
    description: 'Browse the guides, API, examples, and source belonging to your release.',
  },
  theming: {
    title: 'Theming',
    description:
      'Generate a complete light and dark color system, then override the roles you own.',
  },
  tokens: {
    title: 'Design tokens',
    description: 'Root roles, component aliases, and tonal palettes in one typed contract.',
  },
  customization: {
    title: 'Customization',
    description: 'Keep native controls and refs while shaping tokens, slots, and brand components.',
  },
  accessibility: {
    title: 'Accessibility',
    description:
      'Primitive behavior is a starting point. Content, composition, and testing matter.',
  },
  rtl: {
    title: 'Right to left',
    description: 'Connect direction-aware behavior with logical layout and localized content.',
  },
  motion: {
    title: 'Motion',
    description:
      'Explain changes with optional animation that follows the application motion policy.',
  },
  layouts: {
    title: 'Layouts',
    description: 'Compose responsive workspaces, mobile navigation, and resizable panels.',
  },
  virtualization: {
    title: 'Virtualization',
    description: 'Window large collections without confusing it with data loading or pagination.',
  },
  'blocks-templates': {
    title: 'Blocks and templates',
    description: 'Start from a working composition, then adapt its data, navigation, and actions.',
  },
  charts: {
    title: 'Charts',
    description: 'Use Recharts-backed views with meaningful labels and readable data alternatives.',
  },
  scheduling: {
    title: 'Dates and scheduling',
    description: 'Choose date-only, wall-time, and event-calendar APIs deliberately.',
  },
  performance: {
    title: 'Performance',
    description:
      'Load optional engines where needed and measure the application you actually ship.',
  },
};

const previewTheme = createTheme({ color: '#2f6b59', scheme: 'tonal', contrast: 0 });
const neutralTheme = createTheme({ color: null });
const rootDefaults: ThemeTokens = { ...lightTokens, ...neutralTheme.light };
const darkDefaults: ThemeTokens = { ...lightTokens, ...darkTokens, ...neutralTheme.dark };
const aliasDefaults: ThemeTokens = componentTokenAliases;

const examples = {
  provider: `import type { ReactNode } from 'react';
import { PlainProvider } from '@plain/ui';
import '@plain/ui/styles.css';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PlainProvider
      theme={{
        color: null,
        mode: 'system',
        radius: 6,
        density: 'comfortable',
        borders: 'subtle',
        motion: 'system',
      }}
      dir="ltr"
    >
      {children}
    </PlainProvider>
  );
}`,
  form: `import { useState, type FormEvent } from 'react';
import { Button, Field, Input, Stack } from '@plain/ui';

export function NewProject() {
  const [created, setCreated] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setCreated(String(data.get('name') ?? ''));
  }
  return (
    <form onSubmit={submit}>
      <Stack gap={2}>
        <Field label="Project name" required>
          <Input name="name" required autoComplete="off" />
        </Field>
        <Button type="submit">Create project</Button>
        <p role="status">{created ? created + ' created locally' : ''}</p>
      </Stack>
    </form>
  );
}`,
  brand: `import type { ReactNode } from 'react';
import { PlainProvider } from '@plain/ui';

export function BrandProviders({ children }: { children: ReactNode }) {
  return (
    <PlainProvider
      theme={{
        color: '#2f6b59',
        scheme: 'tonal',
        contrast: 0.2,
        mode: 'system',
        radius: 6,
        density: 'comfortable',
        borders: 'none',
        motion: 'reduced',
      }}
      tokens={{
        'sidebar.background': 'var(--ui-surface-low)',
        'sidebar.foreground': 'var(--ui-foreground)',
        'button.radius': '4px',
      }}
    >
      {children}
    </PlainProvider>
  );
}`,
  themeControls: `import { Button, Inline, useTheme } from '@plain/ui';

export function ThemeControls() {
  const { resolvedMode, setTheme, resetTheme } = useTheme();
  return (
    <Inline gap={1}>
      <Button type="button" onClick={() => setTheme({
        mode: resolvedMode === 'dark' ? 'light' : 'dark',
      })}>Change appearance</Button>
      <Button type="button" variant="outline" onClick={() => setTheme({
        color: null, accent: 'neutral',
      })}>Neutral colors</Button>
      <Button type="button" variant="ghost" onClick={resetTheme}>
        Reset all preferences
      </Button>
    </Inline>
  );
}`,
  generated: `import { createTheme } from '@plain/ui/color-theme';

export const brand = createTheme({
  color: '#2f6b59',
  scheme: 'expressive',
  contrast: 0.2,
  tokens: { 'button.radius': '4px' },
  light: {
    background: '#f7fbf8', foreground: '#18231c',
    'sidebar.background': 'var(--ui-surface-low)',
  },
  dark: {
    background: '#111a15', foreground: '#e0ebe3',
    'sidebar.background': 'var(--ui-surface-lowest)',
  },
});

// { color, light, dark, css }; maps contain CSS string values.
export function BrandStyles() {
  return <style>{brand.css}</style>;
}`,
  scopes: `import { Button, Field, Grid, Input, ThemeScope } from '@plain/ui';
import { createTheme } from '@plain/ui/color-theme';

const brand = createTheme({ color: '#2f6b59', scheme: 'tonal' });

export function ScopedBrands() {
  return (
    <Grid columns={{ base: 1, sm: 2 }} gap={2}>
      {(['light', 'dark'] as const).map((mode) => (
        <ThemeScope
          key={mode}
          mode={mode}
          tokens={{
            ...brand[mode],
            radius: '6px',
            'sidebar.background': 'var(--ui-surface-low)',
            'button.radius': '4px',
          }}
          componentStyles={{ 'dialog.content': 'max-w-lg' }}
          style={{
            background: 'var(--ui-background)',
            color: 'var(--ui-foreground)',
            padding: '24px',
          }}
        >
          <Field label="Project name"><Input name={mode} /></Field>
          <Button type="button" variant="accent">Save project</Button>
        </ThemeScope>
      ))}
    </Grid>
  );
}`,
  tokenHelpers: `import {
  lightTokens, darkTokens, componentTokenAliases,
  tokenNames, tokenVariable, tokensToStyle, themeCSS,
  type ThemeTokens,
} from '@plain/ui/tokens';
import { createTheme } from '@plain/ui/color-theme';

const local: ThemeTokens = {
  background: 'var(--ui-surface-low)',
  'control-border': 'var(--ui-outline)',
  'button.radius': '4px',
  'sidebar.background': 'var(--ui-surface-container)',
};

const neutral = createTheme({ color: null });

export const variables = tokensToStyle(local);
export const css = themeCSS(local, '.workspace');
export const sidebarVariable = tokenVariable('sidebar.background');
// --ui-sidebar-background
export const contract = {
  names: tokenNames,
  light: { ...lightTokens, ...neutral.light },
  dark: { ...lightTokens, ...darkTokens, ...neutral.dark },
  aliases: componentTokenAliases,
};`,
  extension: `import { useRef } from 'react';
import { Button, extendComponent, tokensToStyle } from '@plain/ui';

const BrandButton = extendComponent(Button, {
  displayName: 'BrandButton',
  defaults: { variant: 'accent', type: 'button' },
  className: 'font-medium px-4',
  variants: { tone: { brand: 'font-semibold', quiet: 'opacity-90' } },
  defaultVariants: { tone: 'brand' },
  compoundVariants: [{ when: { tone: 'quiet', size: 'sm' }, className: 'px-2' }],
  tokens: { 'button.radius': '8px' },
  styles: { 'button.root': 'shadow-none' },
});

export function SaveAction() {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <>
      <BrandButton
        ref={ref}
        tone="quiet"
        variant="outline"
        size="sm"
        name="action"
        value="save"
        className="px-6"
        style={{ ...tokensToStyle({ 'button.radius': '4px' }), fontWeight: 600 }}
        onClick={() => console.log('Save requested')}
      >Save project</BrandButton>
      <Button type="button" variant="ghost" onClick={() => ref.current?.focus()}>
        Focus save action
      </Button>
    </>
  );
}`,
  slots: `import { Button, PlainProvider, StyleProvider } from '@plain/ui';

export function SlotOverrides() {
  return (
    <PlainProvider persist={false} styles={{
      'button.root': 'font-medium',
      'dialog.content': 'max-w-lg p-6',
      'dialog.title': 'text-lg',
    }}>
      <StyleProvider styles={{ 'button.root': 'font-semibold' }}>
        <Button type="button" className="font-normal">Local action</Button>
      </StyleProvider>
    </PlainProvider>
  );
}`,
  unstyled: `import {
  Button, Dialog, DialogContent, DialogDescription,
  DialogTitle, DialogTrigger, StyleProvider,
} from '@plain/ui';

export function CustomDialog() {
  return (
    <StyleProvider unstyled>
      <Dialog>
        <DialogTrigger asChild>
          <Button type="button" className="my-button">Edit project</Button>
        </DialogTrigger>
        <DialogContent className="my-dialog">
          <DialogTitle className="my-title">Edit project</DialogTitle>
          <DialogDescription>Change the project details.</DialogDescription>
        </DialogContent>
      </Dialog>
    </StyleProvider>
  );
}`,
  asChild: `import { Button } from '@plain/ui';

export function ProjectLink() {
  return (
    <Button asChild variant="outline">
      <a href="/projects">Your projects</a>
    </Button>
  );
}`,
  rtl: `import {
  Button, DirectionProvider, Field, Input,
  Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger,
} from '@plain/ui';

export function ProjectFilters() {
  return (
    <DirectionProvider dir="rtl">
      <section dir="rtl" className="ps-6 pe-4 text-start">
        <Sheet side="end">
          <SheetTrigger asChild>
            <Button type="button" variant="outline">Filters</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Project filters</SheetTitle>
            <SheetDescription>Limit the projects in the list.</SheetDescription>
            <Field label="Owner"><Input name="owner" /></Field>
          </SheetContent>
        </Sheet>
      </section>
    </DirectionProvider>
  );
}`,
  validation: `import { Field, Input } from '@plain/ui';

export function EmailField({ error }: { error?: string }) {
  return (
    <Field label="Email address" description="Used for account updates." error={error} required>
      <Input name="email" type="email" autoComplete="email" required />
    </Field>
  );
}`,
  motion: `import { useState } from 'react';
import { Button, PlainProvider } from '@plain/ui';
import { Motion, MotionProvider, Presence } from '@plain/ui/motion';

export function SavedNotice() {
  const [saved, setSaved] = useState(false);
  return (
    <PlainProvider persist={false} theme={{ motion: 'system' }}>
      <MotionProvider duration={0.2}>
        <Button type="button" onClick={() => setSaved(!saved)}>
          {saved ? 'Clear confirmation' : 'Save locally'}
        </Button>
        <div role="status" aria-live="polite">
          <Presence initial={false}>
            {saved && <Motion key="saved" preset="fade">Changes saved locally.</Motion>}
          </Presence>
        </div>
      </MotionProvider>
    </PlainProvider>
  );
}`,
  motionPolicy: `import { Button, useMotionSettings, useTheme } from '@plain/ui';

export function MotionPreferences() {
  const { setTheme, motion } = useTheme();
  const { enabled } = useMotionSettings();
  return (
    <>
      <label htmlFor="motion-policy">Motion</label>
      <select id="motion-policy" value={motion} onChange={(event) => {
        const policy = event.currentTarget.value;
        if (policy === 'system' || policy === 'reduced' || policy === 'none') {
          setTheme({ motion: policy });
        }
      }}>
        <option value="system">Follow device preference</option>
        <option value="reduced">Reduced</option>
        <option value="none">None</option>
      </select>
      <Button type="button" style={{ transitionDuration: enabled ? '120ms' : '0ms' }}>
        Apply changes
      </Button>
    </>
  );
}`,
  layout: `import { Box, Button, Container, Grid, Inline, Stack } from '@plain/ui';

export function ProjectWorkspace() {
  return (
    <Container maxWidth="80rem" gutter={{ base: 2, md: 3 }}>
      <Stack gap={3}>
        <Inline justify="between" gap={2}>
          <h1>Projects</h1>
          <Button asChild><a href="/projects/new">New project</a></Button>
        </Inline>
        <Grid columns={{ base: 1, md: '16rem minmax(0, 1fr)' }} gap={3}>
          <Box asChild padding={2}>
            <nav aria-label="Projects">
              <Stack gap={1}>
                <a href="/projects" aria-current="page">All projects</a>
                <a href="/projects/archived">Archived</a>
              </Stack>
            </nav>
          </Box>
          <section aria-labelledby="project-list-title">
            <h2 id="project-list-title">Active projects</h2>
            <ul><li><a href="/projects/launch">Website launch</a></li></ul>
          </section>
        </Grid>
      </Stack>
    </Container>
  );
}`,
  splitPane: `import { SplitPane, SplitPaneHandle, SplitPanePanel } from '@plain/ui';

export function ReviewWorkspace() {
  return (
    <SplitPane orientation="horizontal" style={{ height: 480 }}>
      <SplitPanePanel defaultSize="35%" minSize="20%">
        <section aria-label="Review queue">Items awaiting review</section>
      </SplitPanePanel>
      <SplitPaneHandle aria-label="Resize review queue" />
      <SplitPanePanel minSize="30%">
        <section aria-label="Review details">Selected record details</section>
      </SplitPanePanel>
    </SplitPane>
  );
}`,
  mobileNav: `import { NavLink } from 'react-router-dom';
import { Folder, Inbox, Settings } from 'lucide-react';

const destinations = [
  { to: '/projects', label: 'Projects', icon: Folder },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function MobileNavigation() {
  return (
    <nav aria-label="Primary" className="mobile-navigation">
      {destinations.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to}>
          <Icon size={20} aria-hidden="true" /><span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}`,
  virtualList: `import { VirtualList } from '@plain/ui';

const items = Array.from({ length: 1000 }, (_, index) => ({
  id: 'project-' + index,
  name: 'Project ' + (index + 1),
}));

export function ProjectList() {
  return (
    <VirtualList
      aria-label="Projects"
      items={items}
      getItemKey={(item) => item.id}
      height={400}
      estimateSize={56}
      overscan={6}
      ssrCount={10}
      gap={1}
      emptyContent="No projects match the current filters."
      renderItem={(item) => (
        <a href={'/projects/' + item.id} style={{ display: 'block', padding: 16 }}>
          {item.name}
        </a>
      )}
    />
  );
}`,
  virtualLayouts: `import { VirtualGrid, VirtualMasonry } from '@plain/ui';

const items = Array.from({ length: 500 }, (_, index) => ({
  id: 'asset-' + index, name: 'Asset ' + (index + 1),
}));

export function AssetGrid() {
  return <VirtualGrid
    aria-label="Assets"
    items={items}
    getItemKey={(item) => item.id}
    height={480}
    columns={{ base: 1, sm: 2, lg: 3 }}
    rowHeight={120}
    gap={2}
    renderItem={(item) => <a href={'/assets/' + item.id}>{item.name}</a>}
  />;
}

export function AssetMasonry() {
  return <VirtualMasonry
    aria-label="Asset descriptions"
    items={items}
    getItemKey={(item) => item.id}
    height={480}
    lanes={{ base: 1, sm: 2, lg: 3 }}
    estimateSize={180}
    gap={2}
    renderItem={(item) => <article><h2>{item.name}</h2><p>Asset details</p></article>}
  />;
}`,
  blocks: `// These are files downloaded from the documentation, owned by your app.
import AuthPassword from './examples/auth-password';
import StudioBooking from './examples/web-apps-studio-booking';

export function SignInPrototype() {
  return <AuthPassword />;
}

export function BookingPrototype() {
  return <StudioBooking />;
}`,
  blockConfig: `import { useState } from 'react';
import { Button, Field, Input, Textarea, P } from '@plain/ui';
import { Stack } from '@plain/ui/layout';
import '@plain/ui/styles.css';

export function ProjectIntake() {
  const [submitted, setSubmitted] = useState(false);
  return <form onSubmit={(event) => {
    event.preventDefault();
    // Replace this local feedback with your application's submission.
    setSubmitted(true);
  }}>
    <Stack gap={2}>
      <Field label="Project name"><Input name="name" required /></Field>
      <Field label="Details"><Textarea name="details" required /></Field>
      <Button type="submit">Create request</Button>
      {submitted && <P role="status">Request recorded locally.</P>}
    </Stack>
  </form>;
}`,
  templateConfig: `import { useState } from 'react';
import { H1, P } from '@plain/ui/typography';
import {
  AppShell, SidebarProvider, Sidebar, SidebarContent,
  SidebarItem, SidebarTrigger,
} from '@plain/ui/sidebar';
import { Agenda } from './screens/Agenda';
import { Requests } from './screens/Requests';
import '@plain/ui/styles.css';

export function StudioPrototype() {
  const [screen, setScreen] = useState<'agenda' | 'requests'>('agenda');
  return <SidebarProvider>
    <AppShell
      header={<><SidebarTrigger /><P>Studio</P></>}
      sidebar={<Sidebar label="Studio navigation"><SidebarContent>
        <SidebarItem active={screen === 'agenda'} onClick={() => setScreen('agenda')}>
          Agenda
        </SidebarItem>
        <SidebarItem active={screen === 'requests'} onClick={() => setScreen('requests')}>
          Requests
        </SidebarItem>
      </SidebarContent></Sidebar>}
    >
      <H1>{screen === 'agenda' ? 'Studio schedule' : 'Incoming work'}</H1>
      {screen === 'agenda' ? <Agenda /> : <Requests />}
    </AppShell>
  </SidebarProvider>;
}`,
  chart: `import { BarChart } from '@plain/ui/charts';
import '@plain/ui/styles.css';
import '@plain/ui/charts.css';

const data = [
  { month: 'July', revenue: 12400, costs: 7200 },
  { month: 'August', revenue: 14600, costs: 8100 },
  { month: 'September', revenue: 13200, costs: 7800 },
];
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function RevenueChart() {
  return <BarChart
    data={data}
    index="month"
    label="Revenue and costs, July to September, in US dollars"
    caption="Monthly revenue and costs"
    description="August has the highest revenue and costs in this period."
    height={320}
    series={[
      { dataKey: 'revenue', label: 'Revenue' },
      { dataKey: 'costs', label: 'Costs' },
    ]}
    config={{ month: { label: 'Month' } }}
    valueFormatter={(value) => usd.format(value)}
    dataTable="visible"
    chartProps={{ accessibilityLayer: true }}
  />;
}`,
  composedChart: `import { ComposedChart } from 'recharts';
import {
  Chart, ChartBar, ChartGrid, ChartLegend, ChartLine,
  ChartTooltip, ChartXAxis, ChartYAxis,
} from '@plain/ui/charts';
import '@plain/ui/styles.css';
import '@plain/ui/charts.css';

const data = [
  { week: 'Week 1', opened: 18, resolved: 12 },
  { week: 'Week 2', opened: 15, resolved: 17 },
];

export function SupportChart() {
  return (
    <Chart
      data={data}
      label="Support tickets opened and resolved per week"
      height={300}
      dataTable="visible"
      config={{
        week: { label: 'Week' },
        opened: { label: 'Opened', color: 'var(--ui-chart-1)' },
        resolved: { label: 'Resolved', color: 'var(--ui-chart-2)' },
      }}
    >
      <ComposedChart data={data} accessibilityLayer>
        <ChartGrid /><ChartXAxis dataKey="week" /><ChartYAxis />
        <ChartTooltip /><ChartLegend />
        <ChartBar dataKey="opened" name="Opened" />
        <ChartLine dataKey="resolved" name="Resolved" strokeDasharray="4 4" />
      </ComposedChart>
    </Chart>
  );
}`,
  pickers: `import { useState } from 'react';
import {
  DateRangePicker, DateTimePicker, TimeRangePicker,
  Field, Stack, type DateRange, type TimeRange,
} from '@plain/ui';

export function BookingFields() {
  const [dates, setDates] = useState<DateRange>();
  const [start, setStart] = useState<string>();
  const [hours, setHours] = useState<TimeRange>();
  return (
    <Stack gap={3}>
      <Field label="Stay dates" required>
        <DateRangePicker
          name="stay" value={dates} onValueChange={setDates}
          min="2026-10-01" max="2026-12-31" minNights={1} required
        />
      </Field>
      <Field label="Appointment in New York" required>
        <DateTimePicker
          name="startsAt" value={start} onValueChange={setStart}
          timeZone="America/New_York" disambiguation="reject"
          min="2026-10-01T09:00" step={60} required
        />
      </Field>
      <TimeRangePicker
        aria-label="Support hours" name="hours"
        value={hours} onValueChange={setHours}
        fromLabel="Opens" toLabel="Closes" allowOvernight
      />
    </Stack>
  );
}`,
  temporal: `import { Temporal } from 'temporal-polyfill';

export function appointmentInstant(wall: string, timeZone: string) {
  return Temporal.PlainDateTime.from(wall)
    .toZonedDateTime(timeZone, { disambiguation: 'reject' })
    .toInstant()
    .toString();
}

export function exclusiveRangeEnd(inclusiveDay: string) {
  return Temporal.PlainDate.from(inclusiveDay).add({ days: 1 }).toString();
}`,
  fullCalendar: `import { useRef, useState } from 'react';
import { Button } from '@plain/ui';
import { FullCalendar, type FullCalendarRef } from '@plain/ui/full-calendar';
import '@plain/ui/styles.css';
import '@plain/ui/full-calendar.css';

export function TeamSchedule() {
  const ref = useRef<FullCalendarRef>(null);
  const [selection, setSelection] = useState('');
  return (
    <>
      <Button type="button" variant="outline" onClick={() => ref.current?.getApi().today()}>
        Today
      </Button>
      <FullCalendar
        ref={ref}
        aria-label="Team schedule"
        defaultView="timeGridWeek"
        initialDate="2026-10-05"
        timeZone="local"
        height={560}
        mobileView="listWeek"
        mobileBreakpoint={640}
        selectable
        events={[{
          id: 'kickoff', title: 'Project kickoff',
          start: '2026-10-05T09:00:00', end: '2026-10-05T10:00:00',
        }]}
        select={({ startStr, endStr }) => setSelection(startStr + ' to ' + endStr)}
        eventClick={({ event }) => setSelection(event.title)}
      />
      <p role="status">{selection}</p>
    </>
  );
}`,
  lazyView: `import { lazy, Suspense } from 'react';
import { Spinner } from '@plain/ui';

const Reports = lazy(() => import('./Reports'));

export function ReportsRoute() {
  return <Suspense fallback={<Spinner label="Loading reports" />}>
    <Reports />
  </Suspense>;
}`,
};

function GuideSection({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="doc-section" id={id}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="guide-check-list">
      {items.map((item) => (
        <li key={item}>
          <Check size={15} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Introduction() {
  return (
    <>
      <GuideSection title="A neutral starting point">
        <p>
          P.UI combines styled components with native props, refs, typed styling slots, and scoped
          tokens. It works without a consumer Tailwind setup or a downloaded font. Add a brand when
          your application needs one; the default is neutral.
        </p>
        <CodeBlock code={examples.form} title="NewProject.tsx" />
        <p>
          This example records a project locally. Connect submission, authorization, persistence,
          and errors to your application services before treating it as a production workflow.
        </p>
      </GuideSection>
      <GuideSection title="Choose the surface for the task">
        <p>
          Use a table to compare records, a list and detail view to review work, or a calendar to
          schedule events. A stack of generic cards is not a substitute for navigation, editing, and
          a clear return path. Keep page sections unframed; use cards for independent objects.
        </p>
        <div className="guide-link-list">
          {[
            {
              to: '/docs/installation',
              title: 'Install @plain/ui',
              copy: 'Set up the package and styles.',
            },
            {
              to: '/components',
              title: 'Components',
              copy: 'Inspect examples, props, and styling slots.',
            },
            { to: '/blocks', title: 'Blocks', copy: 'Adapt a focused workflow composition.' },
            {
              to: '/templates',
              title: 'Templates',
              copy: 'Explore connected application screens.',
            },
          ].map(({ to, title, copy }) => (
            <Link key={to} to={to}>
              <div>
                <strong>{title}</strong>
                <span>{copy}</span>
              </div>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </GuideSection>
      <GuideSection title="What changes in 0.2">
        <p>
          The package name changes from <code>@plainui/react</code> to <code>@plain/ui</code>.
          Update JavaScript and stylesheet imports together. Version 0.2 adds layered color roles,
          brand extensions, responsive and virtual layouts, date/time controls, optional charts and
          scheduling, motion policies, blocks, and templates. Review Sheet direction at its root
          when migrating to the Vaul-backed implementation.
        </p>
      </GuideSection>
      <Alert>
        <AlertTitle>React DOM, including mobile web</AlertTitle>
        <AlertDescription>
          These are web components for React applications, responsive mobile sites, and PWAs. They
          are not React Native controls or a native desktop runtime.
        </AlertDescription>
      </Alert>
    </>
  );
}

function Installation() {
  return (
    <>
      <GuideSection title="1. Install the local package">
        <p>
          This workspace describes the 0.2 release; it does not establish npm publication. Build and
          pack the repository, then install the resulting archive in a consuming project.
        </p>
        <CodeBlock language="sh" title="In the P.UI workspace" code={`npm install\nnpm pack`} />
        <CodeBlock
          language="sh"
          title="In your React application"
          code="npm install ./plain-ui-0.2.0.tgz"
        />
        <p>
          React and React DOM are peers supporting React 18.3 or 19. Local build tooling requires
          Node 22.12 or newer. Use the repository lockfile for development; compatibility-tested
          engine pins are intentional, not a request to upgrade every dependency.
        </p>
      </GuideSection>
      <GuideSection title="2. Import styles and configure the root">
        <CodeBlock code={examples.provider} title="AppProviders.tsx" />
        <p>
          Import <code>@plain/ui/styles.css</code> once. PlainProvider combines theme, direction,
          token overrides, and styling context without a layout wrapper. Its theme settings are
          initial defaults, not controlled props; use <code>useTheme().setTheme</code> for changes.
        </p>
        <p>
          Persistence uses local storage and synchronizes theme settings between tabs when storage
          is available. <code>persist={'{false}'}</code> disables storage reads and writes; it is
          not session storage. Use a single application-level provider because it writes HTML root
          attributes and variables. Use ThemeScope for local appearance.
        </p>
      </GuideSection>
      <GuideSection title="3. Add optional engines deliberately">
        <CodeBlock
          title="Optional entry points"
          code={`import { Motion, MotionProvider, Presence } from '@plain/ui/motion';\n\nimport { BarChart } from '@plain/ui/charts';\nimport '@plain/ui/charts.css';\n\nimport { FullCalendar } from '@plain/ui/full-calendar';\nimport '@plain/ui/full-calendar.css';`}
        />
        <p>
          These entries are separate from the root component collection. Motion needs
          MotionProvider; charts and FullCalendar need their optional stylesheets in addition to the
          base styles. Blocks and templates are copied application source, not package entries.
          Lazy-load heavy application views when appropriate; an opt-in import is not a guarantee of
          a particular bundle size.
        </p>
      </GuideSection>
      <GuideSection title="Tailwind and unstyled applications">
        <p>
          The distributed CSS is precompiled. Consumers do not need Tailwind to render defaults.
          This repository uses Tailwind CSS 4.3.3. When compiling library source yourself, include
          that source in your own build scan; installed precompiled styles need no extra scan.
        </p>
        <CodeBlock
          language="css"
          code={`@import 'tailwindcss';\n/* Only when compiling library classes yourself. Adjust for your CSS file's location. */\n@source '../node_modules/@plain/ui/dist';`}
        />
        <p>
          For an unstyled integration, enable <code>unstyled</code> and provide your own CSS.
          Omitting the stylesheet also removes token defaults and baseline behavior. Import
          <code> @plain/ui/tokens.css</code> separately when you want the token layer without
          component CSS.
        </p>
      </GuideSection>
      <GuideSection title="Server rendering">
        <p>
          In Next.js App Router, put PlainProvider in a client component and import global styles in
          the root layout. Use <code>@plain/ui/color-theme</code> for server-side generation. Emit
          initial theme CSS and HTML theme/direction attributes before paint. A system preference
          cannot be known from JavaScript on the server; choose a consistent fallback or resolve a
          saved preference and hydrate with matching settings.
        </p>
        <p>
          <Link className="text-link" to="/docs/theming">
            See generated themes and scopes
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </p>
      </GuideSection>
    </>
  );
}

function Theming() {
  const { customize } = useAppPreferences();
  return (
    <>
      <GuideSection title="A seed changes the whole color system">
        <p>
          Set a hex <code>color</code> to generate light and dark backgrounds, layered surfaces,
          foregrounds, primary/secondary/tertiary roles, containers, inverse roles, errors,
          outlines, focus, chart colors, and tonal palettes. This is not just a tinted button. The
          default
          <code> color: null</code> with <code>accent: 'neutral'</code> preserves the original 0.1
          hand-authored neutral colors exactly. The default does not use Material palette
          generation.
        </p>
        <Button type="button" variant="outline" onClick={customize}>
          <Paintbrush aria-hidden="true" />
          Open theme editor
        </Button>
        <CodeBlock code={examples.brand} title="BrandProviders.tsx" />
        <p>
          Seeds accept <code>#RGB</code> or <code>#RRGGBB</code>. Schemes are <code>tonal</code>,
          <code> vibrant</code>, or <code>expressive</code>; contrast is clamped to{' '}
          <code>0..1</code>. Contrast changes generation, not an accessibility score. Check the
          final content, selected, hover, disabled, and focus states in both modes after overriding
          colors.
        </p>
      </GuideSection>
      <GuideSection title="Root policy and explicit overrides">
        <p>
          Theme radius is a number in pixels, density is compact/comfortable/spacious, and borders
          are subtle/none/strong. Borderless mode changes shared border tokens; use surface levels,
          spacing, and visible focus to preserve control boundaries. Explicit token or local style
          overrides can reintroduce a border. Motion policy is system/reduced/none and is
          independent of color generation.
        </p>
        <p>
          Provider token overrides win over generated roles and settings. Root keys such as
          <code> background</code> change shared roles; dotted keys such as
          <code> sidebar.background</code> change one component family. Changing a background alone
          does not regenerate a matching foreground.
        </p>
        <CodeBlock code={examples.themeControls} />
        <p>
          <code>useTheme()</code> exposes all ThemeSettings, <code>resolvedMode</code>,
          <code> resolvedColor</code>, <code>setTheme</code>, and <code>resetTheme</code>. An
          explicit color wins over the legacy accent preset. When color is null, accent is the
          fallback; reset both to clear a legacy brand. Resetting settings does not remove provider
          token overrides.
        </p>
      </GuideSection>
      <GuideSection title="Generate once for the server or a local brand">
        <CodeBlock code={examples.generated} title="brand.tsx" />
        <p>
          <code>createTheme</code> returns <code>{'{ color, light, dark, css }'}</code>. Shared{' '}
          <code>tokens</code> override generation, then <code>light</code>/<code>dark</code>
          overrides win for their mode. Invalid non-null seeds throw. Geometry, density, border, and
          motion settings belong to the provider, not this color generator.
        </p>
        <p>
          The CSS contains light <code>:root</code> declarations and
          <code> [data-theme='dark']</code> overrides. Emit it before paint and align the initial
          HTML attributes and provider settings. For multiple local brands, use the token maps
          rather than injecting competing root stylesheets. Account for your application's CSP when
          emitting an inline style element.
        </p>
      </GuideSection>
      <GuideSection title="Scope a complete light or dark system">
        <Grid columns={{ base: 1, sm: 2 }} gap={2}>
          {(['light', 'dark'] as const).map((mode) => (
            <ThemeScope
              key={mode}
              mode={mode}
              tokens={{ ...previewTheme[mode], 'button.radius': '4px' }}
              style={{
                background: 'var(--ui-background)',
                color: 'var(--ui-foreground)',
                padding: 24,
                minWidth: 0,
              }}
            >
              <h3 style={{ fontSize: 16, marginBlockEnd: 16 }}>
                {mode === 'light' ? 'Light' : 'Dark'} workspace
              </h3>
              <Field label="Project name">
                <Input placeholder="Studio launch" />
              </Field>
              <Button type="button" variant="accent" style={{ marginBlockStart: 16 }}>
                Save project
              </Button>
            </ThemeScope>
          ))}
        </Grid>
        <CodeBlock code={examples.scopes} />
        <p>
          ThemeScope accepts <code>mode="light"</code> or <code>mode="dark"</code>, not system. Pass
          the matching generated map when switching a branded root to the opposite mode; a mode
          attribute alone does not replace inherited inline brand variables. Component aliases
          resolve within the scope. The local slot prop is <code>componentStyles</code>;
          PlainProvider calls it <code>styles</code>.
        </p>
        <p>
          Scope-aware overlays use the local portal container. Verify open dialogs, menus, and other
          portaled content, not just inline controls. Do not nest application providers to create a
          local theme; their settings target the document root.
        </p>
      </GuideSection>
    </>
  );
}

function tokenGroup(token: ThemeToken) {
  return token.startsWith('palette.') ? 'palette' : token.includes('.') ? 'component' : 'root';
}

function Tokens() {
  const [query, setQuery] = React.useState('');
  const [group, setGroup] = React.useState('root');
  const search = query.trim().toLowerCase();
  const visible = tokenNames.filter(
    (token) =>
      (group === 'all' || tokenGroup(token) === group) &&
      (token.includes(search) || tokenVariable(token).includes(search)),
  );
  const counts = {
    root: Object.keys(lightTokens).length,
    component: Object.keys(componentTokenAliases).length,
  };
  return (
    <>
      <GuideSection title="Read the current contract" id="colors">
        <p>
          <code>tokenNames</code> lists {tokenNames.length} typed names: {counts.root} root tokens,{' '}
          {counts.component} component aliases, and tonal palette names. Root names are flat;
          component aliases use dots. <code>tokenVariable('sidebar.background')</code>
          returns <code>--ui-sidebar-background</code>. Slots such as <code>button.root</code>
          are class targets, not color tokens.
        </p>
        <CodeBlock code={examples.tokenHelpers} title="Token helpers" />
        <p>
          Palette tones have defined neutral defaults, included by{' '}
          <code>createTheme({'{ color: null }'})</code>. A hex seed generates new palette values and
          semantic color roles. Use <code>control-border</code>
          for a shared control outline; <code>input.border</code> resolves to it. The legacy
          <code> input-border</code> key and <code>input.border</code> map to the same CSS variable.
          Do not point that alias at <code>--ui-input-border</code>, which would reference itself.
        </p>
      </GuideSection>
      <GuideSection title="Token reference">
        <Field label="Filter tokens">
          <Input
            type="search"
            dir="ltr"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="background, button, --ui-chart..."
          />
        </Field>
        <Tabs value={group} onValueChange={setGroup} style={{ marginBlockStart: 16 }}>
          <TabsList
            aria-label="Token category"
            style={{ display: 'flex', flexWrap: 'wrap', height: 'auto', gap: 4 }}
          >
            <TabsTrigger value="root">Root</TabsTrigger>
            <TabsTrigger value="component">Components</TabsTrigger>
            <TabsTrigger value="palette">Palettes</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          {['root', 'component', 'palette', 'all'].map((category) => (
            <TabsContent key={category} value={category}>
              <p role="status" style={{ fontSize: 13, marginBlock: 16 }}>
                {visible.length} matching tokens
              </p>
              <Table
                aria-label="Design token reference"
                style={{ fontSize: 12, tableLayout: 'fixed', minWidth: 560 }}
                wrapperProps={{
                  tabIndex: 0,
                  role: 'region',
                  'aria-label': 'Token reference scroll area',
                  style: { maxHeight: 560 },
                }}
              >
                <TableCaption>
                  Neutral light/dark defaults and component alias references. A color seed replaces
                  palette tones and semantic color roles.
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ width: '40%' }}>Token / CSS variable</TableHead>
                    <TableHead>Light</TableHead>
                    <TableHead>Dark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((token) => (
                    <TableRow key={token}>
                      <TableHead
                        scope="row"
                        className="whitespace-normal"
                        style={{ overflowWrap: 'anywhere' }}
                      >
                        <code dir="ltr">{token}</code>
                        <br />
                        <code dir="ltr">{tokenVariable(token)}</code>
                      </TableHead>
                      <TableCell style={{ overflowWrap: 'anywhere' }}>
                        <code dir="ltr">
                          {rootDefaults[token] ?? aliasDefaults[token] ?? 'Not defined'}
                        </code>
                      </TableCell>
                      <TableCell style={{ overflowWrap: 'anywhere' }}>
                        <code dir="ltr">
                          {darkDefaults[token] ?? aliasDefaults[token] ?? 'Not defined'}
                        </code>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!visible.length && (
                    <TableRow>
                      <TableCell colSpan={3}>No matching tokens.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          ))}
        </Tabs>
      </GuideSection>
      <GuideSection title="Typography" id="typography">
        <p>
          The font token prefers Inter when available and falls back to system fonts. The library
          does not download a font; this documentation bundles Inter locally. Use a compact heading
          hierarchy, comfortable line height, and tabular numbers for comparable metrics. Keep
          letter spacing at zero and avoid viewport-scaled text in controls or panels.
        </p>
        <CodeBlock
          code={`import { H1, H2, P, A, Strong, Code } from '@plain/ui/typography';\n\nexport function ProjectHeader() {\n  return <>\n    <H1 size="2xl">Project activity</H1>\n    <P tone="muted">A clear view of <Strong>your work</Strong>.</P>\n    <H2 size="lg">Latest changes</H2>\n    <P><A href="/projects">All projects</A> use <Code>projectId</Code>.</P>\n  </>;\n}`}
        />
        <p>
          H1-H6, P, Span, Small, Strong, Em, A, Code, Pre, Blockquote, Ul, Ol, Li, and Mark retain
          their native HTML tags, attributes, and refs. Size is independent from heading level. Use
          logical alignment, tone, weight, wrapping, tokens, or unstyled for local styling.
        </p>
        <div className="typography-specimen">
          <div>
            <span>Heading / 24px</span>
            <strong style={{ fontSize: 24 }}>Project activity</strong>
          </div>
          <div>
            <span>Body / 16px</span>
            <p>A clear view of the work that needs attention.</p>
          </div>
          <div>
            <span>Label / 14px</span>
            <Label>Project name</Label>
          </div>
        </div>
      </GuideSection>
      <GuideSection title="Spacing and density" id="spacing">
        <p>
          Use an 8px spacing rhythm with 4px optical adjustments. Layout numbers are grid units:
          <code> gap={'{2}'}</code> means 16px; CSS token values remain strings. Root radius
          defaults to 6px. Comfortable control height is 40px, compact is 32px, and spacious is
          48px. Explicit component sizes may use a different height; inspect touch targets rather
          than assuming density makes every control touch-friendly.
        </p>
        <div className="spacing-scale">
          {[8, 16, 24, 32, 48, 64].map((space) => (
            <div key={space}>
              <span>{space}px</span>
              <div style={{ width: space }} />
            </div>
          ))}
        </div>
      </GuideSection>
      <GuideSection title="Motion and layers" id="motion">
        <p>
          Duration and easing tokens control CSS transitions. Default layer values are dropdown 100,
          overlay 80, dialog 90, and toast 110. Direct component props can override them; keep
          related portal layers coherent. System reduction or explicit reduced/none policy removes
          the default motion. Custom CSS and external engines need to follow that policy too.
        </p>
        <p>
          <Link className="text-link" to="/docs/motion">
            Motion policy and optional animation
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </p>
      </GuideSection>
    </>
  );
}

function Customization() {
  const [feedback, setFeedback] = React.useState('');
  return (
    <>
      <GuideSection title="Use the smallest useful override">
        <p>
          Use theme settings for shared appearance, semantic tokens for shared values, typed slots
          for component parts, and native props/classes for one instance. Use ThemeScope for a local
          brand or direction. Unstyled mode is for owning the complete presentation, not just
          removing an unwanted corner.
        </p>
        <Tabs defaultValue="default" onValueChange={() => setFeedback('')}>
          <TabsList
            aria-label="Customization comparison"
            style={{ display: 'flex', flexWrap: 'wrap', height: 'auto' }}
          >
            <TabsTrigger value="default">Neutral</TabsTrigger>
            <TabsTrigger value="brand">Branded</TabsTrigger>
            <TabsTrigger value="unstyled">Unstyled</TabsTrigger>
          </TabsList>
          <TabsContent value="default">
            <div className="brand-preview">
              <Field label="Project name">
                <Input placeholder="Studio launch" />
              </Field>
              <Button type="button" onClick={() => setFeedback('Saved locally')}>
                Save project
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="brand">
            <ThemeScope
              tokens={{ ...previewTheme.light, 'button.radius': '4px' }}
              mode="light"
              style={{
                background: 'var(--ui-background)',
                color: 'var(--ui-foreground)',
                padding: 16,
              }}
            >
              <div className="brand-preview">
                <Field label="Project name">
                  <Input placeholder="Studio launch" />
                </Field>
                <Button type="button" variant="accent" onClick={() => setFeedback('Saved locally')}>
                  Save project
                  <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </ThemeScope>
          </TabsContent>
          <TabsContent value="unstyled">
            <ThemeScope unstyled>
              <div className="brand-preview unstyled-preview">
                <Field label="Project name">
                  <Input className="raw-input" placeholder="Studio launch" />
                </Field>
                <Button
                  type="button"
                  className="raw-button"
                  onClick={() => setFeedback('Saved locally')}
                >
                  Save project
                </Button>
              </div>
            </ThemeScope>
          </TabsContent>
        </Tabs>
        <p role="status" style={{ fontSize: 14, minHeight: 24 }}>
          {feedback}
        </p>
      </GuideSection>
      <GuideSection title="Extend a component without hiding its control">
        <CodeBlock code={examples.extension} title="BrandButton.tsx" />
        <p>
          <code>extendComponent</code>, also exported as <code>extend</code>, preserves the
          component's native props and ref. Caller props replace <code>defaults</code>, including
          event handlers; handlers are not automatically chained. Custom variants are consumed
          rather than sent to the DOM. Choose names such as <code>tone</code> that do not collide
          with native or existing component props.
        </p>
        <p>
          Classes merge in this order: defaults, configured className, selected and compound
          variants, caller className. Conflicting Tailwind utilities merge last; ordinary CSS still
          follows specificity and the cascade. With configured tokens, inline styles merge defaults,
          token variables, then caller style. The caller's 4px token wins over the configured 8px
          radius above. Slot styles provide classes through a local StyleProvider.
        </p>
      </GuideSection>
      <GuideSection title="Style named parts, not private engine markup">
        <CodeBlock code={examples.slots} />
        <p>
          <code>ComponentStyles</code> is a typed map of public slots. Local providers replace the
          inherited class string for the same slot; they do not concatenate it. Component defaults
          are merged first, the slot class next, and an instance class last. Check the component
          reference for available parts. A slot key and a dotted token key are different contracts.
        </p>
        <CodeBlock
          language="css"
          code={`/* Stable part attributes for your own stylesheet */\n[data-ui='button'][data-slot='root'] {\n  font-weight: 600;\n}\n\n[data-ui='input'][data-slot='root']:focus-visible {\n  outline: 3px solid var(--ui-focus-ring);\n  outline-offset: 3px;\n}`}
        />
      </GuideSection>
      <GuideSection title="Unstyled is a presentation responsibility">
        <CodeBlock code={examples.unstyled} />
        <p>
          Unstyled parts retain their native or primitive semantics and interaction, but remove
          default classes. Your CSS must supply overlay positioning, stacking, focus visibility,
          disabled and invalid states, contrast, motion behavior, and usable targets. Provider slot
          classes and explicit instance classes are still applied. A component can opt back in with
          <code> unstyled={'{false}'}</code>.
        </p>
      </GuideSection>
      <GuideSection title="Keep one semantic element">
        <CodeBlock code={examples.asChild} />
        <p>
          Use <code>asChild</code> on supported components and primitive triggers to compose a link
          or your own forwarding component. Supply one element that accepts the passed props and
          ref. Do not nest a button inside a link or another button. A disabled button style does
          not make an anchor non-navigable; define disabled-link behavior in your application.
        </p>
        <p>
          <Link className="text-link" to="/docs/theming">
            Root tokens, component aliases, and border policies
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </p>
      </GuideSection>
    </>
  );
}

function RTL() {
  const { direction, setDirection } = useAppPreferences();
  const id = React.useId();
  return (
    <>
      <GuideSection title="Direction affects behavior and layout">
        <p>
          PlainProvider sets HTML direction and primitive direction context. ThemeScope supplies
          both locally. DirectionProvider only supplies context; set <code>dir</code> on the DOM
          element you own as well. Localize labels and calendar locale data separately.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => setDirection(direction === 'rtl' ? 'ltr' : 'rtl')}
        >
          <MoveHorizontal aria-hidden="true" />
          {direction === 'rtl' ? 'Use left-to-right layout' : 'Try right-to-left layout'}
        </Button>
        <div className="rtl-preview">
          <ThemeScope dir="rtl" lang="ar">
            <Field label={'\u0627\u0633\u0645 \u0627\u0644\u0645\u0634\u0631\u0648\u0639'}>
              <Input name="rtl-project" />
            </Field>
            <div className="rtl-switch-row">
              <Label htmlFor={id}>
                {'\u0625\u0634\u0639\u0627\u0631\u0627\u062a \u0627\u0644\u0628\u0631\u064a\u062f'}
              </Label>
              <Switch id={id} defaultChecked />
            </div>
          </ThemeScope>
        </div>
      </GuideSection>
      <GuideSection title="Use logical edges and root Sheet direction">
        <CodeBlock code={examples.rtl} />
        <p>
          Prefer padding-inline, margin-inline, inset-inline, and text-align: start/end, or logical
          utilities such as <code>ps</code>, <code>pe</code>, <code>ms</code>, and <code>me</code>.
          <code> Sheet side="end"</code> resolves to right in LTR and left in RTL at the Vaul root.
          Sheet supports start/end/left/right/top/bottom; Drawer defaults to bottom.
        </p>
        <p>
          Root <code>side</code> takes precedence over Vaul's physical <code>direction</code> and
          the legacy <code>SheetContent side</code> fallback. Prefer setting it on the root so drag
          direction and placement agree. Test swipe, focus return, and scrolling in both directions.
          Use explicit LTR spans or <code>bdi</code> for mixed identifiers; do not mirror every
          icon, chart, or media control.
        </p>
      </GuideSection>
      <GuideSection title="Verify keyboard behavior in context">
        <Checklist
          items={[
            'Test arrows in tabs, radio groups, sliders, and calendar navigation.',
            'Test typeahead, Escape, and focus return in open menus and overlays.',
            'Keep DOM and reading order meaningful across responsive layouts.',
            'Check mixed-language text, long labels, and local portaled content.',
          ]}
        />
      </GuideSection>
    </>
  );
}

function AccessibilityGuide() {
  return (
    <>
      <GuideSection title="Primitives do not replace application testing">
        <p>
          Native elements provide button, form, and table semantics. Radix and Vaul provide
          interaction patterns for overlays and composite controls; DayPicker, cmdk, Sonner,
          Recharts, and FullCalendar handle their respective domains. Names, descriptions, content
          order, navigation, and application state still belong to you.
        </p>
      </GuideSection>
      <GuideSection title="Label the focusable control">
        <CodeBlock code={examples.validation} />
        <p>
          Field connects its label, description, and error to the child control. Its required
          indication does not replace native <code>required</code> validation. With a compound
          control, attach field props to its focusable trigger or input, not a non-DOM root. Give
          icon-only actions names and unfamiliar tools tooltips; do not use a placeholder as the
          only label.
        </p>
      </GuideSection>
      <GuideSection title="Plan focus after every transition">
        <Checklist
          items={[
            'Reach actions with Tab and Shift+Tab; use arrow keys where the composite pattern expects them.',
            'Give dialogs and sheets useful titles; retain an explicit, reachable close action.',
            'Check initial focus, Escape, focus trapping when modal, and focus return after closing.',
            'Move focus deliberately after deleting a record or changing route; preserve useful list state.',
            'Keep focused controls visible above fixed navigation and the software keyboard.',
          ]}
        />
      </GuideSection>
      <GuideSection title="Color, motion, reflow, and alternatives">
        <p>
          Do not encode status only in color. Check text, non-text controls, focus, selected, and
          error contrast after customization, including borderless mode. Use spacious density or
          additional padding for touch workflows, while checking explicit small/icon sizes. Test
          reduced/none motion, enlarged text, narrow layouts, and 200% zoom.
        </p>
        <p>
          Charts need a textual insight and accessible data alternative. Virtualized content needs
          pagination, export, or a nonvirtual view where full traversal, printing, or browser find
          matters. Dragging and swiping need usable non-gesture alternatives.
        </p>
      </GuideSection>
      <GuideSection title="Record what was actually verified">
        <p>
          Run automated checks on meaningful states, then test keyboard and screen-reader use with
          actual application content. Cover loading, empty, error, invalid, disabled, long-content,
          dark, and RTL states. Record browser and viewport separately from physical-device and
          assistive-technology coverage. Generated colors and automated scans do not certify WCAG
          compliance or complete accessibility.
        </p>
        <a className="text-link" href="https://www.w3.org/WAI/WCAG22/quickref/">
          WCAG 2.2 quick reference
          <ArrowRight size={14} aria-hidden="true" />
        </a>
      </GuideSection>
    </>
  );
}

function MotionGuide() {
  return (
    <>
      <GuideSection title="Policy works without the animation entry">
        <p>
          Set <code>theme.motion</code> on PlainProvider: system follows
          <code> prefers-reduced-motion</code>; reduced and none explicitly disable the optional
          Motion wrapper's transitions, entrance, and exit animation. The CSS motion scale becomes
          zero for reduced/none, making default effects effectively instant; duration tokens remain
          available for custom styling. Neither policy removes feedback or functionality.
        </p>
        <CodeBlock code={examples.motionPolicy} />
        <p>
          <code>useMotionSettings()</code> returns <code>policy</code>, <code>reduced</code>, and
          <code> enabled</code>. Use it for custom effects or third-party animations; arbitrary
          animation code does not automatically obey the provider. Scope the hook's JS policy with
          MotionPolicyProvider when needed; that context alone does not set CSS attributes.
        </p>
      </GuideSection>
      <GuideSection title="Opt into Motion and Presence">
        <CodeBlock code={examples.motion} />
        <p>
          Import from <code>@plain/ui/motion</code>, not the root collection. MotionProvider loads
          the engine features lazily and sets a default transition; its duration is in seconds.
          Motion renders a ref-forwarding div and supports <code>fade</code>, <code>slide</code>,
          and <code>scale</code> presets plus Motion's div props. Presence is AnimatePresence; keyed
          children are needed for exit tracking.
        </p>
      </GuideSection>
      <GuideSection title="Use motion to explain, then verify without it">
        <Checklist
          items={[
            'Use brief feedback for a state transition, not a decorative looping entrance.',
            'Keep completion, dismissal, and focus independent of animation-end events.',
            'Avoid hiding essential content until an animation runs.',
            'Test a system preference change and explicit reduced/none policies while the view is mounted.',
            'Keep CSS millisecond tokens distinct from Motion transition durations in seconds.',
          ]}
        />
      </GuideSection>
    </>
  );
}

function LayoutsGuide() {
  return (
    <>
      <GuideSection title="Compose an actual workspace">
        <CodeBlock code={examples.layout} />
        <p>
          Box supplies a wrapper or <code>asChild</code> padding. Stack is vertical; Inline is a
          wrapping row by default; Flex exposes direction, alignment, justification, and wrapping.
          Grid accepts a column count or CSS track string, plus <code>minItemWidth</code> for
          auto-fit layouts. Container constrains width and uses logical gutters. Use links for
          destinations and tabs for peer views within a task.
        </p>
      </GuideSection>
      <GuideSection title="Know which numbers are spacing units">
        <p>
          Responsive values use <code>base</code>, <code>sm</code> (640px), <code>md</code>
          (768px), and <code>lg</code> (1024px). Unspecified larger values inherit the previous
          breakpoint. Numeric gap, padding, gutter, and Spacer size are multiples of 8px; strings
          are CSS lengths. Container's numeric <code>maxWidth</code> is pixels, not spacing units.
          Keep shrinking grid/flex children at <code>min-width: 0</code>.
        </p>
        <p>
          Center aligns a small surface; Spacer can consume free flex space. CSS-column Masonry
          flows down a column before the next one, so its visual order differs from a row-major
          grid. Prefer ordinary Grid for ordered forms, comparisons, and sequential tasks.
        </p>
      </GuideSection>
      <GuideSection title="Resizable panels are a tool surface">
        <CodeBlock code={examples.splitPane} />
        <p>
          SplitPane, SplitPanePanel, and SplitPaneHandle wrap react-resizable-panels. Use the
          engine's orientation and size constraints; explicit percentages avoid ambiguous numeric
          sizing. Name the resize handle, preserve its keyboard behavior, and give the group a
          bounded height. Switch to a route or stacked detail view when a narrow layout cannot
          accommodate both panels. Recheck embedded charts after resizing.
        </p>
      </GuideSection>
      <GuideSection title="Mobile navigation is application navigation">
        <CodeBlock code={examples.mobileNav} />
        <CodeBlock
          language="css"
          code={`.mobile-navigation {\n  display: flex;\n  justify-content: space-around;\n  gap: 8px;\n  padding: 8px 16px max(8px, env(safe-area-inset-bottom));\n}\n.mobile-navigation a {\n  display: grid;\n  justify-items: center;\n  gap: 4px;\n  min-block-size: 48px;\n  padding: 8px;\n}\n.mobile-navigation a[aria-current='page'] {\n  color: var(--ui-accent);\n  font-weight: 600;\n}`}
        />
        <p>
          A small set of primary destinations can use bottom navigation; secondary destinations or
          filters can use a Sheet/Drawer. Preserve the same destination model across breakpoints.
          Use safe-area spacing and dynamic viewport height, avoid competing scroll regions, and
          reserve content space when navigation is fixed. Check Back, unsaved edits, focus, and
          software-keyboard overlap rather than treating a small desktop shell as a mobile app.
        </p>
      </GuideSection>
    </>
  );
}

function VirtualizationGuide() {
  return (
    <>
      <GuideSection title="Window rendering, not data fetching">
        <p>
          VirtualList, VirtualGrid, and VirtualMasonry use TanStack Virtual to mount a window of
          items inside a bounded scroll viewport. They do not fetch records, sort them, or implement
          server pagination. Keep item IDs stable across filtering and sorting; array indexes are
          unsuitable keys when records can move.
        </p>
        <CodeBlock code={examples.virtualList} />
        <p>
          <code>estimateSize</code> and <code>height</code> are pixels when numeric;
          <code> gap</code> uses 8px units. List rows are measured after mounting; estimate
          realistic heights to reduce jumps. <code>ssrCount</code> renders a bounded initial set on
          the server and before measurement, not the entire collection.
        </p>
      </GuideSection>
      <GuideSection title="Choose grid or masonry deliberately">
        <CodeBlock code={examples.virtualLayouts} />
        <p>
          VirtualGrid uses responsive column counts and a fixed <code>rowHeight</code> (pixels); it
          does not measure variable-height grid rows. Cell overflow can create nested scrolling, so
          fit the content or choose another layout. VirtualMasonry uses responsive lane counts, an
          estimated item height, and measurement for variable items. Keep reading order and focus
          order understandable when visual lanes differ.
        </p>
      </GuideSection>
      <GuideSection title="Focus retention is not full-dataset access">
        <p>
          The viewport is a list and items expose list-item position/count metadata. It is not an
          ARIA grid with roving cell navigation. A focused row stays in the render range while focus
          remains inside; removing or filtering that record still needs an application focus plan.
          Viewport arrows, Page Up/Down, and Home/End scroll only when the viewport itself is the
          event target, leaving child control keys alone.
        </p>
        <Alert>
          <AlertTitle>Unmounted records are not document content</AlertTitle>
          <AlertDescription>
            Browser find, printing, and screen-reader traversal cannot access every unmounted row.
            Offer pagination, export, or a nonvirtual view when those workflows matter. Test resize,
            hidden-tab reveal, variable content, both scroll ends, and focused items beyond the
            initial window.
          </AlertDescription>
        </Alert>
      </GuideSection>
    </>
  );
}

function BlocksTemplatesGuide() {
  return (
    <>
      <GuideSection title="Copy application source">
        <p>
          The 0.2 collection contains 120 blocks in 12 workflow categories and 60 templates in five
          platform categories: web apps, mobile apps, desktop apps, dashboards, and websites.
          Platform categories describe React DOM layouts, not native runtimes. The examples use
          local state and sample data; signing in, payments, invitations, and scheduling are not
          connected services.
        </p>
        <CodeBlock code={examples.blocks} />
        <p>
          Preview an example, then use its Code, Copy, or Download action. Each TSX file includes
          its own React implementation, data, helpers, and styles. Place it in your application,
          rename it, and edit it directly. It imports public P.UI primitives and, where needed,
          established engines; no block renderer or template registry is bundled in @plain/ui.
        </p>
        <p>
          <Link className="text-link" to="/blocks">
            Browse blocks
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
          {' / '}
          <Link className="text-link" to="/templates">
            Browse templates
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </p>
      </GuideSection>
      <GuideSection title="Own the markup and behavior">
        <CodeBlock code={examples.blockConfig} />
        <p>
          The downloaded file is ordinary TypeScript and React, not a configuration-only API. Change
          its structure, fields, data, actions, and styling as freely as native HTML. Local types
          and sample configurations are editable conveniences, not a runtime contract with the
          library. Keep only the pieces your workflow needs.
        </p>
      </GuideSection>
      <GuideSection title="Connect screens around the workflow">
        <CodeBlock code={examples.templateConfig} />
        <p>
          Templates include their screens, navigation, local state, and styles in the copied file.
          You can split those into your own modules, as in this shell example. The Agenda and
          Requests imports represent application-owned screens. Local navigation and created records
          are not browser routing or durable storage; add URLs, Back behavior, authorization, remote
          data, and persistence according to your application.
        </p>
        <Checklist
          items={[
            'Keep the product-specific task, useful fields, and navigation model; remove sample branding.',
            'Connect actions to real services with loading, error, validation, and permission states.',
            'Review nested landmarks and headings when inserting a full template in another shell.',
            'Test list/detail return paths and mobile navigation, not just the first screen.',
            'Reuse theme tokens and slots so an adapted composition still follows light/dark, RTL, and motion policy.',
          ]}
        />
      </GuideSection>
    </>
  );
}

function VersionsGuide() {
  const { manifest, error } = useDocsVersions();
  return (
    <>
      <GuideSection title="Choose your release">
        <p>
          The version menu opens that release's complete documentation, not just its changelog.
          Switching preserves the current page, query, and fragment when the target contains it. A
          component added later falls back to the older component index. Archived releases retain
          their original APIs, live previews, guides, search, colors, and downloadable package.
        </p>
        <Table>
          <TableCaption>Available documentation releases</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Release</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {manifest.versions.map((version) => (
              <TableRow key={version.version}>
                <TableCell>
                  <a href={versionDestination(version, '/')}>{version.version}</a>
                </TableCell>
                <TableCell>
                  {version.status === 'current' ? 'Current checkout' : 'Archived snapshot'}
                </TableCell>
                <TableCell>
                  {version.ref ? <code>{version.ref.slice(0, 7)}</code> : 'Working checkout'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {error && <p role="status">The version registry could not load. Refresh to retry.</p>}
      </GuideSection>
      <GuideSection title="Stable URLs and historical behavior">
        <p>
          Unversioned URLs follow the current release. Use <code>/v/0.2.0/components/select</code>{' '}
          for an explicit version, or <code>/v/0.1.0/components/select</code> for the original 0.1
          implementation. Refresh, internal navigation, and search stay in the chosen version. The
          current release tracks this checkout until it is frozen at a Git revision.
        </p>
        <p>
          Archives are historical references, not backported fixes. The 0.1 package remains
          <code> @plainui/react</code>; the current package is <code>@plain/ui</code>. Read the{' '}
          <Link to="/changelog">changelog and migration notes</Link> before upgrading. Blocks and
          templates introduced in 0.2 remain application-owned copy/paste source.
        </p>
      </GuideSection>
      <GuideSection title="Maintain an archive">
        <CodeBlock language="sh" code="npm run docs:versions\nnpm run build:docs" />
        <p>
          Maintainers register releases in <code>docs/versions.json</code>. Archived entries pin an
          immutable commit; each builds against its own source and dependencies, independently from
          the current library. Generated HTML, assets, route manifests, and source downloads are
          deployment output, not manually maintained copies of component pages. Follow{' '}
          <code>docs/versions/README.md</code> for the freeze and hosting workflow. Building an
          archive does not publish a package or deploy the site.
        </p>
      </GuideSection>
    </>
  );
}

function ChartsGuide() {
  return (
    <>
      <GuideSection title="Name the data and show an alternative">
        <CodeBlock code={examples.chart} />
        <p>
          AreaChart, BarChart, and LineChart accept records, a categorical <code>index</code>, typed
          series definitions, height, labels, and a valueFormatter. DonutChart uses nameKey and
          valueKey instead. Import these from <code>@plain/ui/charts</code> with
          <code> @plain/ui/charts.css</code>, not the root component collection.
        </p>
        <p>
          The wrappers use Chart for a named figure and an automatic data table. The default table
          is screen-reader-only; <code>dataTable="visible"</code> exposes it to everyone. Keep
          units, time range, series labels, and a short textual insight. Disable the table only when
          an equivalent accessible alternative is provided. A tooltip alone is not that alternative.
        </p>
      </GuideSection>
      <GuideSection title="Compose with the Recharts engine">
        <p>
          The component pages include live prop playgrounds with matching copyable code. Hide an
          axis with <code>xAxis={'{false}'}</code> or configure its native props, for example
          <code> yAxis={'{{ width: 48, tickFormatter: (value) => "$" + value }}'}</code>. Grid,
          legend, and tooltip also accept native Recharts props. Use <code>stacked</code> for a
          total and <code>curve="linear"</code> or <code>curve="step"</code> when the data calls for
          it. Series can supply <code>strokeDasharray</code> for an additional distinction. Tooltip
          foreground and background have paired theme tokens; overriding either requires checking
          their contrast together.
        </p>
        <CodeBlock code={examples.composedChart} />
        <p>
          Chart accepts one Recharts chart element. Supply <code>data</code> for the table and
          <code> config</code> for labels/colors; optional <code>columns</code> can choose accessors
          and formatting. ChartGrid, axes, tooltip, legend, and series wrappers connect theme roles
          and motion policy. A raw Recharts series does not gain the wrapper's motion controls
          automatically. Install Recharts directly when importing its engine in your application.
        </p>
        <p>
          Colors are optional. Series receive distinct chart tokens automatically, including
          composed ChartArea, ChartBar and ChartLine children. A selected vibe generates eight
          coordinated categorical colors for light and dark mode; neutral themes keep their curated
          palette. Override a series with <code>config[key].color</code>, a series color, or{' '}
          <code>chart-1</code> through <code>chart-8</code> theme tokens. Area fills use unique
          gradients by default; <code>gradient={'{false}'}</code> restores a flat fill, and an
          explicit fill always wins. ChartTooltipContent supports dot, line and dashed indicators
          and can be supplied through the native tooltip content prop.
        </p>
        <p>
          Retain Recharts' <code>accessibilityLayer</code>; the composed example enables it
          explicitly. Keyboard support varies by chart type and custom content. Test point
          navigation, announcements, and custom tooltips rather than assuming every chart has
          identical behavior. Distinguish series by labels, shape, dash, or a data table, not color
          alone.
        </p>
      </GuideSection>
      <GuideSection title="Size and state are part of the chart">
        <p>
          Height defaults to 300px and is stable during loading/empty states. Give responsive charts
          a shrinking parent with <code>min-width: 0</code> and a nonzero width. Recheck hidden
          tabs, panels, and resize. Use loading/empty labels appropriate to the view; network error
          states and retry belong to your application. Seed-derived chart colors still need
          comparison checks in light and dark mode.
        </p>
        <p>
          Chart animation follows the provider motion policy; <code>animate={'{false}'}</code>
          disables it for an individual view. Test zero, negative, missing, and single-point values.
          DonutChart plots only positive finite values while its table retains the supplied records;
          do not silently turn signed data into a part-to-whole story.
        </p>
      </GuideSection>
    </>
  );
}

function SchedulingGuide() {
  return (
    <>
      <GuideSection title="Pick the value model first">
        <p>
          Calendar and DateRangePicker use DayPicker for date selection. TimePicker, DateTimePicker,
          TimeRangePicker, and DateTimeRangePicker use native time/datetime-local controls with
          Temporal-backed validation. FullCalendar is the separate event scheduling engine. Do not
          recreate their navigation, date arithmetic, parsing, or range logic.
        </p>
        <CodeBlock code={examples.pickers} />
        <p>
          A DateRangePicker range is inclusive and uses local calendar dates. Do not serialize those
          dates with <code>toISOString()</code> to obtain a date-only value; conversion to UTC can
          shift the day. Its minNights/maxNights constrain day differences. Range form names default
          to <code>name[from]</code> and <code>name[to]</code>, with explicit fromName/toName
          overrides. Partial and cleared ranges are possible; clearing returns undefined.
        </p>
      </GuideSection>
      <GuideSection title="Native inputs remain wall-clock inputs">
        <p>
          Time values are <code>HH:mm</code> with optional seconds/milliseconds. Date-time values
          are <code>YYYY-MM-DDTHH:mm</code> with optional seconds/milliseconds, without an offset or
          Z. DateTimePicker's <code>timeZone</code> validates/formats the wall time in that zone; it
          does not convert the returned string to UTC. Use disambiguation to decide how repeated or
          nonexistent daylight-saving times are handled; reject makes that ambiguity a validation
          error.
        </p>
        <p>
          Browser and operating system determine the native editor, keyboard, and popup appearance.
          Locale affects formatting, but does not guarantee an identical localized native picker on
          every device. Native step is in seconds. allowOvernight on TimeRangePicker permits an end
          time before the start, but supplies no dates or duration. Store the intended zone and date
          alongside wall times; validate them again on the server.
        </p>
        <CodeBlock code={examples.temporal} title="Explicit wall time conversion" />
        <p>
          If your application imports temporal-polyfill directly, declare it as an application
          dependency. Catch rejected/invalid conversions and present a useful field error. Preserve
          recurring schedules as wall time plus zone when that is the product model, rather than
          assuming every date-time field is an instant.
        </p>
      </GuideSection>
      <GuideSection title="Opt into the event calendar and its stylesheet">
        <CodeBlock code={examples.fullCalendar} />
        <p>
          <code>@plain/ui/full-calendar</code> wraps the installed FullCalendar v7 React engine.
          Import <code>@plain/ui/full-calendar.css</code> for its skeleton and neutral classic
          styling, plus base styles. Defaults include day-grid, time-grid, list, and interaction
          plugins. Supplying plugins replaces that set; use the installed v7 plugin exports rather
          than copying older plugin-package examples.
        </p>
        <p>
          The forwarded ref is FullCalendarRef, exposing <code>getApi()</code>, not the outer div.
          Use <code>containerRef</code> for that DOM element. Native region props and rootProps
          apply to the container. Engine options may be passed directly or via <code>options</code>;
          direct props take precedence. Editing, eventDrop, selection, and eventClick still need
          application persistence and permission checks.
        </p>
      </GuideSection>
      <GuideSection title="Controlled views, exclusive ends, and time zones">
        <p>
          Use defaultView/initialDate for initial engine state, or view/onViewChange and
          date/onDateChange for controlled state. Update the controlled value when its callback
          fires. The default narrow-screen view is listWeek at 640px; automatic mobile switching
          applies only to an uncontrolled view. Set <code>mobileView={'{false}'}</code> to disable
          it.
        </p>
        <p>
          FullCalendar event and selection ends are exclusive, unlike the inclusive date picker
          range. Use calendar-day arithmetic for all-day range conversion, not a fixed 24-hour
          millisecond addition. The default event timeZone is local; strings without an offset are
          interpreted in the configured calendar zone. If the product needs a named zone, verify the
          installed engine's required time-zone implementation and input/output semantics.
        </p>
        <Checklist
          items={[
            'Offer a form-based editing path alongside event dragging, resizing, or selecting.',
            'Test locale, RTL, clearing, min/max, unavailable dates, and range endpoints.',
            'Test month/year boundaries, leap days, and daylight-saving cases relevant to the chosen zone.',
            'Check focus, keyboard use, event names, and the mobile agenda view with realistic content.',
          ]}
        />
      </GuideSection>
    </>
  );
}

function Performance() {
  return (
    <>
      <GuideSection title="Keep optional engines out of unrelated routes">
        <p>
          The package uses ESM modules and CSS side effects so bundlers can remove unused exports.
          Use root imports for ordinary controls and the optional motion/charts/full-calendar/blocks
          entries for the workflows that need them. Lazy-load reports, schedules, and secondary
          application views; measure the production bundle rather than assuming an import style
          alone proves tree-shaking.
        </p>
        <CodeBlock code={examples.lazyView} title="ReportsRoute.tsx" />
        <p>The Reports module is your application view, with a default component export.</p>
      </GuideSection>
      <GuideSection title="Static styles and generated roles">
        <p>
          Component CSS is precompiled. Providers update custom properties and data attributes;
          classes merge during render. createTheme computes color maps and optional CSS text, so
          generate shared brands outside frequently rendered components or memoize by stable inputs.
          Emit server CSS once rather than regenerating it for each control.
        </p>
      </GuideSection>
      <GuideSection title="Rendering and loading are different problems">
        <p>
          Keep table data and columns stable where useful. DataTable's convenience search, sorting,
          and pagination operate on the supplied client data; design explicit server operations when
          the dataset demands them. Virtual layouts reduce mounted content, not downloaded records.
          An accessible data table for a chart can also be large; choose aggregation, pagination, or
          an equivalent data alternative deliberately.
        </p>
        <p>
          Profile actual interactions, including hidden-tab reveal, panel resizing, filtering, and
          long localized content. Verify a packed consumer separately from this docs app when
          changing package exports or CSS. Compatibility pins, including the Material color engine,
          should be revisited with Node/SSR imports as well as browser checks.
        </p>
      </GuideSection>
    </>
  );
}

export default function GuidePage() {
  const { slug = 'introduction' } = useParams();
  const info = Object.hasOwn(guideInfo, slug) ? guideInfo[slug] : undefined;
  React.useEffect(() => {
    document.title = `${info?.title ?? 'Not found'} - P.UI`;
  }, [info]);
  if (!info)
    return (
      <div className="not-found">
        <h1>Page not found</h1>
        <Link to="/docs/introduction">Back to documentation</Link>
      </div>
    );
  const body: Record<string, React.ReactNode> = {
    introduction: <Introduction />,
    installation: <Installation />,
    versions: <VersionsGuide />,
    theming: <Theming />,
    tokens: <Tokens />,
    customization: <Customization />,
    accessibility: <AccessibilityGuide />,
    rtl: <RTL />,
    motion: <MotionGuide />,
    layouts: <LayoutsGuide />,
    virtualization: <VirtualizationGuide />,
    'blocks-templates': <BlocksTemplatesGuide />,
    charts: <ChartsGuide />,
    scheduling: <SchedulingGuide />,
    performance: <Performance />,
  };
  return (
    <article className="guide-page" key={slug}>
      <div className="doc-breadcrumb">
        <Link to="/docs/introduction">Documentation</Link>
        <span aria-hidden="true">/</span>
        <span>{slug === 'introduction' ? 'Introduction' : info.title}</span>
      </div>
      <h1>{info.title}</h1>
      <p className="page-lead">{info.description}</p>
      {body[slug]}
      <div className="guide-bottom-link">
        <Link className="text-link" to="/components">
          Explore the components
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
        <Badge variant="outline">v0.2.0</Badge>
      </div>
    </article>
  );
}
