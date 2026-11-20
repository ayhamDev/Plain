import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
  PlainProvider,
  List,
  ListItemTitle,
  ListItemDescription,
  Avatar,
  AvatarFallback,
  Button,
  DataTable,
  type DataTableColumn,
} from '@plain/ui';
import '@plain/ui/styles.css';

const params = new URLSearchParams(location.search);
const items = [
  {
    id: 'review',
    title: 'Design review notes ' + 'Workspace'.repeat(8),
    description: 'Notes from the team about navigation, accessibility and the next release.',
    initials: 'SC',
  },
  {
    id: 'locked',
    title: 'Read only item',
    description: 'This item cannot be selected.',
    initials: 'AM',
  },
  {
    id: 'release',
    title: 'Release checklist',
    description: 'Package verification and documentation.',
    initials: 'JW',
  },
];
type Record = { id: number; name: string };
const columns: DataTableColumn<Record>[] = Array.from({ length: 12 }, (_, i) => ({
  id: `field${i}`,
  accessorFn: (row) => row.id + i,
  header: `Column ${i + 1}: ` + 'LongColumnLabel'.repeat(4),
}));
function Fixture() {
  return (
    <PlainProvider
      persist={false}
      unstyled={params.has('unstyled')}
      dir={params.get('dir') === 'rtl' ? 'rtl' : 'ltr'}
      theme={{ mode: params.get('theme') === 'dark' ? 'dark' : 'light' }}
    >
      <main style={{ padding: 16 }}>
        <h1 style={{ fontSize: 24, marginBottom: 24 }}>Collection workspace</h1>
        {params.get('view') === 'table' ? (
          <DataTable
            data={[
              { id: 1, name: 'Review' },
              { id: 2, name: 'Release' },
            ]}
            columns={columns}
            tableOptions={{
              initialState: { sorting: columns.map((_, i) => ({ id: `field${i}`, desc: false })) },
            }}
            filterPresentation="sheet"
            searchable={false}
            filterable={false}
            columnControls={false}
            pagination={false}
          />
        ) : (
          <List
            items={items}
            getItemKey={(item) => item.id}
            getItemLabel={(item) => item.id}
            getItemDisabled={(item) => item.id === 'locked'}
            selectable
            aria-label="Team discussions"
            renderLeading={(item) => (
              <Avatar>
                <AvatarFallback>{item.initials}</AvatarFallback>
              </Avatar>
            )}
            renderItem={(item) => (
              <>
                <ListItemTitle>{item.title}</ListItemTitle>
                <ListItemDescription>{item.description}</ListItemDescription>
              </>
            )}
            renderTrailing={() => <span>{'1234567890'.repeat(5)}</span>}
            selectionActions={(_keys, clear) => (
              <Button onClick={clear}>
                Archive the selected discussions and clear this selection
              </Button>
            )}
          />
        )}
      </main>
    </PlainProvider>
  );
}
const root = createRoot(document.getElementById('root')!);
root.render(<Fixture />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
