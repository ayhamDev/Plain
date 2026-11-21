import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Save } from 'lucide-react';
import {
  PlainProvider,
  ThemeScope,
  TooltipProvider,
  Button,
  Badge,
  Card,
  Field,
  Input,
  Slider,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Stack,
  Inline,
  H1,
  H2,
  P,
  Span,
  DatePicker,
  TimePicker,
  Dropzone,
  PinInput,
  AspectRatio,
  LayoutPresence,
  BreadcrumbEllipsis,
  useDataTable,
  DataTableView,
  DataTableSearch,
  DataTableSort,
  DataTableColumns,
  DataTableFilters,
  type DataTableColumn,
  type DataTableFilterField,
} from '@plain/ui';
import { QRCode } from '@plain/ui/qr-code';
import '@plain/ui/styles.css';

const params = new URLSearchParams(location.search);
type Row = { id: string; name: string };
const columns: DataTableColumn<Row>[] = [{ accessorKey: 'name', header: 'Name' }];
const fields: DataTableFilterField<Row>[] = [{ id: 'name', label: 'Name', type: 'text' }];

function Workspace() {
  const [clicks, setClicks] = React.useState(0);
  const [hint, setHint] = React.useState(true);
  const [saved, setSaved] = React.useState('Not saved');
  const input = React.useRef<HTMLInputElement>(null);
  const table = useDataTable({
    data: [
      { id: '1', name: 'Alpha' },
      { id: '2', name: 'Beta' },
    ],
    columns,
    filterFields: fields,
  });
  return (
    <main style={{ padding: 24, maxWidth: 920, marginInline: 'auto', display: 'grid', gap: 24 }}>
      <H1 size="xl">Shared component tooltips</H1>
      <ThemeScope
        data-testid="local-scope"
        dir={params.get('dir') === 'rtl' ? 'rtl' : 'ltr'}
        tokens={
          params.has('brand')
            ? { 'tooltip.background': '#193c30', 'tooltip.foreground': '#ffffff' }
            : undefined
        }
      >
        <Stack gap={5}>
          <Inline gap={3}>
            <Button
              size="icon"
              tooltip="Save project"
              onClick={() => setClicks((value) => value + 1)}
            >
              <Save aria-hidden="true" />
            </Button>
            <Button disabled tooltip="Choose a file before deleting">
              Delete
            </Button>
            <Button tooltip={hint ? 'Live project context' : false} data-testid="live">
              Live hint
            </Button>
            <Button onClick={() => setHint((value) => !value)}>Toggle hint</Button>
            <Badge tooltip={{ content: <strong>Private workspace</strong>, side: 'bottom' }}>
              Private
            </Badge>
          </Inline>
          <output aria-label="Activation count">{clicks}</output>
          <form
            aria-label="Project form"
            onSubmit={(event) => {
              event.preventDefault();
              setSaved(String(new FormData(event.currentTarget).get('project')));
            }}
          >
            <Stack gap={3}>
              <Field label="Project name" description="Visible to your team.">
                <Input
                  ref={input}
                  name="project"
                  defaultValue="Website"
                  required
                  tooltip="Choose a recognizable project name"
                />
              </Field>
              <Inline gap={3}>
                <Button onClick={() => input.current?.focus()}>Focus project name</Button>
                <Button type="submit">Save form</Button>
              </Inline>
              <output aria-label="Saved value">{saved}</output>
            </Stack>
          </form>
          <Select defaultValue="a">
            <SelectTrigger aria-label="Workspace" tooltip="Switch your workspace">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a">Alpha</SelectItem>
              <SelectItem value="b">Beta</SelectItem>
            </SelectContent>
          </Select>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview" tooltip="Project summary">
                Overview
              </TabsTrigger>
              <TabsTrigger value="activity" tooltip="Recent project activity">
                Activity
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview">Overview content</TabsContent>
            <TabsContent value="activity">Activity content</TabsContent>
          </Tabs>
          <Slider aria-label="Volume" defaultValue={[40]} tooltip="Adjust the project volume" />
          <Inline gap={3}>
            <Dialog>
              <DialogTrigger asChild tooltip="Open project information">
                <Button>Project information</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Project information</DialogTitle>
                <DialogDescription>Project information is available here.</DialogDescription>
                <Input aria-label="Dialog input" tooltip="Context inside the dialog" />
              </DialogContent>
            </Dialog>
            <Popover>
              <PopoverTrigger asChild tooltip="Open project options">
                <Button>Project options</Button>
              </PopoverTrigger>
              <PopoverContent aria-label="Project options">
                <P>Choose your next step.</P>
                <Button>Continue</Button>
              </PopoverContent>
            </Popover>
          </Inline>
          <Card variant="filled" tooltip="This card describes the current project">
            <H2 size="lg">Website redesign</H2>
            <P>Design, build, and review.</P>
          </Card>
          <Stack tooltip="Shared group context" data-testid="hint-group">
            <Button>First group action</Button>
            <Button>Second group action</Button>
          </Stack>
          <Span tooltip="This text has more context">Additional details</Span>
          <Button
            onFocus={(event) => event.preventDefault()}
            onPointerMove={(event) => event.preventDefault()}
            tooltip="Prevented hint"
          >
            Prevent hint
          </Button>
          <Button
            unstyled
            style={{ padding: 12, border: '1px solid currentColor', borderRadius: 6 }}
            tooltip={{
              content: 'Custom hint',
              unstyled: true,
              style: { padding: 8, background: '#202522', color: '#fff' },
            }}
          >
            Unstyled control
          </Button>
          <Inline style={{ justifyContent: 'flex-end' }}>
            <Button
              tooltip={{
                content:
                  'A long contextual explanation that should wrap within the viewport, even near an edge. '.repeat(
                    3,
                  ),
                side: 'right',
                align: 'end',
              }}
            >
              Edge hint
            </Button>
          </Inline>
        </Stack>
      </ThemeScope>
      <section aria-label="Specialized controls">
        <Stack gap={4}>
          <DatePicker
            aria-label="Project date"
            name="date"
            defaultValue={new Date(2026, 10, 21)}
            tooltip="Choose the project date"
          />
          <TimePicker
            aria-label="Start time"
            name="time"
            defaultValue="09:00"
            tooltip="Choose the start time"
          />
          <PinInput aria-label="Security code" tooltip="Enter the verification code" />
          <Dropzone
            label="Project files"
            name="files"
            tooltip="Drop or select your project files"
          />
          <QRCode
            value="https://github.com/ayhamDev/Plain"
            size={128}
            animation={false}
            tooltip="Scan to open the project repository"
          />
        </Stack>
      </section>
      <section aria-label="Structural layouts">
        <Stack gap={3}>
          <LayoutPresence presence={false} tooltip="Layout context" data-testid="presence-hint">
            Layout content
          </LayoutPresence>
          <div style={{ width: 240, maxWidth: '100%' }}>
            <AspectRatio ratio={16 / 9} tooltip="Media context" data-testid="ratio-hint">
              Media content
            </AspectRatio>
          </div>
          <BreadcrumbEllipsis
            tooltip="Hidden navigation levels"
            aria-label="More navigation levels"
          />
        </Stack>
      </section>
      <section aria-label="External table controls">
        <Stack gap={3}>
          <DataTableSearch table={table} tooltip="Search project records" />
          <Inline gap={3}>
            <DataTableSort table={table} tooltip="Reorder the records" />
            <DataTableColumns table={table} tooltip="Choose visible columns" />
            <DataTableFilters table={table} fields={fields} tooltip="Filter the project records" />
          </Inline>
          <DataTableView table={table} showToolbar={false} />
        </Stack>
      </section>
    </main>
  );
}

const Wrapper = params.has('fallback') ? React.Fragment : TooltipProvider;
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PlainProvider
      persist={false}
      tooltip={{ delayDuration: 0 }}
      theme={{
        mode: params.get('theme') === 'dark' ? 'dark' : 'light',
        motion:
          params.get('motion') === 'reduced'
            ? 'reduced'
            : params.get('motion') === 'system'
              ? 'system'
              : 'none',
      }}
    >
      <Wrapper>
        <Workspace />
      </Wrapper>
    </PlainProvider>
  </React.StrictMode>,
);
