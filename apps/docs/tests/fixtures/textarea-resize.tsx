import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { PlainProvider, Textarea, Field, Button, type TextareaProps } from '@plain/ui';
import '@plain/ui/styles.css';

const query = new URLSearchParams(location.search);
const modes = ['none', 'vertical', 'horizontal', 'both'] as const;
function Fixture() {
  const [resize, setResize] = React.useState<TextareaProps['resize']>('vertical');
  const [submitted, setSubmitted] = React.useState('');
  const ref = React.useRef<HTMLTextAreaElement>(null);
  return (
    <main style={{ padding: 16, maxWidth: 480 }}>
      <h1>Textarea resizing</h1>
      <form
        aria-label="Notes"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))));
        }}
        style={{ display: 'grid', gap: 24 }}
      >
        {modes.map((mode, index) => (
          <Field key={mode} label={mode}>
            <Textarea
              resize={mode}
              name={mode}
              defaultValue="A few notes for your team"
              variant={(['outlined', 'filled', 'ghost', 'contrast'] as const)[index]}
              style={{ width: 220, maxHeight: 320 }}
            />
          </Field>
        ))}
        <Field label="Editable notes">
          <Textarea ref={ref} name="editable" resize={resize} defaultValue="Draft notes" />
        </Field>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            type="button"
            onClick={() => {
              setResize('none');
              ref.current?.focus();
            }}
          >
            Disable resizing
          </Button>
          <Button type="button" onClick={() => setResize('both')}>
            Enable both directions
          </Button>
          <Button type="submit">Save notes</Button>
        </div>
        <output aria-label="Saved notes">{submitted}</output>
      </form>
    </main>
  );
}
createRoot(document.getElementById('root')!).render(
  <PlainProvider
    persist={false}
    dir={query.get('dir') === 'rtl' ? 'rtl' : 'ltr'}
    theme={{ mode: query.get('theme') === 'dark' ? 'dark' : 'light', motion: 'none' }}
  >
    <Fixture />
  </PlainProvider>,
);
