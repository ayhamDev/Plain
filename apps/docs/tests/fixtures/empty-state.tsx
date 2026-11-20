import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Folder } from 'lucide-react';
import {
  PlainProvider,
  EmptyState,
  EmptyStateMedia,
  EmptyStateContent,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
  EmptyStateFooter,
  Button,
  Field,
  Input,
} from '@plain/ui';
import '@plain/ui/styles.css';

const params = new URLSearchParams(location.search);
function Fixture() {
  const [message, setMessage] = React.useState('Choose how to get started.');
  return (
    <PlainProvider
      persist={false}
      dir={params.get('dir') === 'rtl' ? 'rtl' : 'ltr'}
      theme={{ mode: params.get('theme') === 'dark' ? 'dark' : 'light' }}
    >
      <main style={{ padding: 16 }}>
        <h1 style={{ fontSize: 24, marginBottom: 24 }}>Project workspace</h1>
        <EmptyState
          role="region"
          aria-labelledby="empty-heading"
          variant="outlined"
          size="sm"
          align="start"
          orientation={params.get('orientation') === 'horizontal' ? 'horizontal' : 'vertical'}
          style={{ maxWidth: 720, marginInline: 'auto' }}
        >
          <EmptyStateMedia>
            <div
              style={{
                width: 120,
                height: 80,
                maxWidth: '100%',
                display: 'grid',
                placeItems: 'center',
                background: 'var(--ui-muted)',
                borderRadius: 'var(--ui-radius)',
              }}
            >
              <Folder size={32} aria-hidden="true" />
            </div>
          </EmptyStateMedia>
          <EmptyStateContent>
            <EmptyStateTitle asChild>
              <h2 id="empty-heading">Room for your next idea and your team's shared work</h2>
            </EmptyStateTitle>
            <EmptyStateDescription asChild>
              <div>
                <p>Bring your existing work, or start a new project.</p>
                <ul style={{ paddingInlineStart: 20 }}>
                  <li>Invite your team</li>
                  <li>Share files and plan together</li>
                </ul>
              </div>
            </EmptyStateDescription>
            <form
              style={{ display: 'grid', gap: 8, maxWidth: '100%', width: 320 }}
              onSubmit={(event) => {
                event.preventDefault();
                setMessage(String(new FormData(event.currentTarget).get('project')) + ' created.');
              }}
            >
              <Field label="Project name">
                <Input name="project" required />
              </Field>
              <Button type="submit">Create named project</Button>
            </form>
            <EmptyStateActions layout={params.get('layout') === 'column' ? 'column' : 'row'}>
              <Button onClick={() => setMessage('Blank project created.')}>
                Create a new project for all the people in your workspace
              </Button>
              <Button variant="secondary" onClick={() => setMessage('Import selected.')}>
                Import existing projects and shared files
              </Button>
              <Button variant="outline" asChild>
                <a href="#guide">Documentation for your workspace</a>
              </Button>
              <Button variant="ghost" onClick={() => setMessage('Invite selected.')}>
                Invite a teammate
              </Button>
              <Button variant="ghost" disabled>
                Unavailable action
              </Button>
            </EmptyStateActions>
            <EmptyStateFooter>
              <span role="status">{message}</span>
              <a href="#guide">Read the guide</a>
            </EmptyStateFooter>
          </EmptyStateContent>
        </EmptyState>
        <section id="guide" style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 18 }}>Getting started guide</h2>
          <p>Choose the actions and content that fit your application.</p>
        </section>
      </main>
    </PlainProvider>
  );
}
const root = createRoot(document.getElementById('root')!);
root.render(<Fixture />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
