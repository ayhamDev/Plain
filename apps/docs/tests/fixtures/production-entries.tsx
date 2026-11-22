import { createRoot } from 'react-dom/client';
import { PlainProvider } from '@plain/ui/provider';
import { Button } from '@plain/ui/button';
import { Input } from '@plain/ui/input';
import { NumberInput } from '@plain/ui/number-input';
import { Textarea } from '@plain/ui/textarea';
import { Field } from '@plain/ui/field';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@plain/ui/select';
import { PhoneInput } from '@plain/ui/phone-input';
import { DateTimePicker } from '@plain/ui/date-time-picker';
import { TimePicker } from '@plain/ui/time-picker';
import { Calendar } from '@plain/ui/calendar';
import { DataTable } from '@plain/ui/data-table';
import { Item, ItemContent, ItemTitle } from '@plain/ui/item';
import { QRCode } from '@plain/ui/qr-code';
import { BarChart } from '@plain/ui/bar-chart';
import { LineChart } from '@plain/ui/line-chart';
import { DonutChart } from '@plain/ui/donut-chart';

const query = new URLSearchParams(location.search);
if (query.get('css') === 'features') await import('./production-features.css');
else {
  await import('@plain/ui/styles.css');
  await import('@plain/ui/charts.css');
}
const data = [
  { name: 'May', amount: 25 },
  { name: 'Jun', amount: 42 },
  { name: 'Jul', amount: 38 },
];
const columns = [
  { accessorKey: 'name', header: 'Month' },
  { accessorKey: 'amount', header: 'Amount' },
];
createRoot(document.getElementById('root')!).render(
  <PlainProvider
    persist={false}
    locale="en"
    dir={query.get('dir') === 'rtl' ? 'rtl' : 'ltr'}
    theme={{ mode: query.get('mode') === 'dark' ? 'dark' : 'light', motion: 'none' }}
  >
    <main
      style={{ maxWidth: 760, padding: 20, margin: 'auto', display: 'grid', gap: 24, minWidth: 0 }}
    >
      <h1>Production component entries</h1>
      <form
        aria-label="Profile"
        onSubmit={(event) => event.preventDefault()}
        style={{ display: 'grid', gap: 16 }}
      >
        <Field label="Name">
          <Input defaultValue="Alex Morgan" />
        </Field>
        <Field label="Seats">
          <NumberInput defaultValue={5} />
        </Field>
        <Field label="Notes">
          <Textarea resize="none" defaultValue="A longer description." />
        </Field>
        <Select defaultValue="design" presentation="auto" sheetTitle="Choose team">
          <Field label="Team">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
          </Field>
          <SelectContent>
            <SelectItem value="design">Design</SelectItem>
            <SelectItem value="engineering">Engineering</SelectItem>
          </SelectContent>
        </Select>
        <Field label="Phone">
          <PhoneInput defaultCountry="EG" />
        </Field>
        <Field label="Meeting">
          <DateTimePicker defaultValue="2026-11-22T09:30" />
        </Field>
        <Field label="Start time">
          <TimePicker defaultValue="09:15" />
        </Field>
        <Button type="submit">Save</Button>
      </form>
      <div data-testid="calendar">
        <Calendar mode="single" defaultMonth={new Date(2026, 10, 1)} />
      </div>
      <Item selected>
        <ItemContent>
          <ItemTitle>Selected file</ItemTitle>
        </ItemContent>
      </Item>
      <DataTable data={data} columns={columns} />
      <QRCode value="https://example.com/contact" size={112} animation={false} />
      <BarChart data={data} label="Bar totals" animate={false} />
      <LineChart data={data} label="Line totals" animate={false} />
      <DonutChart data={data} valueKey="amount" label="Share totals" animate={false} />
      <BarChart data={data} label="Pending totals" loading />
    </main>
  </PlainProvider>,
);
