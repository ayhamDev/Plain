import * as React from 'react';
import { createRoot } from 'react-dom/client';
import * as UI from '@plain/ui';
import '@plain/ui/styles.css';

const params = new URLSearchParams(location.search);
const variants = ['outlined', 'filled', 'ghost', 'contrast'] as const;
function Fixture() {
  const [saved, setSaved] = React.useState('{}');
  return (
    <main style={{ padding: 24, maxWidth: 720, marginInline: 'auto' }}>
      <h1>Input focus</h1>
      <form
        aria-label="Focus examples"
        style={{ display: 'grid', gap: 24 }}
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))));
        }}
      >
        <UI.Button type="button">Start keyboard navigation</UI.Button>
        {variants.map((variant) => (
          <UI.Field key={variant} label={`Input ${variant}`}>
            <UI.Input variant={variant} name={`input-${variant}`} defaultValue="Design review" />
          </UI.Field>
        ))}
        {variants.map((variant) => (
          <UI.Field key={variant} label={`Textarea ${variant}`}>
            <UI.Textarea variant={variant} name={`notes-${variant}`} defaultValue="Review notes" />
          </UI.Field>
        ))}
        <UI.Select defaultValue="pro" name="plan">
          <UI.Field label="Plan">
            <UI.SelectTrigger>
              <UI.SelectValue />
            </UI.SelectTrigger>
          </UI.Field>
          <UI.SelectContent>
            <UI.SelectItem value="pro">Professional</UI.SelectItem>
            <UI.SelectItem value="team">Team</UI.SelectItem>
          </UI.SelectContent>
        </UI.Select>
        <UI.Field label="Seats">
          <UI.NumberInput name="seats" defaultValue={5} />
        </UI.Field>
        <UI.Field label="Invalid field" error="Enter a project name.">
          <UI.Input />
        </UI.Field>
        <UI.Field label="Read only field">
          <UI.Input readOnly defaultValue="Existing project" />
        </UI.Field>
        <UI.Field label="Disabled field">
          <UI.Input disabled defaultValue="Unavailable" />
        </UI.Field>
        <UI.ThemeScope
          tokens={{
            'input.border': '#99734c',
            'input.focus': '#007e80',
            'select.border': '#815cb1',
            'select.focus': '#007e80',
          }}
        >
          <div style={{ display: 'grid', gap: 24 }}>
            <UI.Field label="Local input">
              <UI.Input defaultValue="Local appearance" />
            </UI.Field>
            <UI.Select defaultValue="review">
              <UI.Field label="Local select">
                <UI.SelectTrigger>
                  <UI.SelectValue />
                </UI.SelectTrigger>
              </UI.Field>
              <UI.SelectContent>
                <UI.SelectItem value="review">In review</UI.SelectItem>
              </UI.SelectContent>
            </UI.Select>
          </div>
        </UI.ThemeScope>
        <UI.Button type="submit">Save fields</UI.Button>
        <output aria-label="Saved fields">{saved}</output>
      </form>
    </main>
  );
}
const root = createRoot(document.getElementById('root')!);
root.render(
  <UI.PlainProvider
    persist={false}
    dir={params.get('dir') === 'rtl' ? 'rtl' : 'ltr'}
    theme={{
      mode: params.get('theme') === 'dark' ? 'dark' : 'light',
      motion: 'none',
      borders: params.has('borderless') ? 'none' : 'subtle',
    }}
  >
    <Fixture />
  </UI.PlainProvider>,
);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
