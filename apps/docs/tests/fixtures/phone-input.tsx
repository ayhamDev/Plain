import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
  PlainProvider,
  ThemeScope,
  Field,
  PhoneInput,
  Button,
  Input,
  type InputVariant,
} from '@plain/ui';
import { PhoneInput as ModularPhoneInput } from '@plain/ui/phone-input';
import '@plain/ui/styles.css';

const query = new URLSearchParams(location.search);
const rtl = query.get('dir') === 'rtl';
const variants: InputVariant[] = ['outlined', 'filled', 'ghost', 'contrast'];
const sample = '+12025550123';
function Fixture() {
  const [number, setNumber] = React.useState(sample);
  const [submitted, setSubmitted] = React.useState('');
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <main
      style={{ maxWidth: 720, padding: 24, margin: 'auto', display: 'grid', gap: 24, minWidth: 0 }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Phone input</h1>
      <form
        aria-label="Contact"
        style={{ display: 'grid', gap: 16 }}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(String(new FormData(event.currentTarget).get('phone')));
        }}
      >
        <Field label="Contact phone" description="Include your country calling code.">
          <PhoneInput ref={ref} name="phone" defaultCountry="US" defaultValue={sample} required />
        </Field>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button type="submit">Save contact</Button>
          <Button type="reset" variant="outline">
            Reset
          </Button>
          <Button type="button" variant="ghost" onClick={() => ref.current?.focus()}>
            Focus phone
          </Button>
        </div>
        <output aria-label="Submitted phone">{submitted || 'Not submitted'}</output>
      </form>
      {variants.map((variant) => (
        <div key={variant} data-testid={`phone-${variant}`}>
          <Field label={`${variant} phone`}>
            <PhoneInput variant={variant} defaultCountry="GB" defaultValue="+442079460018" />
          </Field>
        </div>
      ))}
      <Field label="National phone">
        <PhoneInput defaultCountry="US" international={false} defaultValue={sample} />
      </Field>
      <Field label="Controlled phone">
        <PhoneInput
          value={number}
          onValueChange={setNumber}
          defaultCountry="US"
          tooltip="Use an international number"
        />
      </Field>
      <output aria-label="Controlled value">{number}</output>
      <Button variant="outline" onClick={() => setNumber('')}>
        Clear controlled
      </Button>
      <Field label="Fixed phone">
        <PhoneInput value={sample} defaultCountry="US" />
      </Field>
      <Field label="Read only">
        <PhoneInput readOnly defaultValue={sample} />
      </Field>
      <Field label="Disabled">
        <PhoneInput disabled defaultValue={sample} />
      </Field>
      <Field label="Strict validation">
        <PhoneInput defaultCountry="US" defaultValue="+12223333333" validation="valid" />
      </Field>
      <Field label="Standard input">
        <Input defaultValue="Same control sizing" />
      </Field>
      <ThemeScope
        data-testid="local-scope"
        mode="dark"
        tokens={{ 'input.radius': '16px', 'input.height': '48px' }}
        style={{ padding: 16, background: 'var(--ui-surface)', color: 'var(--ui-foreground)' }}
      >
        <Field label="Scoped phone">
          <ModularPhoneInput defaultCountry="EG" defaultValue="+201001234567" />
        </Field>
      </ThemeScope>
    </main>
  );
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PlainProvider
      persist={false}
      locale={rtl ? 'ar' : 'en'}
      dir={rtl ? 'rtl' : 'ltr'}
      theme={{
        mode: query.get('mode') === 'dark' ? 'dark' : 'light',
        motion: query.get('motion') === 'none' ? 'none' : 'system',
      }}
    >
      <Fixture />
    </PlainProvider>
  </React.StrictMode>,
);
