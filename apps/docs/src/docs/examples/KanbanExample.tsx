import * as React from 'react';
import { KanbanBoard, type KanbanColumn } from '@plain/ui/kanban';
import { Badge, Small, Strong, Stack } from '@plain/ui';

type Item = { id: string; title: string; team: string; due: string };
const initial: KanbanColumn<Item>[] = [
  {
    id: 'todo',
    title: 'To do',
    items: [
      { id: 'a', title: 'Customer research', team: 'Design', due: 'Oct 08' },
      { id: 'b', title: 'Navigation review', team: 'Engineering', due: 'Oct 12' },
    ],
  },
  {
    id: 'doing',
    title: 'In progress',
    items: [{ id: 'c', title: 'Mobile experience', team: 'Design', due: 'Oct 16' }],
  },
  {
    id: 'done',
    title: 'Complete',
    items: [{ id: 'd', title: 'Token audit', team: 'Engineering', due: 'Oct 02' }],
  },
];
export default function KanbanExample({
  state = {},
}: {
  state?: Record<string, string | number | boolean>;
}) {
  const [columns, setColumns] = React.useState(initial);
  return (
    <KanbanBoard
      style={{ width: '100%' }}
      columns={columns}
      disabled={!!state.disabled}
      columnWidth={Number(state.columnWidth ?? 252)}
      onColumnsChange={setColumns}
      getItemId={(item) => item.id}
      getItemLabel={(item) => item.title}
      renderCard={(item) => (
        <Stack gap={1}>
          <Strong>{item.title}</Strong>
          <Badge variant="outline" style={{ alignSelf: 'start' }}>
            {item.team}
          </Badge>
          <Small tone="muted">{item.due}</Small>
        </Stack>
      )}
    />
  );
}
