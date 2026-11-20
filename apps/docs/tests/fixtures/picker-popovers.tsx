import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
  PlainProvider,
  Button,
  Field,
  TimePicker,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
} from '@plain/ui';
import '@plain/ui/styles.css';

const params = new URLSearchParams(location.search);
const corner = params.get('corner') ?? 'bottom-end';
const position: React.CSSProperties = {
  position: 'fixed',
  [corner.startsWith('top') ? 'top' : 'bottom']: 16,
  [corner.endsWith('start') ? 'insetInlineStart' : 'insetInlineEnd']: 16,
};
function Options() {
  const [boundary, setBoundary] = React.useState<HTMLElement | null>(null);
  const bounded = params.has('bounded');
  const side = params.get('side');
  return (
    <section
      ref={setBoundary}
      data-testid="boundary"
      style={
        bounded
          ? { position: 'fixed', inset: '40px 16px auto', maxWidth: 280, height: 240 }
          : undefined
      }
    >
      <div style={bounded ? { position: 'absolute', bottom: 16, insetInlineEnd: 16 } : position}>
        <Popover>
          <PopoverTrigger asChild>
            <Button>Options</Button>
          </PopoverTrigger>
          <PopoverContent
            aria-label="Long options"
            side={side === 'top' || side === 'left' || side === 'right' ? side : 'bottom'}
            collisionBoundary={bounded ? boundary : undefined}
            style={{ width: 640 }}
          >
            <Button variant="ghost">First action</Button>
            {Array.from({ length: 30 }, (_, i) => (
              <p key={i}>Option {i + 1}: Review the workspace preferences and configuration.</p>
            ))}
            <PopoverClose asChild>
              <Button>Last action</Button>
            </PopoverClose>
          </PopoverContent>
        </Popover>
      </div>
    </section>
  );
}
function Fixture() {
  return (
    <PlainProvider
      persist={false}
      dir={params.get('dir') === 'rtl' ? 'rtl' : 'ltr'}
      theme={{ mode: params.get('theme') === 'dark' ? 'dark' : 'light', motion: 'none' }}
    >
      <main>
        <h1 style={{ padding: 16, fontSize: 20 }}>Placement workspace</h1>
        {params.get('view') === 'popover' ? (
          <Options />
        ) : (
          <div style={{ ...position, width: 'min(280px, calc(100vw - 32px))' }}>
            <Field label="Start time">
              <TimePicker
                defaultValue={params.has('seconds') ? '09:15:30' : '09:15'}
                hourCycle={params.has('twelve') ? 'h12' : 'h23'}
              />
            </Field>
          </div>
        )}
      </main>
    </PlainProvider>
  );
}
const root = createRoot(document.getElementById('root')!);
root.render(<Fixture />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
