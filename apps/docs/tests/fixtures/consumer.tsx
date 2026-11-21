import { createRef, useState } from 'react';
import { H1, P, A, Blockquote, Ol, Li } from '@plain/ui/typography';
import {
  PlainProvider,
  ThemeScope,
  Button,
  ChartSkeleton,
  Box,
  Stack,
  LayoutPresence,
  Field,
  Input,
  Textarea,
  PinInput,
  SearchInput,
  DateTimeRangePicker,
  type InputVariant,
  Switch,
  tokensToStyle,
  extendComponent,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DatePicker,
  Combobox,
  DataTable,
  useDataTable,
  DataTableView,
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarInset,
  SidebarTrigger,
  EmptyState,
  EmptyStateContent,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
  type DataTableColumn,
  type ComponentStyles,
  type TooltipOptions,
} from '@plain/ui';
import { Button as ModularButton } from '@plain/ui/primitives';
import { Textarea as ModularTextarea, type TextareaProps } from '@plain/ui/forms';
import { ChartSkeleton as ModularChartSkeleton } from '@plain/ui/charts';
import { TooltipProvider as ModularTooltipProvider, type TooltipValue } from '@plain/ui/overlays';
import { Dropzone as ModularDropzone } from '@plain/ui/advanced';
import { QRCode as ModularQRCode, type QRCodeProps } from '@plain/ui/qr-code';
import { TimePicker as ModularTimePicker, type TimePickerMode } from '@plain/ui/date-time';
import {
  DataTableSearch as ModularTableSearch,
  DataTableSort as ModularTableSort,
  DataTableColumns as ModularTableColumns,
  DataTablePagination as ModularTablePagination,
} from '@plain/ui/data-table';
import '@plain/ui/styles.css';
import { FullCalendar, type FullCalendarRef } from '@plain/ui/full-calendar';
import '@plain/ui/full-calendar.css';

type Record = { id: string; name: string };
const columns: DataTableColumn<Record>[] = [{ accessorKey: 'name', header: 'Name' }];
const styles: ComponentStyles = { 'button.root': 'rounded-full', 'data-table.root': 'space-y-8' };
const anchorRef = createRef<HTMLAnchorElement>();
const quoteRef = createRef<HTMLQuoteElement>();
const calendarRef = createRef<FullCalendarRef>();
const RoundSwitch = extendComponent(Switch, { tokens: { 'switch.radius': '999px' } });
const tooltip: TooltipOptions = {
  content: 'Project context',
  side: 'right',
  collisionPadding: 12,
  delayDuration: 200,
  'data-purpose': 'context',
};
const disabledTooltip: TooltipValue = false;

export function ConsumerApp() {
  const [date, setDate] = useState<Date>();
  const table = useDataTable({
    data: [{ id: '1', name: 'Design' }],
    columns,
    getRowId: (row) => row.id,
    manualPagination: true,
    rowCount: 100,
  });
  return (
    <PlainProvider
      locale="ar-EG"
      timeZone="Africa/Cairo"
      dir="rtl"
      translations={{ ar: { 'table.search': 'بحث' } }}
      styles={styles}
      tokens={{ radius: '8px' }}
      persist={false}
      tooltip={{ delayDuration: 350 }}
    >
      <ThemeScope
        locale="fr-FR"
        messages={{ 'common.done': 'Terminé' }}
        tokens={{ accent: '#1d4ed8' }}
      >
        <ModularTooltipProvider skipDelayDuration={200}>
          <Button tooltip={tooltip}>Project context</Button>
          <ModularButton tooltip={disabledTooltip}>No tooltip</ModularButton>
          <ModularTableSearch table={table} tooltip="Search the records" />
          <ModularTableSort table={table} tooltip={{ content: 'Reorder records', align: 'end' }} />
        </ModularTooltipProvider>
        <H1 size="2xl">Project workspace</H1>
        <Textarea resize="none" name="description" aria-label="Description" />
        <ModularTextarea
          {...({ resize: 'both' } satisfies Pick<TextareaProps, 'resize'>)}
          name="draft"
          aria-label="Draft"
        />
        <Stack
          presence={{
            initial: false,
            preset: 'slide',
            duration: 180,
            exitDuration: 120,
            stagger: 24,
            layout: true,
            maxItems: 30,
          }}
        >
          <Box key="project">Project content</Box>
        </Stack>
        <LayoutPresence asChild tooltip="Workspace navigation">
          <ul>
            <li key="navigation">Custom container</li>
          </ul>
        </LayoutPresence>
        <ModularQRCode
          value="https://github.com/ayhamDev/Plain"
          label="Project repository"
          {...({
            shape: 'circle',
            moduleShape: 'dots',
            moduleScale: 0.95,
            finderShape: 'rounded',
            finderCenterShape: 'circle',
            finderColor: '#123456',
            finderCenterColor: '#123456',
            gradient: {
              stops: [
                { offset: 0, color: '#123456' },
                { offset: 1, color: '#111111' },
              ],
            },
            logo: { src: '/brand.svg', size: 0.18, padding: 1, radius: 0.5 },
            circlePattern: true,
            circlePatternColor: '#123456',
            animation: { preset: 'fade', duration: 600, delay: 80 },
            qrVersion: 7,
            maskPattern: 3,
            renderModule: (_module, element) => element,
            renderFinder: (_finder, element) => element,
          } satisfies Omit<QRCodeProps, 'value'>)}
          style={tokensToStyle({ 'qr-code.foreground': '#123456', 'qr-code.duration': '600ms' })}
        />
        <Field label="Start time">
          <ModularTimePicker
            variant="filled"
            defaultValue="16:07"
            hour12
            pickerMode={'wheel' satisfies TimePickerMode}
            popoverProps={{ align: 'start', collisionPadding: 12 }}
          />
        </Field>
        {(['outlined', 'filled', 'ghost', 'contrast'] satisfies InputVariant[]).map((variant) => (
          <Stack key={variant} gap={2}>
            <PinInput variant={variant} name={`code-${variant}`} aria-label={`Code ${variant}`} />
            <SearchInput variant={variant} aria-label={`Search ${variant}`} />
            <Combobox
              variant={variant}
              options={[{ value: 'one', label: 'One' }]}
              aria-label={`Choice ${variant}`}
            />
            <DateTimeRangePicker variant={variant} aria-label={`Booking ${variant}`} />
          </Stack>
        ))}
        <P tone="muted" align="start">
          Your current projects.
        </P>
        <ModularDropzone
          name="attachments"
          aria-label="Project attachments"
          accept=".txt"
          multiple
          maxFiles={2}
          maxSize={1000000}
          style={tokensToStyle({ 'dropzone.radius': '12px' })}
        >
          {({ dragging, files }) => (
            <P>{dragging ? 'Release files' : `${files.length} attachments`}</P>
          )}
        </ModularDropzone>
        <RoundSwitch
          aria-label="Local notifications"
          style={tokensToStyle({ 'switch.radius': '0px', 'switch.thumb-radius': '2px' })}
        />
        <Input
          aria-label="Local project name"
          style={tokensToStyle({ 'input.radius': '12px', 'input.height': '48px' })}
        />
        <A ref={anchorRef} href="/projects" download="projects.txt">
          Projects
        </A>
        <Blockquote ref={quoteRef} cite="https://example.com">
          Project brief
        </Blockquote>
        <Ol start={2}>
          <Li value={3}>Review</Li>
        </Ol>
        <Field label="Project">
          <Input name="project" required />
        </Field>
        <Button variant="accent">Create</Button>
        <ModularButton unstyled className="custom-button">
          Custom
        </ModularButton>
        <DatePicker value={date} onValueChange={setDate} locale="ar" clearLabel="Clear" />
        <Combobox options={[{ label: 'Design', value: 'design' }]} />
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Project</DialogTitle>
            <DialogDescription>Details</DialogDescription>
          </DialogContent>
        </Dialog>
        <DataTable
          data={[{ id: '1', name: 'Design' }]}
          columns={columns}
          getRowId={(row) => row.id}
        />
        <ModularTableSearch table={table} />
        <ModularTableSort table={table} />
        <ModularTableColumns table={table} />
        <DataTableView
          table={table}
          showToolbar={false}
          showPagination={false}
          selectable
          filterFields={[{ id: 'name', label: 'Name', type: 'text' }]}
          selectionActions={(table) => (
            <Button onClick={() => table.resetRowSelection(true)}>Clear</Button>
          )}
        />
        <ModularTablePagination table={table} />
        <SidebarProvider collapsible="offcanvas" shortcut={false}>
          <Sidebar variant="inset">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild label="Projects">
                      <a href="/projects">Projects</a>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>2</SidebarMenuBadge>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            <SidebarTrigger />
          </SidebarInset>
        </SidebarProvider>
        <ChartSkeleton variant="area" height={280} label="Loading revenue" />
        <ModularChartSkeleton variant="heatmap" rows={3} columns={5} height={176} animate={false} />
        <EmptyState align="start">
          <EmptyStateContent>
            <EmptyStateTitle>No events</EmptyStateTitle>
            <EmptyStateDescription>A custom recovery path.</EmptyStateDescription>
          </EmptyStateContent>
          <EmptyStateActions>
            <Button>Add event</Button>
          </EmptyStateActions>
        </EmptyState>
        <FullCalendar
          ref={calendarRef}
          defaultDate="2026-10-05"
          events={[]}
          onPrint={(context) => {
            console.log(context.range, context.timeZone);
          }}
          renderEvent={({ event }) => <span>{event.title}</span>}
          printMode="agenda"
        />
      </ThemeScope>
    </PlainProvider>
  );
}
