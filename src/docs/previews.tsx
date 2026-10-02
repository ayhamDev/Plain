import * as React from 'react';
import { RotateCcw, Code2, SlidersHorizontal } from 'lucide-react';
import * as UI from '../ui';
import { CodeBlock } from './shared';
import { workspaceComponents as workspaceDefinitions } from './workspace-catalog';
import { chartSampleData, donutSampleData } from './chart-samples';
const WorkspacePreview = React.lazy(() => import('./examples/WorkspaceExample'));
const TablePreview = React.lazy(() => import('./examples/TableWorkspaceExample'));
const ChartPreview = React.lazy(() => import('./examples/ChartExample'));

type State = Record<string, string | number | boolean>;
type Control = {
  name: string;
  options?: readonly string[];
  min?: number;
  max?: number;
  when?: State;
};
export interface PropPreview {
  defaults: State;
  controls: Control[];
  render: (state: State) => React.ReactNode;
  code: (state: State) => string;
}
const bool = (name: string): Control => ({ name });
const options = (name: string, values: readonly string[]): Control => ({ name, options: values });
const number = (name: string, min: number, max: number): Control => ({ name, min, max });
const choice = <const T extends string>(state: State, key: string, values: readonly T[]): T =>
  values.find((value) => value === state[key]) ?? values[0];
const attr = (state: State) =>
  Object.entries(state)
    .map(([key, value]) =>
      typeof value === 'string' ? `${key}=${JSON.stringify(value)}` : `${key}={${value}}`,
    )
    .join(' ');
const native = (state: State) => ({
  disabled: !!state.disabled,
  readOnly: !!state.readOnly,
  required: !!state.required,
  'aria-invalid': !!state['aria-invalid'],
});
const field = (element: React.ReactElement<{ id?: string }>, label = 'Project name') => (
  <UI.Field label={label}>{element}</UI.Field>
);
const sizes = ['xs', 'sm', 'md', 'lg'] as const;
const buttonVariants = [
  'primary',
  'accent',
  'secondary',
  'outline',
  'ghost',
  'destructive',
  'link',
] as const;
const sides = ['top', 'right', 'bottom', 'left'] as const;
const alignments = ['start', 'center', 'end'] as const;
const departments = [
  { value: 'design', label: 'Design' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'operations', label: 'Operations' },
  { value: 'finance', label: 'Finance', disabled: true },
];
const optionSource = JSON.stringify(departments, null, 2);

function SelectPreview({ state }: { state: State }) {
  const id = React.useId();
  return (
    <div style={{ width: '100%', maxWidth: 320 }}>
      <UI.Label htmlFor={id}>Team</UI.Label>
      <UI.Select defaultValue="engineering" disabled={!!state.disabled}>
        <UI.SelectTrigger id={id}>
          <UI.SelectValue placeholder="Select department" />
        </UI.SelectTrigger>
        <UI.SelectContent
          position={choice(state, 'position', ['popper', 'item-aligned'])}
          side={choice(state, 'side', sides)}
          align={choice(state, 'align', alignments)}
          sideOffset={Number(state.sideOffset)}
        >
          <UI.SelectGroup>
            <UI.SelectLabel>Teams</UI.SelectLabel>
            {departments.map((item) => (
              <UI.SelectItem key={item.value} value={item.value} disabled={item.disabled}>
                {item.label}
              </UI.SelectItem>
            ))}
          </UI.SelectGroup>
        </UI.SelectContent>
      </UI.Select>
    </div>
  );
}

function CalendarPreview({ state }: { state: State }) {
  const [single, setSingle] = React.useState<Date>();
  const [multiple, setMultiple] = React.useState<Date[]>([]);
  const [range, setRange] = React.useState<UI.DateRange>();
  const props = {
    defaultMonth: new Date(2026, 9, 1),
    showOutsideDays: !!state.showOutsideDays,
    numberOfMonths: Number(state.numberOfMonths),
    weekStartsOn: Number(state.weekStartsOn) as 0 | 1,
  };
  if (state.mode === 'range')
    return <UI.Calendar {...props} mode="range" selected={range} onSelect={setRange} />;
  if (state.mode === 'multiple')
    return (
      <UI.Calendar
        {...props}
        mode="multiple"
        selected={multiple}
        onSelect={(value) => setMultiple(value ?? [])}
      />
    );
  return <UI.Calendar {...props} mode="single" selected={single} onSelect={setSingle} />;
}

const popupCode = (
  state: State,
  kind: 'Popover' | 'Tooltip',
) => `<${kind}${kind === 'Tooltip' ? ' delayDuration={0}' : ''}>
  <${kind}Trigger asChild><Button variant="outline">Project details</Button></${kind}Trigger>
  <${kind}Content ${attr(state)}><p>Updated just now.</p></${kind}Content>
</${kind}>`;
const popoverControls = [
  options('side', sides),
  options('align', alignments),
  number('sideOffset', 0, 24),
];

export const propPreviews: Record<string, PropPreview> = {
  button: {
    defaults: { variant: 'primary', size: 'md', loading: false, disabled: false },
    controls: [
      options('variant', buttonVariants),
      options('size', sizes),
      bool('loading'),
      bool('disabled'),
    ],
    render: (s) => (
      <UI.Button
        variant={choice(s, 'variant', buttonVariants)}
        size={choice(s, 'size', sizes)}
        loading={!!s.loading}
        disabled={!!s.disabled}
      >
        Save project
      </UI.Button>
    ),
    code: (s) => `<Button ${attr(s)}>Save project</Button>`,
  },
  select: {
    defaults: {
      position: 'popper',
      side: 'bottom',
      align: 'start',
      sideOffset: 6,
      disabled: false,
    },
    controls: [
      options('position', ['popper', 'item-aligned']),
      { ...options('side', sides), when: { position: 'popper' } },
      { ...options('align', alignments), when: { position: 'popper' } },
      { ...number('sideOffset', 0, 24), when: { position: 'popper' } },
      bool('disabled'),
    ],
    render: (s) => <SelectPreview state={s} />,
    code: (s) => `const id = React.useId();

<Label htmlFor={id}>Team</Label>
<Select defaultValue="engineering" disabled={${s.disabled}}>
  <SelectTrigger id={id}><SelectValue placeholder="Select department" /></SelectTrigger>
  <SelectContent ${attr({ position: s.position, side: s.side, align: s.align, sideOffset: s.sideOffset })}>
    <SelectGroup><SelectLabel>Teams</SelectLabel>
      <SelectItem value="design">Design</SelectItem>
      <SelectItem value="engineering">Engineering</SelectItem>
      <SelectItem value="operations">Operations</SelectItem>
      <SelectItem value="finance" disabled>Finance</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>`,
  },
  input: {
    defaults: {
      type: 'text',
      variant: 'outlined',
      disabled: false,
      readOnly: false,
      required: false,
      'aria-invalid': false,
    },
    controls: [
      options('type', ['text', 'email', 'url', 'tel', 'search']),
      options('variant', ['outlined', 'filled', 'ghost']),
      bool('disabled'),
      bool('readOnly'),
      bool('required'),
      bool('aria-invalid'),
    ],
    render: (s) =>
      field(
        <UI.Input
          variant={choice(s, 'variant', ['outlined', 'filled', 'ghost'])}
          type={String(s.type)}
          {...native(s)}
          placeholder="Project Atlas"
        />,
      ),
    code: (s) =>
      `<Field label="Project name"><Input ${attr(s)} placeholder="Project Atlas" /></Field>`,
  },
  textarea: {
    defaults: {
      variant: 'outlined',
      rows: 4,
      disabled: false,
      readOnly: false,
      'aria-invalid': false,
    },
    controls: [
      options('variant', ['outlined', 'filled', 'ghost']),
      number('rows', 2, 8),
      bool('disabled'),
      bool('readOnly'),
      bool('aria-invalid'),
    ],
    render: (s) =>
      field(
        <UI.Textarea
          variant={choice(s, 'variant', ['outlined', 'filled', 'ghost'])}
          {...native(s)}
          rows={Number(s.rows)}
          placeholder="A few notes for your team"
        />,
        'Description',
      ),
    code: (s) =>
      `<Field label="Description"><Textarea ${attr(s)} placeholder="A few notes for your team" /></Field>`,
  },
  checkbox: {
    defaults: { checked: 'unchecked', disabled: false },
    controls: [options('checked', ['unchecked', 'checked', 'indeterminate']), bool('disabled')],
    render: (s) => (
      <UI.Label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <UI.Checkbox
          defaultChecked={s.checked === 'indeterminate' ? 'indeterminate' : s.checked === 'checked'}
          disabled={!!s.disabled}
          key={String(s.checked)}
        />
        Include archived projects
      </UI.Label>
    ),
    code: (s) =>
      `<Label><Checkbox defaultChecked={${s.checked === 'indeterminate' ? '"indeterminate"' : s.checked === 'checked'}} disabled={${s.disabled}} /> Include archived projects</Label>`,
  },
  switch: {
    defaults: { disabled: false, required: false },
    controls: [bool('disabled'), bool('required')],
    render: (s) => (
      <UI.Label style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        Email notifications
        <UI.Switch defaultChecked disabled={!!s.disabled} required={!!s.required} />
      </UI.Label>
    ),
    code: (s) => `<Label>Email notifications <Switch defaultChecked ${attr(s)} /></Label>`,
  },
  slider: {
    defaults: { orientation: 'horizontal', step: 5, disabled: false, range: false },
    controls: [
      options('orientation', ['horizontal', 'vertical']),
      number('step', 1, 25),
      bool('disabled'),
      bool('range'),
    ],
    render: (s) => (
      <UI.Slider
        aria-label="Budget"
        orientation={choice(s, 'orientation', ['horizontal', 'vertical'])}
        step={Number(s.step)}
        disabled={!!s.disabled}
        defaultValue={s.range ? [25, 75] : [50]}
        key={String(s.range)}
        thumbLabels={s.range ? ['Minimum budget', 'Maximum budget'] : ['Budget']}
        style={s.orientation === 'vertical' ? { height: 160 } : { width: '100%', maxWidth: 320 }}
      />
    ),
    code: (s) =>
      `<Slider orientation="${s.orientation}" step={${s.step}} disabled={${s.disabled}} defaultValue={${s.range ? '[25, 75]' : '[50]'}} thumbLabels={${s.range ? '["Minimum budget", "Maximum budget"]' : '["Budget"]'}} />`,
  },
  combobox: {
    defaults: { disabled: false, side: 'bottom', align: 'start' },
    controls: [bool('disabled'), options('side', sides), options('align', alignments)],
    render: (s) => (
      <UI.Combobox
        options={departments}
        aria-label="Department"
        disabled={!!s.disabled}
        defaultValue="engineering"
        contentProps={{ side: choice(s, 'side', sides), align: choice(s, 'align', alignments) }}
        style={{ maxWidth: 320 }}
      />
    ),
    code: (s) =>
      `const options = ${optionSource};\n\n<Combobox options={options} aria-label="Department" defaultValue="engineering" disabled={${s.disabled}} contentProps={{ side: "${s.side}", align: "${s.align}" }} />`,
  },
  badge: {
    defaults: { variant: 'accent' },
    controls: [options('variant', ['default', 'accent', 'outline', 'solid', 'destructive'])],
    render: (s) => (
      <UI.Badge
        variant={choice(s, 'variant', ['default', 'accent', 'outline', 'solid', 'destructive'])}
      >
        In progress
      </UI.Badge>
    ),
    code: (s) => `<Badge ${attr(s)}>In progress</Badge>`,
  },
  alert: {
    defaults: { variant: 'info' },
    controls: [options('variant', ['info', 'success', 'warning', 'destructive'])],
    render: (s) => (
      <UI.Alert variant={choice(s, 'variant', ['info', 'success', 'warning', 'destructive'])}>
        <UI.AlertTitle>Project updated</UI.AlertTitle>
        <UI.AlertDescription>Your team has the latest changes.</UI.AlertDescription>
      </UI.Alert>
    ),
    code: (s) =>
      `<Alert ${attr(s)}><AlertTitle>Project updated</AlertTitle><AlertDescription>Your team has the latest changes.</AlertDescription></Alert>`,
  },
  avatar: {
    defaults: { size: 'md' },
    controls: [options('size', ['sm', 'md', 'lg'])],
    render: (s) => (
      <UI.Avatar size={choice(s, 'size', ['sm', 'md', 'lg'])} aria-label="Alex Morgan">
        <UI.AvatarFallback>AM</UI.AvatarFallback>
      </UI.Avatar>
    ),
    code: (s) =>
      `<Avatar ${attr(s)} aria-label="Alex Morgan"><AvatarFallback>AM</AvatarFallback></Avatar>`,
  },
  progress: {
    defaults: { value: 64, indeterminate: false },
    controls: [number('value', 0, 100), bool('indeterminate')],
    render: (s) => (
      <UI.Progress
        value={s.indeterminate ? null : Number(s.value)}
        aria-label="Upload progress"
        style={{ maxWidth: 320 }}
      />
    ),
    code: (s) =>
      `<Progress value={${s.indeterminate ? 'null' : s.value}} aria-label="Upload progress" />`,
  },
  separator: {
    defaults: { orientation: 'horizontal', decorative: true },
    controls: [options('orientation', ['horizontal', 'vertical']), bool('decorative')],
    render: (s) => (
      <div
        style={{
          width: '100%',
          height: 96,
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          flexDirection: s.orientation === 'horizontal' ? 'column' : 'row',
        }}
      >
        <span>Projects</span>
        <UI.Separator
          orientation={choice(s, 'orientation', ['horizontal', 'vertical'])}
          decorative={!!s.decorative}
        />
        <span>Archive</span>
      </div>
    ),
    code: (s) => `<Separator ${attr(s)} />`,
  },
  dialog: {
    defaults: { showClose: true, modal: true },
    controls: [bool('showClose'), bool('modal')],
    render: (s) => (
      <UI.Dialog modal={!!s.modal}>
        <UI.DialogTrigger asChild>
          <UI.Button variant="outline">Open preview dialog</UI.Button>
        </UI.DialogTrigger>
        <UI.DialogContent showClose={!!s.showClose}>
          <UI.DialogHeader>
            <UI.DialogTitle>Project settings</UI.DialogTitle>
            <UI.DialogDescription>Update the details shared with your team.</UI.DialogDescription>
          </UI.DialogHeader>
          <UI.Field label="Project name">
            <UI.Input defaultValue="Project Atlas" />
          </UI.Field>
          <UI.DialogFooter>
            <UI.DialogClose asChild>
              <UI.Button>Done</UI.Button>
            </UI.DialogClose>
          </UI.DialogFooter>
        </UI.DialogContent>
      </UI.Dialog>
    ),
    code: (
      s,
    ) => `<Dialog modal={${s.modal}}><DialogTrigger asChild><Button variant="outline">Open preview dialog</Button></DialogTrigger>
  <DialogContent showClose={${s.showClose}}><DialogHeader><DialogTitle>Project settings</DialogTitle><DialogDescription>Update the details shared with your team.</DialogDescription></DialogHeader>
    <Field label="Project name"><Input defaultValue="Project Atlas" /></Field>
    <DialogFooter><DialogClose asChild><Button>Done</Button></DialogClose></DialogFooter>
  </DialogContent>
</Dialog>`,
  },
  popover: {
    defaults: { side: 'bottom', align: 'center', sideOffset: 6 },
    controls: popoverControls,
    render: (s) => (
      <UI.Popover>
        <UI.PopoverTrigger asChild>
          <UI.Button variant="outline">Project details</UI.Button>
        </UI.PopoverTrigger>
        <UI.PopoverContent
          side={choice(s, 'side', sides)}
          align={choice(s, 'align', alignments)}
          sideOffset={Number(s.sideOffset)}
        >
          <p>Updated just now.</p>
        </UI.PopoverContent>
      </UI.Popover>
    ),
    code: (s) => popupCode(s, 'Popover'),
  },
  tooltip: {
    defaults: { side: 'top', align: 'center', sideOffset: 6 },
    controls: popoverControls,
    render: (s) => (
      <UI.Tooltip delayDuration={0}>
        <UI.TooltipTrigger asChild>
          <UI.Button variant="outline">Project details</UI.Button>
        </UI.TooltipTrigger>
        <UI.TooltipContent
          side={choice(s, 'side', sides)}
          align={choice(s, 'align', alignments)}
          sideOffset={Number(s.sideOffset)}
        >
          Updated just now.
        </UI.TooltipContent>
      </UI.Tooltip>
    ),
    code: (s) => popupCode(s, 'Tooltip'),
  },
  calendar: {
    defaults: { mode: 'single', numberOfMonths: 1, weekStartsOn: 0, showOutsideDays: true },
    controls: [
      options('mode', ['single', 'multiple', 'range']),
      number('numberOfMonths', 1, 2),
      options('weekStartsOn', ['0', '1']),
      bool('showOutsideDays'),
    ],
    render: (s) => <CalendarPreview state={s} />,
    code: (s) =>
      `const [selected, setSelected] = React.useState<${s.mode === 'range' ? 'DateRange' : s.mode === 'multiple' ? 'Date[]' : 'Date'}>();\n\n<Calendar mode="${s.mode}" selected={selected} onSelect={setSelected} numberOfMonths={${s.numberOfMonths}} weekStartsOn={${s.weekStartsOn}} showOutsideDays={${s.showOutsideDays}} defaultMonth={new Date(2026, 9, 1)} />`,
  },
  'date-picker': {
    defaults: { clearable: true, disabled: false },
    controls: [bool('clearable'), bool('disabled')],
    render: (s) =>
      field(
        <UI.DatePicker
          clearable={!!s.clearable}
          disabled={!!s.disabled}
          defaultValue={new Date(2026, 9, 14)}
        />,
        'Due date',
      ),
    code: (s) =>
      `<Field label="Due date"><DatePicker ${attr(s)} defaultValue={new Date(2026, 9, 14)} /></Field>`,
  },
  'number-input': {
    defaults: { step: 1, showControls: true, disabled: false, readOnly: false },
    controls: [number('step', 1, 10), bool('showControls'), bool('disabled'), bool('readOnly')],
    render: (s) =>
      field(
        <UI.NumberInput
          {...native(s)}
          step={Number(s.step)}
          showControls={!!s.showControls}
          min={0}
          max={100}
          defaultValue={5}
        />,
        'Seats',
      ),
    code: (s) =>
      `<Field label="Seats"><NumberInput ${attr(s)} min={0} max={100} defaultValue={5} /></Field>`,
  },
  rating: {
    defaults: { max: 5, readOnly: false, disabled: false, allowClear: true },
    controls: [number('max', 3, 10), bool('readOnly'), bool('disabled'), bool('allowClear')],
    render: (s) => (
      <UI.Rating
        aria-label="Project rating"
        max={Number(s.max)}
        readOnly={!!s.readOnly}
        disabled={!!s.disabled}
        allowClear={!!s.allowClear}
        defaultValue={3}
      />
    ),
    code: (s) => `<Rating ${attr(s)} aria-label="Project rating" defaultValue={3} />`,
  },
  tabs: {
    defaults: { variant: 'segmented', orientation: 'horizontal', activationMode: 'automatic' },
    controls: [
      options('variant', ['segmented', 'underline']),
      options('orientation', ['horizontal', 'vertical']),
      options('activationMode', ['automatic', 'manual']),
    ],
    render: (s) => (
      <UI.Tabs
        defaultValue="overview"
        orientation={choice(s, 'orientation', ['horizontal', 'vertical'])}
        activationMode={choice(s, 'activationMode', ['automatic', 'manual'])}
      >
        <UI.TabsList
          aria-label="Project views"
          variant={choice(s, 'variant', ['segmented', 'underline'])}
        >
          <UI.TabsTrigger value="overview">Overview</UI.TabsTrigger>
          <UI.TabsTrigger value="activity">Activity</UI.TabsTrigger>
          <UI.TabsTrigger value="locked" disabled>
            Archived
          </UI.TabsTrigger>
        </UI.TabsList>
        <UI.TabsContent value="overview">Your project overview.</UI.TabsContent>
        <UI.TabsContent value="activity">No new activity.</UI.TabsContent>
      </UI.Tabs>
    ),
    code: (s) =>
      `<Tabs defaultValue="overview" orientation="${s.orientation}" activationMode="${s.activationMode}"><TabsList aria-label="Project views" variant="${s.variant}"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger><TabsTrigger value="locked" disabled>Archived</TabsTrigger></TabsList><TabsContent value="overview">Your project overview.</TabsContent><TabsContent value="activity">No new activity.</TabsContent></Tabs>`,
  },
  accordion: {
    defaults: { type: 'single', disabled: false },
    controls: [options('type', ['single', 'multiple']), bool('disabled')],
    render: (s) => {
      const items = ['Project details', 'Permissions'].map((label, index) => (
        <UI.AccordionItem key={label} value={String(index)}>
          <UI.AccordionTrigger>{label}</UI.AccordionTrigger>
          <UI.AccordionContent>Your team can edit this project.</UI.AccordionContent>
        </UI.AccordionItem>
      ));
      return s.type === 'multiple' ? (
        <UI.Accordion type="multiple" disabled={!!s.disabled} style={{ width: '100%' }}>
          {items}
        </UI.Accordion>
      ) : (
        <UI.Accordion type="single" collapsible disabled={!!s.disabled} style={{ width: '100%' }}>
          {items}
        </UI.Accordion>
      );
    },
    code: (s) =>
      `<Accordion type="${s.type}"${s.type === 'single' ? ' collapsible' : ''} disabled={${s.disabled}}><AccordionItem value="details"><AccordionTrigger>Project details</AccordionTrigger><AccordionContent>Your team can edit this project.</AccordionContent></AccordionItem><AccordionItem value="permissions"><AccordionTrigger>Permissions</AccordionTrigger><AccordionContent>Your team can edit this project.</AccordionContent></AccordionItem></Accordion>`,
  },
  'radio-group': {
    defaults: { orientation: 'horizontal', disabled: false },
    controls: [options('orientation', ['horizontal', 'vertical']), bool('disabled')],
    render: (s) => (
      <UI.RadioGroup
        aria-label="Billing"
        defaultValue="monthly"
        orientation={choice(s, 'orientation', ['horizontal', 'vertical'])}
        disabled={!!s.disabled}
        style={{
          display: 'flex',
          gap: 16,
          flexDirection: s.orientation === 'vertical' ? 'column' : 'row',
        }}
      >
        <UI.Label>
          <UI.RadioGroupItem value="monthly" /> Monthly
        </UI.Label>
        <UI.Label>
          <UI.RadioGroupItem value="annual" /> Annual
        </UI.Label>
      </UI.RadioGroup>
    ),
    code: (s) =>
      `<RadioGroup aria-label="Billing" defaultValue="monthly" ${attr(s)}><Label><RadioGroupItem value="monthly" /> Monthly</Label><Label><RadioGroupItem value="annual" /> Annual</Label></RadioGroup>`,
  },
  'scroll-area': {
    defaults: {
      type: 'hover',
      height: 160,
      scrollbarVisibility: 'hover',
      elastic: false,
      refreshable: false,
    },
    controls: [
      options('type', ['hover', 'always', 'auto', 'scroll']),
      options('scrollbarVisibility', ['hover', 'always', 'hidden']),
      bool('elastic'),
      bool('refreshable'),
      number('height', 96, 240),
    ],
    render: (s) => (
      <UI.ScrollArea
        elastic={!!s.elastic}
        scrollbarVisibility={choice(s, 'scrollbarVisibility', ['hover', 'always', 'hidden'])}
        onRefresh={
          s.refreshable ? () => new Promise<void>((resolve) => setTimeout(resolve, 400)) : undefined
        }
        type={choice(s, 'type', ['hover', 'always', 'auto', 'scroll'])}
        style={{ height: Number(s.height), width: '100%' }}
        aria-label="Project list"
      >
        {Array.from({ length: 20 }, (_, index) => (
          <p style={{ padding: 8 }} key={index}>
            Project {index + 1}
          </p>
        ))}
      </UI.ScrollArea>
    ),
    code: (s) =>
      `<ScrollArea scrollbarVisibility="${s.scrollbarVisibility}" elastic={${s.elastic}} ${s.refreshable ? 'onRefresh={async () => {}}' : ''} type="${s.type}" style={{ height: ${s.height} }} aria-label="Project list">{Array.from({ length: 20 }, (_, index) => <p key={index}>Project {index + 1}</p>)}</ScrollArea>`,
  },
  'dropdown-menu': {
    defaults: { side: 'bottom', align: 'start', sideOffset: 6 },
    controls: popoverControls,
    render: (s) => (
      <UI.DropdownMenu>
        <UI.DropdownMenuTrigger asChild>
          <UI.Button variant="outline">Project actions</UI.Button>
        </UI.DropdownMenuTrigger>
        <UI.DropdownMenuContent
          side={choice(s, 'side', sides)}
          align={choice(s, 'align', alignments)}
          sideOffset={Number(s.sideOffset)}
        >
          <UI.DropdownMenuItem>Edit project</UI.DropdownMenuItem>
          <UI.DropdownMenuSub>
            <UI.DropdownMenuSubTrigger>Move to</UI.DropdownMenuSubTrigger>
            <UI.DropdownMenuSubContent>
              <UI.DropdownMenuItem>Workspace</UI.DropdownMenuItem>
              <UI.DropdownMenuItem>Archive</UI.DropdownMenuItem>
            </UI.DropdownMenuSubContent>
          </UI.DropdownMenuSub>
        </UI.DropdownMenuContent>
      </UI.DropdownMenu>
    ),
    code: (s) =>
      `<DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline">Project actions</Button></DropdownMenuTrigger><DropdownMenuContent ${attr(s)}><DropdownMenuItem>Edit project</DropdownMenuItem><DropdownMenuSub><DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger><DropdownMenuSubContent><DropdownMenuItem>Workspace</DropdownMenuItem><DropdownMenuItem>Archive</DropdownMenuItem></DropdownMenuSubContent></DropdownMenuSub></DropdownMenuContent></DropdownMenu>`,
  },
  'password-input': {
    defaults: { disabled: false, readOnly: false },
    controls: [bool('disabled'), bool('readOnly')],
    render: (s) =>
      field(<UI.PasswordInput {...native(s)} defaultValue="atlas-project" />, 'Password'),
    code: (s) =>
      `<Field label="Password"><PasswordInput ${attr(s)} defaultValue="atlas-project" /></Field>`,
  },
  'search-input': {
    defaults: { disabled: false, readOnly: false },
    controls: [bool('disabled'), bool('readOnly')],
    render: (s) => field(<UI.SearchInput {...native(s)} placeholder="Search projects" />, 'Search'),
    code: (s) =>
      `<Field label="Search"><SearchInput ${attr(s)} placeholder="Search projects" /></Field>`,
  },
  'tags-input': {
    defaults: { disabled: false, readOnly: false },
    controls: [bool('disabled'), bool('readOnly')],
    render: (s) =>
      field(<UI.TagsInput {...native(s)} defaultValue={['Design', 'Research']} />, 'Tags'),
    code: (s) =>
      `<Field label="Tags"><TagsInput ${attr(s)} defaultValue={["Design", "Research"]} /></Field>`,
  },
  'multi-select': {
    defaults: { disabled: false, maxSelected: 3 },
    controls: [bool('disabled'), number('maxSelected', 1, 3)],
    render: (s) =>
      field(
        <UI.MultiSelect
          options={departments}
          disabled={!!s.disabled}
          maxSelected={Number(s.maxSelected)}
        />,
        'Departments',
      ),
    code: (s) =>
      `const options = ${optionSource};\n\n<Field label="Departments"><MultiSelect options={options} ${attr(s)} /></Field>`,
  },
  'pin-input': {
    defaults: { length: 6, numeric: true, masked: false, disabled: false },
    controls: [number('length', 4, 8), bool('numeric'), bool('masked'), bool('disabled')],
    render: (s) =>
      field(
        <UI.PinInput
          length={Number(s.length)}
          numeric={!!s.numeric}
          masked={!!s.masked}
          disabled={!!s.disabled}
        />,
        'Verification code',
      ),
    code: (s) => `<Field label="Verification code"><PinInput ${attr(s)} /></Field>`,
  },
  'color-picker': {
    defaults: { disabled: false, readOnly: false },
    controls: [bool('disabled'), bool('readOnly')],
    render: (s) => field(<UI.ColorPicker {...native(s)} defaultValue="#2563eb" />, 'Project color'),
    code: (s) =>
      `<Field label="Project color"><ColorPicker ${attr(s)} defaultValue="#2563eb" /></Field>`,
  },
  toggle: {
    defaults: { variant: 'default', disabled: false },
    controls: [options('variant', ['default', 'outline']), bool('disabled')],
    render: (s) => (
      <UI.Toggle
        variant={choice(s, 'variant', ['default', 'outline'])}
        disabled={!!s.disabled}
        aria-label="Pin project"
      >
        Pin project
      </UI.Toggle>
    ),
    code: (s) => `<Toggle ${attr(s)} aria-label="Pin project">Pin project</Toggle>`,
  },
  'toggle-group': {
    defaults: { type: 'single', disabled: false },
    controls: [options('type', ['single', 'multiple']), bool('disabled')],
    render: (s) => (
      <UI.ToggleGroup
        type={choice(s, 'type', ['single', 'multiple'])}
        disabled={!!s.disabled}
        aria-label="Text formatting"
      >
        <UI.ToggleGroupItem value="bold" aria-label="Bold">
          B
        </UI.ToggleGroupItem>
        <UI.ToggleGroupItem value="italic" aria-label="Italic">
          I
        </UI.ToggleGroupItem>
      </UI.ToggleGroup>
    ),
    code: (s) =>
      `<ToggleGroup ${attr(s)} aria-label="Text formatting"><ToggleGroupItem value="bold" aria-label="Bold">B</ToggleGroupItem><ToggleGroupItem value="italic" aria-label="Italic">I</ToggleGroupItem></ToggleGroup>`,
  },
  skeleton: {
    defaults: { height: 16, radius: 4 },
    controls: [number('height', 8, 64), number('radius', 0, 16)],
    render: (s) => (
      <UI.Skeleton
        style={{ height: Number(s.height), borderRadius: Number(s.radius), maxWidth: 320 }}
      />
    ),
    code: (s) =>
      `<Skeleton style={{ height: ${s.height}, borderRadius: ${s.radius}, maxWidth: 320 }} />`,
  },
  collapsible: {
    defaults: { disabled: false },
    controls: [bool('disabled')],
    render: (s) => (
      <UI.Collapsible disabled={!!s.disabled}>
        <UI.CollapsibleTrigger asChild>
          <UI.Button variant="outline">Project details</UI.Button>
        </UI.CollapsibleTrigger>
        <UI.CollapsibleContent>
          <p>Created by Alex Morgan.</p>
        </UI.CollapsibleContent>
      </UI.Collapsible>
    ),
    code: (s) =>
      `<Collapsible ${attr(s)}><CollapsibleTrigger asChild><Button variant="outline">Project details</Button></CollapsibleTrigger><CollapsibleContent><p>Created by Alex Morgan.</p></CollapsibleContent></Collapsible>`,
  },
  grid: {
    defaults: { columns: 3, gap: 2 },
    controls: [number('columns', 1, 4), number('gap', 0, 6)],
    render: (s) => (
      <UI.Grid columns={Number(s.columns)} gap={Number(s.gap)} style={{ width: '100%' }}>
        {['Research', 'Design', 'Build', 'Review'].map((name) => (
          <UI.Box padding={2} key={name} style={{ background: 'var(--ui-muted)' }}>
            {name}
          </UI.Box>
        ))}
      </UI.Grid>
    ),
    code: (s) =>
      `<Grid ${attr(s)}>{['Research', 'Design', 'Build', 'Review'].map(name => <Box key={name} padding={2} style={{ background: 'var(--ui-muted)' }}>{name}</Box>)}</Grid>`,
  },
  flex: {
    defaults: { direction: 'row', gap: 2, justify: 'start', wrap: true },
    controls: [
      options('direction', ['row', 'column', 'row-reverse', 'column-reverse']),
      number('gap', 0, 6),
      options('justify', ['start', 'center', 'end', 'between', 'around', 'evenly']),
      bool('wrap'),
    ],
    render: (s) => (
      <UI.Flex
        direction={choice(s, 'direction', ['row', 'column', 'row-reverse', 'column-reverse'])}
        justify={choice(s, 'justify', ['start', 'center', 'end', 'between', 'around', 'evenly'])}
        gap={Number(s.gap)}
        wrap={!!s.wrap}
        style={{ width: '100%' }}
      >
        {['Research', 'Design', 'Build'].map((name) => (
          <UI.Box padding={2} key={name} style={{ background: 'var(--ui-muted)' }}>
            {name}
          </UI.Box>
        ))}
      </UI.Flex>
    ),
    code: (s) =>
      `<Flex ${attr(s)}>{['Research', 'Design', 'Build'].map(name => <Box key={name} padding={2} style={{ background: 'var(--ui-muted)' }}>{name}</Box>)}</Flex>`,
  },
  masonry: {
    defaults: { columns: 3, gap: 2 },
    controls: [number('columns', 1, 4), number('gap', 0, 6)],
    render: (s) => (
      <UI.Masonry columns={Number(s.columns)} gap={Number(s.gap)} style={{ width: '100%' }}>
        {['Research', 'Design', 'Build', 'Review', 'Ship'].map((name, index) => (
          <UI.Box
            padding={2}
            key={name}
            style={{ background: 'var(--ui-muted)', minHeight: 64 + (index % 3) * 24 }}
          >
            {name}
          </UI.Box>
        ))}
      </UI.Masonry>
    ),
    code: (s) =>
      `<Masonry ${attr(s)}>{['Research', 'Design', 'Build', 'Review', 'Ship'].map((name, index) => <Box key={name} padding={2} style={{ background: 'var(--ui-muted)', minHeight: 64 + index % 3 * 24 }}>{name}</Box>)}</Masonry>`,
  },
};

for (const slug of ['stack', 'inline'] as const) {
  const Component = slug === 'stack' ? UI.Stack : UI.Inline;
  const name = slug === 'stack' ? 'Stack' : 'Inline';
  propPreviews[slug] = {
    defaults: { gap: 2, align: 'start' },
    controls: [number('gap', 0, 6), options('align', ['start', 'center', 'end', 'stretch'])],
    render: (s) => (
      <Component
        gap={Number(s.gap)}
        align={choice(s, 'align', ['start', 'center', 'end', 'stretch'])}
        style={{ width: '100%' }}
      >
        {['Research', 'Design', 'Build'].map((label) => (
          <UI.Badge key={label}>{label}</UI.Badge>
        ))}
      </Component>
    ),
    code: (s) =>
      `<${name} ${attr(s)}>{['Research', 'Design', 'Build'].map(label => <Badge key={label}>{label}</Badge>)}</${name}>`,
  };
}
for (const slug of ['virtual-list', 'virtual-grid', 'virtual-masonry'] as const) {
  const name = (
    {
      'virtual-list': 'VirtualList',
      'virtual-grid': 'VirtualGrid',
      'virtual-masonry': 'VirtualMasonry',
    } as const
  )[slug];
  const items = Array.from({ length: 1000 }, (_, index) => ({
    id: String(index),
    name: `Project ${index + 1}`,
  }));
  propPreviews[slug] = {
    defaults: { height: 200, overscan: 4, gap: 1 },
    controls: [number('height', 120, 320), number('overscan', 1, 12), number('gap', 0, 4)],
    render: (s) => {
      const props = {
        items,
        getItemKey: (item: (typeof items)[number]) => item.id,
        height: Number(s.height),
        overscan: Number(s.overscan),
        gap: Number(s.gap),
        style: { width: '100%' },
        renderItem: (item: (typeof items)[number]) => (
          <UI.Button variant="secondary" style={{ width: '100%' }}>
            {item.name}
          </UI.Button>
        ),
      };
      return slug === 'virtual-grid' ? (
        <UI.VirtualGrid {...props} columns={2} rowHeight={40} />
      ) : slug === 'virtual-masonry' ? (
        <UI.VirtualMasonry {...props} lanes={2} estimateSize={40} />
      ) : (
        <UI.VirtualList {...props} estimateSize={40} />
      );
    },
    code: (s) =>
      `const items = Array.from({ length: 1000 }, (_, index) => ({ id: String(index), name: 'Project ' + (index + 1) }));\n\n<${name} items={items} getItemKey={item => item.id} ${attr(s)} ${slug === 'virtual-grid' ? 'columns={2} rowHeight={40}' : slug === 'virtual-masonry' ? 'lanes={2} estimateSize={40}' : 'estimateSize={40}'} renderItem={item => <Button variant="secondary" style={{ width: '100%' }}>{item.name}</Button>} />`,
  };
}

for (const slug of ['sheet', 'drawer'] as const) {
  const Root = slug === 'sheet' ? UI.Sheet : UI.Drawer;
  const Content = slug === 'sheet' ? UI.SheetContent : UI.DrawerContent;
  const Trigger = slug === 'sheet' ? UI.SheetTrigger : UI.DrawerTrigger;
  const Title = slug === 'sheet' ? UI.SheetTitle : UI.DrawerTitle;
  const Description = slug === 'sheet' ? UI.SheetDescription : UI.DrawerDescription;
  const Close = slug === 'sheet' ? UI.SheetClose : UI.DrawerClose;
  const name = slug === 'sheet' ? 'Sheet' : 'Drawer';
  propPreviews[slug] = {
    defaults: {
      side: slug === 'sheet' ? 'end' : 'bottom',
      dismissible: true,
      variant: 'attached',
      size: 'md',
      gap: 12,
    },
    controls: [
      options('side', ['start', 'end', 'top', 'bottom']),
      bool('dismissible'),
      options('variant', ['attached', 'detached', 'floating']),
      options('size', ['sm', 'md', 'lg', 'xl', 'full']),
      number('gap', 0, 24),
    ],
    render: (s) => (
      <Root
        variant={choice(s, 'variant', ['attached', 'detached', 'floating'])}
        size={choice(s, 'size', ['sm', 'md', 'lg', 'xl', 'full'])}
        gap={Number(s.gap)}
        side={choice(s, 'side', ['start', 'end', 'top', 'bottom'])}
        dismissible={!!s.dismissible}
      >
        <Trigger asChild>
          <UI.Button variant="outline">Open preview {slug}</UI.Button>
        </Trigger>
        <Content>
          <Title>Project settings</Title>
          <Description>Update the project details.</Description>
          <UI.Field label="Project name">
            <UI.Input defaultValue="Project Atlas" />
          </UI.Field>
          <Close asChild>
            <UI.Button style={{ marginTop: 16 }}>Done</UI.Button>
          </Close>
        </Content>
      </Root>
    ),
    code: (s) =>
      `<${name} ${attr(s)}><${name}Trigger asChild><Button variant="outline">Open preview ${slug}</Button></${name}Trigger><${name}Content><${name}Title>Project settings</${name}Title><${name}Description>Update the project details.</${name}Description><Field label="Project name"><Input defaultValue="Project Atlas" /></Field><${name}Close asChild><Button>Done</Button></${name}Close></${name}Content></${name}>`,
  };
}

for (const slug of ['area-chart', 'bar-chart', 'line-chart', 'donut-chart'] as const) {
  const donut = slug === 'donut-chart';
  const name = (
    {
      'area-chart': 'AreaChart',
      'bar-chart': 'BarChart',
      'line-chart': 'LineChart',
      'donut-chart': 'DonutChart',
    } as const
  )[slug];
  propPreviews[slug] = {
    defaults: {
      legend: true,
      tooltip: true,
      loading: false,
      empty: false,
      dataTable: 'sr-only',
      ...(donut
        ? { innerRadius: 64 }
        : {
            grid: true,
            xAxis: true,
            yAxis: true,
            stacked: false,
            ...(slug === 'bar-chart' ? {} : { curve: 'monotone' }),
          }),
    },
    controls: [
      ...(donut
        ? [number('innerRadius', 0, 85)]
        : [
            bool('grid'),
            bool('xAxis'),
            bool('yAxis'),
            bool('stacked'),
            ...(slug === 'bar-chart' ? [] : [options('curve', ['monotone', 'linear', 'step'])]),
          ]),
      bool('legend'),
      bool('tooltip'),
      options('dataTable', ['sr-only', 'visible', 'false']),
      bool('loading'),
      bool('empty'),
    ],
    render: (s) => (
      <React.Suspense fallback={<UI.Spinner label="Loading chart preview" />}>
        <ChartPreview slug={slug} state={s} />
      </React.Suspense>
    ),
    code: (
      s,
    ) => `const data = ${JSON.stringify(donut ? donutSampleData : chartSampleData, null, 2)};\n\n<${name} data={data} label="${donut ? 'Status comparison' : 'Revenue comparison'}" height={280} ${donut ? `innerRadius="${s.innerRadius}%" outerRadius="88%"` : `index="month" series={[{ dataKey: 'revenue', label: 'Revenue' }, { dataKey: 'costs', label: 'Costs'${slug === 'line-chart' ? ", strokeDasharray: '4 4'" : ''} }]}`}
  ${attr(Object.fromEntries(Object.entries(s).filter(([key]) => key !== 'innerRadius' && key !== 'dataTable')))} dataTable={${s.dataTable === 'false' ? 'false' : JSON.stringify(s.dataTable)}} />`,
  };
}

for (const slug of [
  'time-picker',
  'date-time-picker',
  'time-range-picker',
  'date-time-range-picker',
  'date-range-picker',
] as const) {
  const name = (
    {
      'time-picker': 'TimePicker',
      'date-time-picker': 'DateTimePicker',
      'time-range-picker': 'TimeRangePicker',
      'date-time-range-picker': 'DateTimeRangePicker',
      'date-range-picker': 'DateRangePicker',
    } as const
  )[slug];
  const Component = UI[name];
  propPreviews[slug] = {
    defaults: { disabled: false, readOnly: false, required: false },
    controls: [bool('disabled'), bool('readOnly'), bool('required')],
    render: (s) => field(<Component {...native(s)} />, 'Booking time'),
    code: (s) => `<Field label="Booking time"><${name} ${attr(s)} /></Field>`,
  };
}

function ResizablePreview({ state }: { state: State }) {
  const [open, setOpen] = React.useState(true);
  const [text, setText] = React.useState(
    "import { Button } from '@plain/ui';\n\nexport function Save() {\n  return <Button>Save changes</Button>;\n}",
  );
  return (
    <UI.Stack style={{ width: '100%' }} gap={1}>
      <UI.Inline>
        <UI.Button variant="ghost" size="sm" onClick={() => setOpen(!open)}>
          {open ? 'Close explorer' : 'Open explorer'}
        </UI.Button>
      </UI.Inline>
      <UI.Resizable
        style={{ height: 340 }}
        orientation={choice(state, 'orientation', ['horizontal', 'vertical'])}
        mobileOrientation={false}
        storageKey={state.persist ? 'pui-docs-resizable' : undefined}
      >
        <UI.ResizablePanel
          id="files"
          minSize="20%"
          defaultSize="30%"
          collapsible
          collapsedSize="0%"
          open={open}
          onOpenChange={setOpen}
          collapseAt={state.responsive ? 480 : undefined}
          adaptTo={choice(state, 'adaptTo', ['floating', 'docked', 'hidden'])}
          overlayTitle="Explorer"
        >
          <UI.Stack padding={2}>
            <UI.Strong>Explorer</UI.Strong>
            {['button.tsx', 'theme.css', 'index.ts'].map((name) => (
              <UI.Button key={name} variant="ghost" style={{ justifyContent: 'start' }}>
                {name}
              </UI.Button>
            ))}
          </UI.Stack>
        </UI.ResizablePanel>
        <UI.ResizableHandle aria-label="Resize explorer" />
        <UI.ResizablePanel id="editor" minSize="30%">
          <UI.Stack padding={2} style={{ height: '100%' }}>
            <UI.Strong>button.tsx</UI.Strong>
            <UI.Textarea
              variant="ghost"
              aria-label="Edit source"
              value={text}
              onChange={(event) => setText(event.target.value)}
              spellCheck={false}
              dir="ltr"
              style={{ flex: 1, resize: 'none', fontFamily: 'monospace' }}
            />
          </UI.Stack>
        </UI.ResizablePanel>
      </UI.Resizable>
    </UI.Stack>
  );
}

propPreviews['resizable'] = {
  defaults: { orientation: 'horizontal', adaptTo: 'floating', responsive: true, persist: false },
  controls: [
    options('orientation', ['horizontal', 'vertical']),
    options('adaptTo', ['floating', 'docked', 'hidden']),
    bool('responsive'),
    bool('persist'),
  ],
  render: (s) => <ResizablePreview state={s} />,
  code: (s) => `const [open, setOpen] = React.useState(true);

<Stack gap={1} style={{ width: '100%' }}>
  <Button variant="ghost" onClick={() => setOpen(!open)}>{open ? 'Close explorer' : 'Open explorer'}</Button>
  <Resizable orientation="${s.orientation}" mobileOrientation={false} storageKey={${s.persist ? '"my-editor"' : 'undefined'}} style={{ height: 340 }}>
    <ResizablePanel id="files" defaultSize="30%" minSize="20%" collapsible collapsedSize="0%" open={open} onOpenChange={setOpen} collapseAt={${s.responsive ? 480 : 'undefined'}} adaptTo="${s.adaptTo}" overlayTitle="Explorer">
      <Stack padding={2}><Strong>Explorer</Strong><Button variant="ghost">button.tsx</Button></Stack>
    </ResizablePanel>
    <ResizableHandle aria-label="Resize explorer" />
    <ResizablePanel id="editor" minSize="30%"><Stack padding={2}><Strong>button.tsx</Strong><Textarea variant="ghost" aria-label="Edit source" defaultValue="export function Save() {}" dir="ltr" /></Stack></ResizablePanel>
  </Resizable>
</Stack>`,
};

function remoteTableSource(state: State) {
  return `type Project = { id: string; name: string; status: string; amount: number };
const columns = React.useMemo<DataTableColumn<Project>[]>(() => [
  { accessorKey: 'name', header: 'Project' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'amount', header: 'Amount' },
], []);
const filterFields = React.useMemo<DataTableFilterField<Project>[]>(() => [
  { id: 'status', label: 'Status', type: 'enum', options: [{ value: 'Active', label: 'Active' }, { value: 'Review', label: 'Review' }] },
  { id: 'amount', label: 'Amount', type: 'number' },
], []);
const remote = useRemoteDataTable<Project>({
  columns, filterFields, getRowId: row => row.id,
  load: async (request, signal) => {
    const response = await fetch('/api/projects', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request), signal,
    });
    if (!response.ok) throw new Error('Unable to load projects');
    return await response.json() as DataTableResponse<Project>;
  },
});

<DataTableView table={remote.table} loading={remote.loading} filterMode="${state.filterMode}" filterFields={remote.filterFields} stickyHeader={${state.stickyHeader}} stickyFooter={${state.stickyFooter}} stickyScrollbar={${state.stickyScrollbar}} scrollHeight={${state.contained ? 340 : 'undefined'}} selectable />
{!!remote.error && <Button onClick={remote.refresh}>Retry</Button>}`;
}

propPreviews['data-table'] = {
  defaults: {
    filterMode: 'advanced',
    remote: false,
    stickyHeader: false,
    stickyFooter: false,
    stickyScrollbar: false,
    contained: false,
  },
  controls: [
    options('filterMode', ['advanced', 'simple']),
    bool('remote'),
    bool('stickyHeader'),
    bool('stickyFooter'),
    bool('stickyScrollbar'),
    bool('contained'),
  ],
  render: (s) => (
    <React.Suspense fallback={<UI.Spinner />}>
      <TablePreview state={s} />
    </React.Suspense>
  ),
  code: (s) =>
    s.remote
      ? remoteTableSource(s)
      : `const data = [{ id: 'a', name: 'Website redesign', status: 'Active', amount: 120 }, { id: 'b', name: 'Mobile experience', status: 'Review', amount: 90 }];
const columns = [{ accessorKey: 'name', header: 'Project' }, { accessorKey: 'status', header: 'Status' }, { accessorKey: 'amount', header: 'Amount' }];

<DataTable data={data} columns={columns} filterMode="${s.filterMode}" filterFields={[{ id: 'status', label: 'Status', type: 'enum', options: [{ value: 'Active', label: 'Active' }, { value: 'Review', label: 'Review' }] }, { id: 'amount', label: 'Amount', type: 'number' }]} stickyHeader={${s.stickyHeader}} stickyFooter={${s.stickyFooter}} stickyScrollbar={${s.stickyScrollbar}} scrollHeight={${s.contained ? 340 : 'undefined'}} getRowId={row => row.id} selectable />`,
};
for (const slug of [
  'chips',
  'search-view',
  'kanban',
  'pie-chart',
  'radar-chart',
  'scatter-chart',
  'composed-chart',
  'gantt-chart',
  'heatmap-chart',
] as const) {
  const definition = workspaceDefinitions.find((component) => component.slug === slug)!;
  const defaults: State =
    slug === 'chips'
      ? { type: 'multiple', variant: 'outlined', size: 'md', disabled: false }
      : slug === 'search-view'
        ? { variant: 'modal', loading: false }
        : slug === 'kanban'
          ? { disabled: false, columnWidth: 252 }
          : slug === 'gantt-chart'
            ? { scale: 'day', dataTable: 'sr-only', loading: false }
            : slug === 'heatmap-chart'
              ? { cellSize: 40, showValues: true, dataTable: 'sr-only', loading: false }
              : { dataTable: 'sr-only', loading: false };
  const controls = Object.keys(defaults).map((key) =>
    key === 'type'
      ? options(key, ['single', 'multiple'])
      : key === 'variant'
        ? options(
            key,
            slug === 'chips' ? ['outlined', 'filled'] : ['modal', 'docked', 'fullscreen'],
          )
        : key === 'size'
          ? options(key, ['sm', 'md'])
          : key === 'scale'
            ? options(key, ['day', 'week', 'month'])
            : key === 'dataTable'
              ? options(key, ['sr-only', 'visible', 'false'])
              : key === 'columnWidth'
                ? number(key, 200, 360)
                : key === 'cellSize'
                  ? number(key, 24, 64)
                  : bool(key),
  );
  propPreviews[slug] = {
    defaults,
    controls,
    render: (s) => (
      <React.Suspense fallback={<UI.Spinner />}>
        <WorkspacePreview slug={slug} state={s} />
      </React.Suspense>
    ),
    code: (s) => {
      let markup = definition.code;
      if (slug === 'chips')
        markup = markup
          .replace('<ChipGroup', '<ChipGroup ' + attr({ type: s.type, disabled: s.disabled }))
          .replaceAll(
            '<Chip value',
            '<Chip ' + attr({ variant: s.variant, size: s.size }) + ' value',
          );
      else if (slug === 'search-view')
        markup = markup.replace(
          'variant="modal"',
          attr({ variant: s.variant, loading: s.loading }),
        );
      else if (slug === 'kanban')
        markup = markup.replace('<KanbanBoard', '<KanbanBoard ' + attr(s));
      else {
        markup = markup.replace(
          'dataTable="visible"',
          s.dataTable === 'false' ? 'dataTable={false}' : 'dataTable="' + s.dataTable + '"',
        );
        markup = markup.replace(' />', ' loading={' + s.loading + '} />');
        if (slug === 'gantt-chart')
          markup = markup.replace('scale="day"', 'scale="' + s.scale + '"');
        if (slug === 'heatmap-chart')
          markup = markup
            .replace('cellSize={40}', 'cellSize={' + s.cellSize + '}')
            .replace(' showValues ', ' showValues={' + s.showValues + '} ');
      }
      return (
        [definition.setup, definition.functionSetup].filter(Boolean).join('\n') + '\n\n' + markup
      );
    },
  };
}

export function previewSource(preview: PropPreview, state: State) {
  const code = preview.code(state);
  const names = [
    ...new Set([...code.matchAll(/(?<![\w.])<\/?([A-Z][\w]*)\b/g)].map((match) => match[1])),
  ];
  if (code.includes('useRemoteDataTable'))
    names.push(
      'useRemoteDataTable',
      'type DataTableColumn',
      'type DataTableFilterField',
      'type DataTableResponse',
    );
  if (code.includes('KanbanColumn')) names.push('type KanbanColumn');
  if (code.includes('DateRange')) names.push('type DateRange');
  const split = code.startsWith('<') ? 0 : code.indexOf('\n\n<') + 2;
  const setup = code.slice(0, split);
  const markup = code.slice(split);
  const entry = names.includes('KanbanBoard') ? '@plain/ui/kanban' : '@plain/ui';
  const chart = names.some((name) =>
    [
      'AreaChart',
      'BarChart',
      'LineChart',
      'DonutChart',
      'PieChart',
      'RadarChart',
      'ScatterChart',
      'ComposedChart',
      'GanttChart',
      'HeatmapChart',
    ].includes(name),
  );
  return `${code.includes('React.') ? "import * as React from 'react';\n" : ''}import { ${names.join(', ')} } from '${chart ? '@plain/ui/charts' : entry}';\nimport '@plain/ui/styles.css';${chart ? "\nimport '@plain/ui/charts.css';" : ''}\n\nexport function Example() {\n${setup}  return (\n    <>\n${markup}\n    </>\n  );\n}`;
}

export function PropPlayground({
  slug,
  children,
  code,
  title,
}: {
  slug: string;
  children?: React.ReactNode;
  code?: string;
  title?: string;
}) {
  const preview = propPreviews[slug];
  const [state, setState] = React.useState<State>(() => ({ ...preview.defaults }));
  const [reset, setReset] = React.useState(0);
  const [expanded, setExpanded] = React.useState(false);
  const [configured, setConfigured] = React.useState(false);
  const id = React.useId();
  const update = (name: string, value: string | number | boolean) => {
    setConfigured(true);
    setState((prev) => ({ ...prev, [name]: value }));
  };
  return (
    <div className="preview-workbench" id="props-preview">
      <UI.Tabs defaultValue="preview">
        <div className="example-toolbar">
          <UI.TabsList variant="underline" aria-label="Example view">
            <UI.TabsTrigger value="preview">Preview</UI.TabsTrigger>
            <UI.TabsTrigger value="code">
              <Code2 size={14} aria-hidden="true" />
              Code
            </UI.TabsTrigger>
          </UI.TabsList>
          <div className="preview-workbench-tools">
            <UI.Button
              variant="ghost"
              size="icon"
              aria-label="Reset preview props"
              title="Reset preview props"
              disabled={!configured}
              onClick={() => {
                setState({ ...preview.defaults });
                setReset((v) => v + 1);
                setConfigured(false);
              }}
            >
              <RotateCcw size={16} />
            </UI.Button>
            <UI.Button
              variant="ghost"
              size="icon"
              aria-label="Preview properties"
              title="Preview properties"
              aria-expanded={expanded}
              aria-controls={id}
              onClick={() => setExpanded(!expanded)}
            >
              <SlidersHorizontal size={16} />
            </UI.Button>
          </div>
        </div>
        <UI.Collapsible open={expanded}>
          <UI.CollapsibleContent id={id} className="preview-properties">
            <div className="prop-playground-controls">
              {preview.controls.map((control) => {
                const controlId = `${id}-${control.name}`;
                const disabled = Object.entries(control.when ?? {}).some(
                  ([key, value]) => state[key] !== value,
                );
                if (control.options)
                  return (
                    <div className="prop-playground-field" key={control.name}>
                      <UI.Label htmlFor={controlId}>{control.name}</UI.Label>
                      <UI.Select
                        disabled={disabled}
                        value={String(state[control.name])}
                        onValueChange={(value) => update(control.name, value)}
                      >
                        <UI.SelectTrigger id={controlId}>
                          <UI.SelectValue />
                        </UI.SelectTrigger>
                        <UI.SelectContent>
                          {control.options.map((option) => (
                            <UI.SelectItem key={option} value={option}>
                              {option}
                            </UI.SelectItem>
                          ))}
                        </UI.SelectContent>
                      </UI.Select>
                    </div>
                  );
                if (control.min !== undefined)
                  return (
                    <div className="prop-playground-field" key={control.name}>
                      <UI.Label htmlFor={controlId}>{control.name}</UI.Label>
                      <UI.NumberInput
                        disabled={disabled}
                        id={controlId}
                        aria-label={control.name}
                        value={Number(state[control.name])}
                        min={control.min}
                        max={control.max}
                        onValueChange={(value) => {
                          if (typeof value === 'number' && Number.isFinite(value))
                            update(
                              control.name,
                              Math.max(control.min!, Math.min(control.max!, value)),
                            );
                        }}
                      />
                    </div>
                  );
                return (
                  <UI.Label
                    className="prop-playground-toggle"
                    key={control.name}
                    htmlFor={controlId}
                  >
                    <span>{control.name}</span>
                    <UI.Switch
                      disabled={disabled}
                      id={controlId}
                      checked={!!state[control.name]}
                      onCheckedChange={(value) => update(control.name, value)}
                    />
                  </UI.Label>
                );
              })}
            </div>
          </UI.CollapsibleContent>
        </UI.Collapsible>
        <UI.TabsContent
          value="preview"
          className="component-preview"
          data-configured={configured || undefined}
        >
          <React.Fragment key={reset}>
            {configured || !children ? preview.render(state) : children}
          </React.Fragment>
        </UI.TabsContent>
        <UI.TabsContent value="code">
          <CodeBlock
            code={configured || !code ? previewSource(preview, state) : code}
            title={title ?? `${slug}.tsx`}
          />
        </UI.TabsContent>
      </UI.Tabs>
    </div>
  );
}
