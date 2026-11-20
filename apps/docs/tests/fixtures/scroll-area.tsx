import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { PlainProvider, ScrollArea, Button, type ScrollAreaFadeEdge } from '@plain/ui';
import '@plain/ui/styles.css';

const params = new URLSearchParams(location.search);
const dir = params.get('dir') === 'rtl' ? 'rtl' : 'ltr';
const orientation =
  params.get('axis') === 'vertical'
    ? 'vertical'
    : params.get('axis') === 'horizontal'
      ? 'horizontal'
      : 'both';
function Fixture() {
  const [count, setCount] = React.useState(20);
  const [wide, setWide] = React.useState(true);
  return (
    <PlainProvider
      persist={false}
      dir={dir}
      theme={{
        mode: params.get('theme') === 'dark' ? 'dark' : 'light',
        motion: params.get('motion') === 'none' ? 'none' : 'system',
      }}
    >
      <main style={{ padding: 16 }}>
        <h1 style={{ fontSize: 20, marginBottom: 16 }}>Projects</h1>
        <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Button onClick={() => setCount(2)}>Remove projects</Button>
          <Button onClick={() => setCount(30)}>Add projects</Button>
          <Button onClick={() => setWide((value) => !value)}>Resize content</Button>
        </div>
        <ScrollArea
          aria-label="Projects"
          orientation={orientation}
          scrollbarVisibility="always"
          scrollbarExpandOnHover={params.get('expand') !== 'off'}
          scrollbarSize={Number(params.get('size') ?? 6)}
          scrollbarHoverSize={Number(params.get('hoverSize') ?? 12)}
          fadeEdges={
            params.get('fade') === 'off'
              ? false
              : {
                  mode: params.get('fade') === 'always' ? 'always' : 'scroll',
                  size: Number(params.get('fadeSize') ?? 32),
                  intensity: Number(params.get('intensity') ?? 1),
                  edges: params.has('edges')
                    ? (params.get('edges')!.split(',') as ScrollAreaFadeEdge[])
                    : undefined,
                }
          }
          style={{
            height: 224,
            width: '100%',
            maxWidth: 360,
            border: '1px solid var(--ui-border)',
            borderRadius: 'var(--ui-radius)',
            background: 'var(--ui-background)',
          }}
        >
          <div
            style={{
              width: orientation === 'vertical' || !wide ? '100%' : 720,
              background: 'var(--ui-foreground)',
              color: 'var(--ui-background)',
            }}
          >
            {Array.from({ length: orientation === 'horizontal' ? 2 : count }, (_, index) => (
              <div key={index} style={{ height: 64, padding: 16 }}>
                {index === 5 ? <Button>Project details</Button> : `Project ${index + 1}`}
              </div>
            ))}
          </div>
        </ScrollArea>
      </main>
    </PlainProvider>
  );
}
const root = createRoot(document.getElementById('root')!);
root.render(<Fixture />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
