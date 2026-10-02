import { createRef, useState } from 'react';
import { H1, P, A, Blockquote, Ol, Li } from '@plain/ui/typography';
import {
  PlainProvider,
  ThemeScope,
  Button,
  Field,
  Input,
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
} from '@plain/ui';
import { Button as ModularButton } from '@plain/ui/primitives';
import '@plain/ui/styles.css';
import { FullCalendar, type FullCalendarRef } from '@plain/ui/full-calendar';
import '@plain/ui/full-calendar.css';

type Record = { id: string; name: string };
const columns: DataTableColumn<Record>[] = [{ accessorKey: 'name', header: 'Name' }];
const styles: ComponentStyles = { 'button.root': 'rounded-full', 'data-table.root': 'space-y-8' };
const anchorRef = createRef<HTMLAnchorElement>();
const quoteRef = createRef<HTMLQuoteElement>();
const calendarRef = createRef<FullCalendarRef>();

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
    <PlainProvider dir="rtl" styles={styles} tokens={{ radius: '8px' }} persist={false}>
      <ThemeScope tokens={{ accent: '#1d4ed8' }}>
        <H1 size="2xl">Project workspace</H1>
        <P tone="muted" align="start">
          Your current projects.
        </P>
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
        <DataTableView
          table={table}
          selectable
          filterFields={[{ id: 'name', label: 'Name', type: 'text' }]}
          selectionActions={(table) => (
            <Button onClick={() => table.resetRowSelection(true)}>Clear</Button>
          )}
        />
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
