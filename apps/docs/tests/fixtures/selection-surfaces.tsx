import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
  PlainProvider,
  ThemeScope,
  Field,
  PhoneInput,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Combobox,
  MultiSelect,
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  type SelectionPresentation,
} from '@plain/ui';
import '@plain/ui/styles.css';

const query = new URLSearchParams(location.search);
const rtl = query.get('dir') === 'rtl';
const requested = query.get('presentation');
const presentation: SelectionPresentation =
  requested === 'popover' || requested === 'sheet' ? requested : 'auto';
const teams = Array.from({ length: query.has('short') ? 4 : 36 }, (_, index) => ({
  value: `team-${index + 1}`,
  label: rtl
    ? `الفريق ${index + 1} — التصميم والتطوير وتجربة المستخدم`
    : `Team ${index + 1} — design, development and customer experience`,
  disabled: index === 2,
}));
function Fixture() {
  const [submitted, setSubmitted] = React.useState('');
  return (
    <main
      style={{ maxWidth: 720, padding: 20, margin: 'auto', display: 'grid', gap: 24, minWidth: 0 }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Selection surfaces</h1>
      <form
        aria-label="Selection form"
        style={{ display: 'grid', gap: 20 }}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(JSON.stringify([...new FormData(event.currentTarget)]));
        }}
      >
        <Field label="Phone number">
          <PhoneInput
            name="phone"
            defaultCountry="EG"
            defaultValue="+201001234567"
            presentation={presentation}
          />
        </Field>
        <Field label="Team">
          <Select
            name="team"
            defaultValue="team-1"
            presentation={presentation}
            sheetTitle={rtl ? 'اختر الفريق' : 'Choose team'}
            required
          >
            <SelectTrigger aria-label="Team">
              <SelectValue placeholder="Choose team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem key={team.value} value={team.value} disabled={team.disabled}>
                  {team.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Project">
          <Combobox
            aria-label="Project"
            name="project"
            defaultValue="team-1"
            presentation={presentation}
            options={teams}
          />
        </Field>
        <Field label="Departments">
          <MultiSelect
            aria-label="Departments"
            name="departments"
            presentation={presentation}
            options={teams}
            maxSelected={2}
            required
          />
        </Field>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button type="submit">Submit</Button>
          <Button type="reset" variant="outline">
            Reset
          </Button>
        </div>
        <output aria-label="Submitted values">{submitted || 'Not submitted'}</output>
      </form>
      <ThemeScope
        data-testid="local-scope"
        locale="ar"
        dir="rtl"
        mode="dark"
        style={{ padding: 16, background: 'var(--ui-surface)', color: 'var(--ui-foreground)' }}
      >
        <Field label="Scoped phone">
          <PhoneInput defaultCountry="EG" presentation={presentation} />
        </Field>
      </ThemeScope>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Project settings</DialogTitle>
          <DialogDescription>Nested selection surfaces</DialogDescription>
          <Field label="Nested project">
            <Combobox aria-label="Nested project" presentation={presentation} options={teams} />
          </Field>
        </DialogContent>
      </Dialog>
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
        motion: query.get('motion') === 'system' ? 'system' : 'none',
      }}
      tokens={
        query.get('surface') === 'custom'
          ? {
              'sheet.background': '#e7f0ff',
              'sheet.radius': '18px',
              'popover.background': '#fce8ff',
              'popover.radius': '2px',
            }
          : undefined
      }
    >
      <Fixture />
    </PlainProvider>
  </React.StrictMode>,
);
