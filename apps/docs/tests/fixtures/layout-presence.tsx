import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
  PlainProvider,
  Box,
  Stack,
  Inline,
  Grid,
  Masonry,
  Card,
  ScrollArea,
  LayoutPresence,
  Resizable,
  ResizablePanel,
  SidebarProvider,
  SidebarMenu,
  AppShell,
  Table,
  TableBody,
  type LayoutPresenceOptions,
  type MotionPolicy,
} from '@plain/ui';
import '@plain/ui/styles.css';

const query = new URLSearchParams(location.search);
function Fixture() {
  const count = Number(query.get('count') ?? 3);
  const [ids, setIds] = React.useState(Array.from({ length: count }, (_, index) => String(index)));
  const [policy, setPolicy] = React.useState<MotionPolicy>('system');
  const [submitted, setSubmitted] = React.useState('{}');
  const next = React.useRef(count);
  const type = query.get('container') ?? 'grid';
  const presence: LayoutPresenceOptions = {
    initial: query.get('initial') !== 'false',
    preset: (query.get('preset') ?? 'fade') as LayoutPresenceOptions['preset'],
    duration: Number(query.get('duration') ?? 300),
    exitDuration: Number(query.get('duration') ?? 300),
    layout: query.has('layout'),
    maxItems: Number(query.get('max') ?? 50),
    stagger: Number(query.get('stagger') ?? 0),
  };
  const items = ids.map((id) => {
    const body = (
      <>
        <label>
          Project {id}
          <input aria-label={`Project ${id}`} name={`project-${id}`} defaultValue={`Draft ${id}`} />
        </label>
        <button
          type="button"
          onClick={() => setIds((current) => current.filter((item) => item !== id))}
        >
          Remove {id}
        </button>
      </>
    );
    const props = {
      'data-testid': `item-${id}`,
      style: {
        minWidth: 0,
        padding: 16,
        border: '1px solid var(--ui-border)',
        background: 'var(--ui-surface)',
        borderRadius: 6,
      },
    };
    return type === 'table' ? (
      <tr key={id} {...props}>
        <td>{body}</td>
      </tr>
    ) : type === 'list' || type === 'sidebar' ? (
      <li key={id} {...props}>
        {body}
      </li>
    ) : (
      <article key={id} {...props}>
        {body}
      </article>
    );
  });
  const props = { presence, 'data-testid': 'presence-scope' };
  const scope =
    type === 'stack' ? (
      <Stack {...props}>{items}</Stack>
    ) : type === 'inline' ? (
      <Inline {...props}>{items}</Inline>
    ) : type === 'masonry' ? (
      <Masonry {...props} columns={{ base: 1, sm: 2 }}>
        {items}
      </Masonry>
    ) : type === 'card' ? (
      <Card {...props}>{items}</Card>
    ) : type === 'scroll' ? (
      <ScrollArea {...props} style={{ height: 320 }}>
        {items}
      </ScrollArea>
    ) : type === 'list' ? (
      <LayoutPresence {...props} asChild>
        <ul style={{ padding: 0, listStyle: 'none' }}>{items}</ul>
      </LayoutPresence>
    ) : type === 'sidebar' ? (
      <SidebarProvider shortcut={false}>
        <SidebarMenu {...props}>{items}</SidebarMenu>
      </SidebarProvider>
    ) : type === 'resizable' ? (
      <Resizable id="presence-scope" style={{ height: 320 }}>
        <ResizablePanel id="main" presence={presence}>
          {items}
        </ResizablePanel>
      </Resizable>
    ) : type === 'table' ? (
      <Table aria-label="Projects">
        <TableBody {...props}>{items}</TableBody>
      </Table>
    ) : type === 'shell' ? (
      <AppShell {...props}>{items}</AppShell>
    ) : (
      <Grid {...props} columns={{ base: 1, sm: 2, lg: 3 }}>
        {items}
      </Grid>
    );
  return (
    <PlainProvider
      persist={false}
      dir={query.get('dir') === 'rtl' ? 'rtl' : 'ltr'}
      theme={{ mode: query.get('theme') === 'dark' ? 'dark' : 'light', motion: policy }}
    >
      <Box padding={2} style={{ maxWidth: 1000, marginInline: 'auto' }}>
        <h1>Layout lifecycle</h1>
        <Inline gap={1}>
          <button
            type="button"
            onClick={() => {
              const id = String(next.current++);
              setIds((current) => [...current, id]);
            }}
          >
            Add
          </button>
          <button type="button" onClick={() => setIds((current) => [...current].reverse())}>
            Reverse
          </button>
          <button
            type="button"
            onClick={() => setIds((current) => current.filter((id) => id !== '1'))}
          >
            Remove chosen
          </button>
          <button
            type="button"
            onClick={() =>
              setIds((current) => (current.includes('1') ? current : [...current, '1']))
            }
          >
            Undo
          </button>
          <button type="button" onClick={() => setIds([])}>
            Clear
          </button>
          <button type="button" onClick={() => setPolicy('none')}>
            Disable motion
          </button>
        </Inline>
        <form
          aria-label="Projects"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))));
          }}
        >
          {scope}
          <button type="submit">Submit</button>
        </form>
        <output data-testid="submitted">{submitted}</output>
      </Box>
    </PlainProvider>
  );
}
createRoot(document.getElementById('root')!).render(<Fixture />);
