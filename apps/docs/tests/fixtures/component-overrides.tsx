import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Button, PlainProvider, Switch, ThemeScope, tokensToStyle, useTheme } from '@plain/ui';
import '@plain/ui/styles.css';
import {
  InstanceOverridesExample,
  ScopedOverridesExample,
} from '../../src/docs/examples/ComponentOverridesExample';

const params = new URLSearchParams(location.search);
function Workspace() {
  const { setTheme } = useTheme();
  const ref = React.useRef<HTMLButtonElement>(null);
  const [submitted, setSubmitted] = React.useState('Not submitted');
  return (
    <main style={{ display: 'grid', gap: 24, padding: 16, maxWidth: 720 }}>
      <h1>Local component overrides</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Button type="button" onClick={() => setTheme({ radius: 24 })}>
          Round theme
        </Button>
        <Button type="button" onClick={() => setTheme({ radius: 0 })}>
          Square theme
        </Button>
      </div>
      <InstanceOverridesExample />
      <ScopedOverridesExample />
      <ThemeScope tokens={{ 'switch.thumb-radius': '3px' }}>
        <Switch aria-label="Inherited thumb override" defaultChecked />
        <Switch
          aria-label="Automatic thumb override"
          defaultChecked
          style={tokensToStyle({ 'switch.radius': '999px', 'switch.thumb-radius': 'initial' })}
        />
      </ThemeScope>
      <form
        aria-label="Native settings"
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(
            new FormData(event.currentTarget).get('alerts') === 'on' ? 'Alerts on' : 'Alerts off',
          );
        }}
      >
        <Switch
          ref={ref}
          aria-label="Form alerts"
          name="alerts"
          defaultChecked
          style={tokensToStyle({ 'switch.radius': '999px' })}
        />
        <Switch
          aria-label="Unavailable setting"
          name="unavailable"
          disabled
          defaultChecked
          style={tokensToStyle({ 'switch.radius': '0px' })}
        />
        <Button type="button" onClick={() => ref.current?.focus()}>
          Focus local switch
        </Button>
        <Button type="submit">Save settings</Button>
        <output aria-label="Saved settings">{submitted}</output>
      </form>
    </main>
  );
}
createRoot(document.getElementById('root')!).render(
  <PlainProvider
    persist={false}
    dir={params.get('dir') === 'rtl' ? 'rtl' : 'ltr'}
    theme={{ radius: 6, mode: params.get('theme') === 'dark' ? 'dark' : 'light', motion: 'none' }}
  >
    <Workspace />
  </PlainProvider>,
);
