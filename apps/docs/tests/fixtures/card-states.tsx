import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
  PlainProvider,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
} from '@plain/ui';
import '@plain/ui/styles.css';

const params = new URLSearchParams(location.search);
function Fixture() {
  const [selected, setSelected] = React.useState(false);
  const [opened, setOpened] = React.useState(false);
  return (
    <PlainProvider
      persist={false}
      dir={params.get('dir') === 'rtl' ? 'rtl' : 'ltr'}
      theme={{
        mode: params.get('theme') === 'dark' ? 'dark' : 'light',
        motion: params.get('motion') === 'none' ? 'none' : 'system',
      }}
    >
      <main style={{ padding: 24, maxWidth: 480, marginInline: 'auto' }}>
        <h1 style={{ fontSize: 20, marginBlockEnd: 16 }}>Project cards</h1>
        <div style={{ display: 'grid', gap: 16 }}>
          {(['ghost', 'filled', 'outlined', 'elevated'] as const).map((variant) => (
            <Card
              key={variant}
              asChild
              variant={variant}
              interactive
              selected={selected}
              data-testid={variant}
            >
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => setSelected((value) => !value)}
                style={{ padding: 24, textAlign: 'start' }}
              >
                <span style={{ display: 'block', fontWeight: 600 }}>Website redesign</span>
                <span style={{ display: 'block' }}>Design, build, and review.</span>
                <span style={{ display: 'block', fontSize: 14, marginBlockStart: 16 }}>
                  {variant} · {selected ? 'Selected' : 'Select project'}
                </span>
              </button>
            </Card>
          ))}
          {(['ghost', 'filled', 'outlined', 'elevated'] as const).map((variant) => (
            <Card
              key={variant}
              variant={variant}
              interactive
              selected={selected}
              data-testid={`details-${variant}`}
            >
              <CardHeader>
                <CardTitle>Website redesign</CardTitle>
                <CardDescription>Design, build, and review.</CardDescription>
              </CardHeader>
              <CardContent>Project workspace</CardContent>
            </Card>
          ))}
          <Card variant="ghost" interactive asChild data-testid="disabled">
            <button type="button" disabled style={{ padding: 24 }}>
              Archived project
            </button>
          </Card>
          <Card
            variant="ghost"
            interactive
            data-testid="nested"
            style={
              {
                '--ui-card-background': '#173a55',
                '--ui-card-foreground': '#ffffff',
              } as React.CSSProperties
            }
          >
            <CardHeader>
              <CardTitle>Project actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" onClick={() => setOpened(true)}>
                Open project
              </Button>
              {opened && <p role="status">Project opened</p>}
            </CardContent>
          </Card>
          <Card asChild interactive unstyled data-testid="unstyled">
            <a href="#project-details">App owned card</a>
          </Card>
          <section id="project-details" aria-label="Project details">
            Project workspace
          </section>
        </div>
      </main>
    </PlainProvider>
  );
}
createRoot(document.getElementById('root')!).render(<Fixture />);
