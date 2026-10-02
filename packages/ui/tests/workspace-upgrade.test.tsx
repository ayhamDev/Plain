import * as React from 'react';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  LanguageProvider,
  useTranslation,
  englishMessages,
  arabicMessages,
  dateFormatter,
} from '../src/ui/i18n';
import { Chip, ChipGroup } from '../src/ui/chips';
import {
  TreeView,
  SidebarProvider,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
} from '../src/ui/sidebar';
import { ScrollArea } from '../src/ui/navigation';
import { HeatmapChart } from '../src/ui/heatmap';
import { KanbanBoard, moveKanbanItem } from '../src/ui/kanban';
import { CalendarEventDialog, type CalendarEventDraft } from '../src/ui/calendar-event-dialog';
import { Button, Field, Input, StyleProvider } from '../src/ui';
import { useRemoteDataTable } from '../src/ui/data-table-remote';
import { DataTableFilterValue } from '../src/ui/data-table-filter-value';
import { useStyles } from '../src/ui/styling';

describe('workspace foundations', () => {
  it('uses explicit compact sidebar slots without discarding expanded composition', async () => {
    render(
      <SidebarProvider>
        <SidebarHeader collapsedContent={<span>Brand mark</span>}>Workspace name</SidebarHeader>
        <SidebarFooter collapsedContent={<span>Avatar</span>}>Account details</SidebarFooter>
        <SidebarTrigger />
      </SidebarProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Collapse navigation' }));
    expect(screen.getByText('Brand mark')).toBeInTheDocument();
    expect(screen.getByText('Avatar')).toBeInTheDocument();
    expect(screen.queryByText('Workspace name')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Expand navigation' }));
    expect(screen.getByText('Workspace name')).toBeInTheDocument();
    expect(screen.getByText('Account details')).toBeInTheDocument();
  });

  it('retains legacy Split Pane overrides while canonical slots take precedence', () => {
    function Panel() {
      const styles = useStyles();
      return <div {...styles('resizable.panel', 'default-panel')} />;
    }
    const { container, rerender } = render(
      <StyleProvider styles={{ 'split-pane.panel': 'legacy-panel' }}>
        <Panel />
      </StyleProvider>,
    );
    expect(container.firstChild).toHaveClass('legacy-panel');
    expect(container.firstChild).toHaveAttribute('data-ui', 'resizable');
    rerender(
      <StyleProvider
        styles={{ 'split-pane.panel': 'legacy-panel', 'resizable.panel': 'new-panel' }}
      >
        <Panel />
      </StyleProvider>,
    );
    expect(container.firstChild).toHaveClass('new-panel');
    expect(container.firstChild).not.toHaveClass('legacy-panel');
  });

  it('selects inherited dictionaries by locale without leaking a parent language', () => {
    function Label({ id }: { id: string }) {
      const { t, locale, dir } = useTranslation();
      return (
        <span data-testid={id} lang={locale} dir={dir}>
          {t('common.save')} / {t('common.cancel')}
        </span>
      );
    }
    render(
      <LanguageProvider
        locale="fr"
        translations={{ fr: { 'common.save': 'Enregistrer' } }}
        messages={{ 'common.cancel': 'Stop' }}
      >
        <Label id="parent" />
        <LanguageProvider locale="ar">
          <Label id="child" />
        </LanguageProvider>
      </LanguageProvider>,
    );
    expect(screen.getByTestId('parent')).toHaveTextContent('Enregistrer / Stop');
    expect(screen.getByTestId('child')).toHaveTextContent('حفظ / Stop');
    expect(screen.getByTestId('child')).toHaveAttribute('dir', 'rtl');
    expect(Object.keys(englishMessages).filter((key) => !(key in arabicMessages))).toEqual([]);
    expect(dateFormatter('en', { month: 'long' })).toBe(dateFormatter('en', { month: 'long' }));
  });

  it('preserves controlled chips, sibling remove buttons, RTL focus and unstyled inheritance', async () => {
    const change = vi.fn(),
      remove = vi.fn();
    const { container } = render(
      <StyleProvider unstyled>
        <ChipGroup value={['a']} onValueChange={change} dir="rtl" aria-label="Status">
          <Chip value="a" onRemove={remove}>
            Active
          </Chip>
          <Chip value="b">Review</Chip>
        </ChipGroup>
      </StyleProvider>,
    );
    const active = screen.getByRole('button', { name: 'Active' });
    await userEvent.click(active);
    expect(change).toHaveBeenCalledWith([]);
    expect(active).toHaveAttribute('aria-pressed', 'true');
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Review' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Remove Active' }));
    expect(remove).toHaveBeenCalledOnce();
    expect(container.querySelector('button button')).toBeNull();
    expect(container.querySelector('.ui-chip')).toBeNull();
  });

  it('expands a tree from its full label row and keeps the arrow independent', async () => {
    render(
      <TreeView
        nodes={[{ id: 'folder', label: 'Folder', children: [{ id: 'file', label: 'File' }] }]}
      />,
    );
    await userEvent.click(screen.getByText('Folder', { exact: true }));
    expect(screen.getByRole('treeitem', { name: 'Folder' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('treeitem', { name: 'File' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Collapse Folder' }));
    expect(screen.getByRole('treeitem', { name: 'Folder' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('cancels elastic pulls and provides an async keyboard refresh action', async () => {
    const refresh = vi.fn(async () => {});
    const { container } = render(
      <ScrollArea
        elastic
        onRefresh={refresh}
        style={{ height: 100 }}
        viewportProps={{ 'aria-label': 'Scrollable records' }}
      >
        <div>Records</div>
      </ScrollArea>,
    );
    const viewport = screen.getByLabelText('Scrollable records');
    Object.defineProperties(viewport, {
      scrollHeight: { value: 500 },
      clientHeight: { value: 100 },
    });
    fireEvent.touchStart(viewport, { touches: [{ clientX: 5, clientY: 5 }] });
    fireEvent.touchMove(viewport, { touches: [{ clientX: 5, clientY: 220 }], cancelable: true });
    expect(screen.getByRole('button', { name: 'Release to refresh' })).toBeInTheDocument();
    fireEvent.touchCancel(viewport);
    fireEvent.touchEnd(viewport);
    expect(refresh).not.toHaveBeenCalled();
    expect(container.querySelector('.ui-scroll-content')).toHaveStyle({
      '--ui-elastic-offset': '0px',
    });
    await userEvent.click(screen.getByRole('button', { name: 'Pull to refresh' }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  });
});

describe('typed remote tables', () => {
  it('aborts stale responses and never paginates an already loaded server page again', async () => {
    type Record = { id: string; amount: number };
    const requests: {
      signal: AbortSignal;
      resolve: (value: { data: Record[]; rowCount: number }) => void;
    }[] = [];
    const columns = [{ accessorKey: 'id', header: 'ID' }];
    const { result, unmount } = renderHook(() =>
      useRemoteDataTable<Record>({
        columns,
        debounceMs: 0,
        load: (_request, signal) => new Promise((resolve) => requests.push({ signal, resolve })),
      }),
    );
    await waitFor(() => expect(requests).toHaveLength(1));
    act(() => result.current.table.setPageIndex(2));
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(requests[0].signal.aborted).toBe(true);
    await act(async () =>
      requests[1].resolve({ data: [{ id: 'current', amount: 7 }], rowCount: 35 }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.table.getRowModel().rows.map((row) => row.original.id)).toEqual([
      'current',
    ]);
    expect(result.current.table.getPageCount()).toBe(4);
    await act(async () => requests[0].resolve({ data: [{ id: 'stale', amount: 1 }], rowCount: 1 }));
    expect(result.current.table.getRowModel().rows[0].original.id).toBe('current');
    act(() => result.current.table.setGlobalFilter({ search: 'paid', join: 'and', filters: [] }));
    expect(result.current.request.pagination.pageIndex).toBe(0);
    unmount();
    expect(requests[1].signal.aborted).toBe(true);
  });

  it('keeps boolean and numeric enum selections typed rather than stringifying values', async () => {
    const change = vi.fn();
    const { rerender } = render(
      <DataTableFilterValue
        field={{ id: 'paid', label: 'Paid', type: 'boolean' }}
        rule={{ id: '1', field: 'paid', operator: 'eq', value: false }}
        onChange={change}
      />,
    );
    await userEvent.click(screen.getByRole('combobox', { name: 'Filter value for Paid' }));
    await userEvent.click(screen.getByRole('option', { name: 'Yes' }));
    expect(change).toHaveBeenCalledWith(true);
    rerender(
      <DataTableFilterValue
        field={{
          id: 'level',
          label: 'Level',
          type: 'enum',
          options: [
            { value: 1, label: 'One' },
            { value: 2, label: 'Two' },
          ],
        }}
        rule={{ id: '2', field: 'level', operator: 'in', value: [] }}
        onChange={change}
      />,
    );
    await userEvent.click(screen.getByRole('combobox', { name: 'Filter value for Level' }));
    await userEvent.click(screen.getByRole('option', { name: 'Two' }));
    expect(change).toHaveBeenLastCalledWith([2]);
  });
});

describe('composable boards and editors', () => {
  it('retains the open draft when persistence assigns an event id before resolving', async () => {
    let finish!: () => void;
    const save = vi.fn();
    function Editor() {
      const [open, setOpen] = React.useState(true);
      const [event, setEvent] = React.useState<{
        id: string;
        title: string;
        start: string;
        end: string;
      }>();
      return (
        <CalendarEventDialog
          open={open}
          onOpenChange={setOpen}
          event={event}
          selection={{
            start: '2026-10-05T09:00',
            end: '2026-10-05T10:00',
            allDay: false,
            view: 'week',
          }}
          onSave={async (draft) => {
            save(draft);
            setEvent({ id: 'new-id', ...draft });
            await new Promise<void>((resolve) => {
              finish = resolve;
            });
          }}
          renderFields={() => (
            <Field label="Location">
              <Input defaultValue="Studio" required />
            </Field>
          )}
        />
      );
    }
    render(<Editor />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Event title' }), 'Planning');
    await userEvent.type(screen.getByRole('textbox', { name: 'Location' }), ' North');
    await userEvent.click(screen.getByRole('button', { name: 'Save event' }));
    expect(screen.getByRole('textbox', { name: 'Location' })).toHaveValue('Studio North');
    expect(screen.getByRole('button', { name: 'Loading' })).toBeDisabled();
    expect(save).toHaveBeenCalledOnce();
    await act(async () => finish());
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('moves cards immutably, including empty lanes, and rejects disabled destinations', () => {
    const columns = [
      { id: 'a', title: 'A', items: [{ id: '1' }, { id: '2' }] },
      { id: 'b', title: 'B', items: [] as { id: string }[] },
      { id: 'c', title: 'C', items: [], disabled: true },
    ];
    const moved = moveKanbanItem(columns, '1', 'b', 99, (item) => item.id)!;
    expect(moved.columns[0].items).toEqual([{ id: '2' }]);
    expect(moved.columns[1].items).toEqual([{ id: '1' }]);
    expect(columns[0].items).toHaveLength(2);
    expect(moveKanbanItem(columns, '1', 'c', 0, (item) => item.id)).toBeUndefined();
  });

  it('supplies explicit Kanban moves that honor application permission checks', async () => {
    const change = vi.fn(),
      canMove = vi.fn(() => false);
    render(
      <KanbanBoard
        columns={[
          { id: 'a', title: 'Todo', items: [{ id: '1', title: 'Research' }] },
          { id: 'b', title: 'Done', items: [] },
        ]}
        getItemId={(item) => item.id}
        getItemLabel={(item) => item.title}
        renderCard={(item) => item.title}
        onColumnsChange={change}
        canMove={canMove}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Move Research' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Move to Done' }));
    expect(canMove).toHaveBeenCalledOnce();
    expect(change).not.toHaveBeenCalled();
  });

  it('makes sparse heatmaps keyboard reachable in RTL and read-only maps semantic', async () => {
    const choose = vi.fn();
    const data = [{ x: 'Mon', y: 'Design', value: 3 }];
    const { rerender } = render(
      <HeatmapChart
        data={data}
        xLabels={['Mon', 'Tue']}
        yLabels={['Design']}
        onCellClick={choose}
        dataTable={false}
        dir="rtl"
      />,
    );
    const cell = screen.getByRole('button', { name: 'Design, Mon: 3' });
    cell.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Design, Tue: No data' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(choose).not.toHaveBeenCalled();
    rerender(<HeatmapChart data={data} onCellClick={choose} dataTable={false} />);
    expect(screen.getByRole('button', { name: 'Design, Mon: 3' })).toHaveAttribute('tabindex', '0');
    rerender(<HeatmapChart data={data} dataTable={false} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('normalizes instant events, switches all-day intervals safely and serializes one save', async () => {
    const save = vi.fn(async (draft: CalendarEventDraft) => {
        void draft;
      }),
      close = vi.fn();
    render(
      <CalendarEventDialog
        open
        onOpenChange={close}
        timeZone="UTC"
        event={{
          id: 'a',
          title: 'Review',
          start: '2026-10-05T09:00:00Z',
          end: '2026-10-05T10:00:00Z',
        }}
        onSave={save}
      />,
    );
    expect(screen.getByLabelText('Start')).toHaveValue('2026-10-05T09:00');
    await userEvent.click(screen.getByRole('checkbox', { name: 'All day' }));
    expect(screen.getByRole('button', { name: 'End' })).toHaveTextContent('Oct 6');
    await userEvent.click(screen.getByRole('checkbox', { name: 'All day' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save event' }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0]).toMatchObject({
      start: '2026-10-05T09:00',
      end: '2026-10-05T10:00',
      allDay: false,
    });
    expect(close).toHaveBeenCalledWith(false);
  });

  it('validates required application fields through a custom event footer', async () => {
    const save = vi.fn();
    render(
      <CalendarEventDialog
        open
        onOpenChange={() => {}}
        event={{ id: 'a', title: 'Review', start: '2026-10-05T09:00', end: '2026-10-05T10:00' }}
        onSave={save}
        renderFields={() => (
          <Field label="Location">
            <Input required />
          </Field>
        )}
        renderFooter={(submit) => <Button onClick={submit}>Publish</Button>}
      />,
    );
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Publish' }));
    expect(save).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Location' }), {
      target: { value: 'Studio' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
  });
});
