import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { FileCode, Folder } from 'lucide-react';
import {
  PlainProvider,
  ThemeScope,
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemTrailing,
  ItemActions,
  Button,
  Checkbox,
  VirtualList,
} from '@plain/ui';
import '@plain/ui/styles.css';
const query = new URLSearchParams(location.search);
const virtualFiles = Array.from({ length: 10000 }, (_, index) => ({
  id: String(index),
  name: `Virtual file ${index + 1}`,
}));
function Fixture() {
  const [file, setFile] = React.useState('index.ts');
  const [toggles, setToggles] = React.useState(0);
  const [action, setAction] = React.useState(0);
  const [blocked, setBlocked] = React.useState(true);
  const [links, setLinks] = React.useState(0);
  const [checked, setChecked] = React.useState(false);
  const [picked, setPicked] = React.useState('');
  const link = React.useRef<HTMLAnchorElement>(null);
  return (
    <main style={{ padding: 16, maxWidth: 640, margin: '0 auto', display: 'grid', gap: 24 }}>
      <h1>Reusable Item</h1>
      <section aria-label="Files" style={{ display: 'grid', gap: 4 }}>
        {['button.tsx', 'theme.css', 'index.ts'].map((name) => (
          <Item key={name} selected={file === name} onClick={() => setFile(name)}>
            <ItemMedia>
              <FileCode aria-hidden="true" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{name}</ItemTitle>
            </ItemContent>
          </Item>
        ))}
        <output aria-label="Current file">{file}</output>
      </section>
      <Item defaultSelected onSelectedChange={() => setToggles((count) => count + 1)}>
        Toggle favorite
      </Item>
      <output aria-label="Selection changes">{toggles}</output>
      <Item onClick={() => setAction((count) => count + 1)}>Create file</Item>
      <Item
        disabled
        selected
        tooltip={{ content: 'File unavailable while syncing', delayDuration: 0 }}
      >
        Unavailable file
      </Item>
      <section aria-label="Composed links" style={{ display: 'grid', gap: 8 }}>
        <Item asChild selected disabled={blocked} ref={link}>
          <a href="#details" onClick={() => setLinks((count) => count + 1)}>
            Project details
          </a>
        </Item>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button onClick={() => setBlocked((value) => !value)}>
            {blocked ? 'Enable link' : 'Disable link'}
          </Button>
          <Button onClick={() => link.current?.focus()}>Focus link</Button>
        </div>
        <output aria-label="Link activations">{links}</output>
      </section>
      <Item interactive={false} selected={checked} data-testid="independent-row">
        <ItemMedia>
          <Checkbox
            aria-label="Keep file offline"
            checked={checked}
            onCheckedChange={(value) => setChecked(value === true)}
          />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Workspace files</ItemTitle>
          <ItemDescription>Independent controls in a content row.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" onClick={() => setAction((count) => count + 1)}>
            Open files
          </Button>
        </ItemActions>
      </Item>
      <output aria-label="Action count">{action}</output>
      <Item data-testid="long-item">
        <ItemMedia>
          <Folder aria-hidden="true" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{'very-long-file-name'.repeat(8)}.tsx</ItemTitle>
          <ItemDescription>
            Supporting text can wrap naturally without widening the document.
          </ItemDescription>
        </ItemContent>
        <ItemTrailing>{'metadata'.repeat(5)}</ItemTrailing>
      </Item>
      <Item tooltip={{ content: 'Open file tools', delayDuration: 0 }} aria-label="File tools">
        <FileCode aria-hidden="true" />
      </Item>
      <ThemeScope
        mode="light"
        tokens={{
          'item.selected': '#dcebd9',
          'item.selected-foreground': '#202321',
          'item.muted-foreground': '#34423b',
          'item.radius': '12px',
        }}
      >
        <Item selected data-testid="scoped-item">
          <ItemContent>
            <ItemTitle>Scoped item</ItemTitle>
            <ItemDescription>Local surface and radius.</ItemDescription>
          </ItemContent>
        </Item>
      </ThemeScope>
      <section aria-label="Virtual files" style={{ minWidth: 0 }}>
        <VirtualList
          aria-label="Large file collection"
          items={virtualFiles}
          getItemKey={(item) => item.id}
          height={240}
          estimateSize={40}
          renderItem={(item) => (
            <Item selected={picked === item.id} onClick={() => setPicked(item.id)}>
              {item.name}
            </Item>
          )}
        />
        <output aria-label="Virtual selection">{picked}</output>
      </section>
      <div id="details">Project details destination</div>
    </main>
  );
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PlainProvider
      persist={false}
      dir={query.get('dir') === 'rtl' ? 'rtl' : 'ltr'}
      theme={{
        mode: query.get('theme') === 'dark' ? 'dark' : 'light',
        motion: query.has('reduced') ? 'none' : 'system',
      }}
    >
      <Fixture />
    </PlainProvider>
  </React.StrictMode>,
);
