import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
  PlainProvider,
  Button,
  Field,
  TimePicker,
  type TimePickerMode,
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
  const [changes, setChanges] = React.useState<string[]>([]);
  return (
    <PlainProvider
      persist={false}
      dir={params.get('dir') === 'rtl' ? 'rtl' : 'ltr'}
      theme={{
        mode: params.get('theme') === 'dark' ? 'dark' : 'light',
        motion: params.get('motion') === 'system' ? 'system' : 'none',
      }}
      tokens={
        params.has('custom')
          ? { 'temporal.wheel-row-height': '56px', 'temporal.wheel-selection': '#dbeafe' }
          : undefined
      }
    >
      <main>
        <h1 style={{ padding: 16, fontSize: 20 }}>Placement workspace</h1>
        {params.get('view') === 'popover' ? (
          <Options />
        ) : (
          <div style={{ ...position, width: 'min(280px, calc(100vw - 32px))' }}>
            <Field label="Start time">
              <TimePicker
                defaultValue={params.get('value') ?? (params.has('seconds') ? '09:15:30' : '09:15')}
                hourCycle={params.has('twelve') ? 'h12' : 'h23'}
                hour12={params.has('hour12') ? params.get('hour12') !== 'false' : undefined}
                editable={params.has('editable')}
                pickerMode={(params.get('mode') ?? 'auto') as TimePickerMode}
                minuteStep={params.has('minuteStep') ? Number(params.get('minuteStep')) : undefined}
                onValueChange={(value) => setChanges((previous) => [...previous, value ?? ''])}
                popoverProps={{
                  side: params.get('side') === 'top' ? 'top' : 'bottom',
                  align: params.get('align') === 'end' ? 'end' : 'start',
                }}
                name="start"
                min={params.get('min') ?? undefined}
                max={params.get('max') ?? undefined}
              />
            </Field>
          </div>
        )}
        <output hidden data-testid="time-changes">
          {JSON.stringify(changes)}
        </output>
      </main>
    </PlainProvider>
  );
}
const root = createRoot(document.getElementById('root')!);
root.render(<Fixture />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
