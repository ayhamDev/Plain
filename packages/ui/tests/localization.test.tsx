import * as React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PlainProvider, ThemeScope, useDirection } from '../src/ui/styling';
import {
  LanguageProvider,
  englishMessages,
  arabicMessages,
  useTranslation,
  type TranslationMessages,
} from '../src/ui/i18n';
import { Calendar, DatePicker } from '../src/ui/calendar';
import { TimePicker, DateTimePicker, DateRangePicker } from '../src/ui/date-time';
import {
  DataTable,
  useDataTable,
  DataTableView,
  DataTableActiveFilters,
  type DataTableColumn,
  type DataTableFilterField,
} from '../src/ui/data-table';
import {
  NumberInput,
  PasswordInput,
  Dropzone,
  MultiSelect,
  Banner,
  TagsInput,
} from '../src/ui/advanced';
import { Slider } from '../src/ui/forms';
import { Command, CommandInput, CommandList, CommandItem } from '../src/ui/command';
import { ColorPicker } from '../src/ui/color-picker';
import { Pagination } from '../src/ui/navigation';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '../src/ui/overlays';
import { Button, Spinner, EmptyState } from '../src/ui/primitives';
import { FullCalendar } from '../src/ui/full-calendar';
import { BarChart, DonutChart } from '../src/ui/charts';
import { GanttChart } from '../src/ui/gantt';

const day = new Date(2026, 10, 20);
type Row = { id: string; name: string; active: boolean; amount: number };
const data: Row[] = [
  { id: 'a', name: 'Design', active: true, amount: 1200 },
  { id: 'b', name: 'Development', active: false, amount: 40 },
  { id: 'c', name: 'Release', active: true, amount: 1200 },
];
const columns: DataTableColumn<Row>[] = [
  { accessorKey: 'name', header: 'Application title' },
  { accessorKey: 'amount', header: 'Application amount' },
];
const fields: DataTableFilterField<Row>[] = [
  { id: 'active', label: 'Application status', type: 'boolean', getValue: (row) => row.active },
  { id: 'amount', label: 'Application amount', type: 'number' },
];
function LanguageStatus({ id = 'language' }: { id?: string }) {
  const { locale, timeZone, dir, t } = useTranslation();
  const primitiveDirection = useDirection();
  return (
    <output
      data-testid={id}
      lang={locale}
      data-zone={timeZone}
      dir={dir}
      data-direction={primitiveDirection}
    >
      {t('common.save')} / {t('common.cancel')} / {t('collection.selected', { count: 1200 })}
    </output>
  );
}

describe('global component localization', () => {
  it('configures text, document language, direction and timezone from PlainProvider and restores the document', () => {
    const oldLanguage = document.documentElement.getAttribute('lang');
    const oldDirection = document.documentElement.getAttribute('dir');
    const { rerender, unmount } = render(
      <PlainProvider locale="AR-eg" timeZone="Africa/Cairo" persist={false}>
        <LanguageStatus />
        <NumberInput />
        <PasswordInput />
        <Spinner />
        <DatePicker />
      </PlainProvider>,
    );
    expect(document.documentElement).toHaveAttribute('lang', 'ar-EG');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.getByTestId('language')).toHaveAttribute('data-zone', 'Africa/Cairo');
    expect(screen.getByTestId('language')).toHaveAttribute('data-direction', 'rtl');
    expect(screen.getByTestId('language')).toHaveTextContent('١٬٢٠٠');
    expect(screen.getByRole('button', { name: 'زيادة القيمة' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'إظهار كلمة المرور' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'اختر تاريخاً' })).toBeInTheDocument();
    rerender(
      <PlainProvider locale="en-GB" dir="rtl" persist={false}>
        <LanguageStatus />
      </PlainProvider>,
    );
    expect(document.documentElement).toHaveAttribute('lang', 'en-GB');
    expect(screen.getByTestId('language')).toHaveAttribute('data-direction', 'rtl');
    expect(screen.getByTestId('language')).toHaveTextContent('Save / Cancel / 1,200 selected');
    unmount();
    expect(document.documentElement.getAttribute('lang')).toBe(oldLanguage);
    expect(document.documentElement.getAttribute('dir')).toBe(oldDirection);
  });

  it('inherits a standalone language provider through the main provider', () => {
    render(
      <LanguageProvider locale="ar" timeZone="Asia/Riyadh">
        <PlainProvider persist={false}>
          <LanguageStatus />
        </PlainProvider>
      </LanguageProvider>,
    );
    expect(screen.getByTestId('language')).toHaveAttribute('lang', 'ar');
    expect(screen.getByTestId('language')).toHaveAttribute('data-zone', 'Asia/Riyadh');
    expect(screen.getByTestId('language')).toHaveAttribute('data-direction', 'rtl');
  });

  it('merges canonical base, script and region dictionaries while keeping explicit overrides scoped', () => {
    const count = vi.fn((values, locale) => `${locale}: ${values.count}`);
    render(
      <PlainProvider
        locale="FR-ca"
        translations={{
          fr: { 'common.save': 'Enregistrer', 'common.cancel': 'Annuler' },
          'fr-ca': { 'collection.selected': count },
        }}
        persist={false}
      >
        <LanguageStatus />
        <ThemeScope
          data-testid="scope"
          translations={{ FR: { 'common.save': 'Sauvegarder' } }}
          messages={{ 'common.cancel': 'Stop' }}
        >
          <LanguageStatus id="nested" />
        </ThemeScope>
        <ThemeScope
          locale="zh-hant-hk"
          translations={{ zh: { 'common.save': '儲存' }, 'zh-Hant': { 'common.cancel': '取消' } }}
        >
          <LanguageStatus id="script" />
        </ThemeScope>
      </PlainProvider>,
    );
    expect(screen.getByTestId('language')).toHaveTextContent('Enregistrer / Annuler / fr-CA: 1200');
    expect(count).toHaveBeenCalledWith({ count: 1200 }, 'fr-CA');
    expect(screen.getByTestId('nested')).toHaveTextContent('Sauvegarder / Stop / fr-CA: 1200');
    expect(screen.getByTestId('scope')).toHaveAttribute('lang', 'fr-CA');
    expect(screen.getByTestId('script')).toHaveTextContent('儲存 / 取消');
  });

  it('falls back safely for unsupported and malformed locale configuration and covers every Arabic key', () => {
    const missing = Object.keys(englishMessages).filter((key) => !(key in arabicMessages));
    expect(missing).toEqual([]);
    const { rerender } = render(
      <PlainProvider locale="de-DE" persist={false}>
        <LanguageStatus />
      </PlainProvider>,
    );
    expect(screen.getByTestId('language')).toHaveTextContent('Save / Cancel / 1.200 selected');
    rerender(
      <PlainProvider
        locale="not_a_locale"
        translations={{ not_a_locale: { 'common.save': 'Invalid' } }}
        persist={false}
      >
        <LanguageStatus />
      </PlainProvider>,
    );
    expect(screen.getByTestId('language')).toHaveAttribute('lang', 'en');
    expect(screen.getByTestId('language')).toHaveTextContent('Save / Cancel');
  });

  it('updates existing table controls without discarding search or selection', async () => {
    function Table() {
      return (
        <DataTable
          data={data}
          columns={columns}
          filterFields={fields}
          getRowId={(row) => row.id}
          selectable
          pageSize={2}
        />
      );
    }
    const { rerender } = render(
      <PlainProvider locale="en" persist={false}>
        <Table />
      </PlainProvider>,
    );
    await userEvent.type(screen.getByRole('searchbox'), 'Design');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select row a' }));
    rerender(
      <PlainProvider locale="ar-EG" persist={false}>
        <Table />
      </PlainProvider>,
    );
    expect(screen.getByRole('searchbox')).toHaveValue('Design');
    expect(screen.getByRole('searchbox')).toHaveAttribute('placeholder', 'البحث في السجلات...');
    expect(screen.getByRole('checkbox', { name: 'اختيار الصف a' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'الأعمدة' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'الفلاتر' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('١ محدد · ١ - ١ من ١');
    expect(screen.getByRole('columnheader', { name: /Application title/ })).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
  });

  it('localizes boolean and numeric active filters without changing query data types', () => {
    function Table() {
      const table = useDataTable({
        data,
        columns,
        filterFields: fields,
        query: {
          search: '',
          join: 'and',
          filters: [
            { id: 'a', field: 'active', operator: 'eq', value: true },
            { id: 'b', field: 'amount', operator: 'eq', value: 1200 },
          ],
        },
      });
      return (
        <>
          <DataTableActiveFilters table={table} fields={fields} />
          <DataTableView table={table} showToolbar={false} />
        </>
      );
    }
    render(
      <PlainProvider locale="ar-EG" persist={false}>
        <Table />
      </PlainProvider>,
    );
    const filters = screen.getAllByRole('button', { name: 'إزالة فلتر' });
    expect(filters[0]).toHaveTextContent('Application status يساوي نعم');
    expect(filters[1]).toHaveTextContent('١٬٢٠٠');
    expect(screen.getByRole('table')).toHaveTextContent('Design');
    expect(screen.getByRole('table')).not.toHaveTextContent('Development');
  });

  it('keeps scoped portaled dialogs in their language without changing the application document', async () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <PlainProvider locale="en" persist={false}>
        <LanguageStatus />
        <ThemeScope ref={ref} locale="ar" messages={{ 'dialog.close': 'إغلاق النافذة' }}>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open scoped dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Application title</DialogTitle>
              <DialogDescription>Application description</DialogDescription>
              <NumberInput />
            </DialogContent>
          </Dialog>
        </ThemeScope>
      </PlainProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open scoped dialog' }));
    const dialog = screen.getByRole('dialog');
    expect(ref.current).toContainElement(dialog);
    expect(ref.current).toHaveAttribute('lang', 'ar');
    expect(ref.current).toHaveAttribute('dir', 'rtl');
    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(within(dialog).getByRole('button', { name: 'زيادة القيمة' })).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'إغلاق النافذة' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Open scoped dialog' })).toHaveFocus(),
    );
  });

  it('uses Intl for calendar captions, numerals and week numbers and preserves per-component overrides', () => {
    const french: TranslationMessages = {
      'picker.monthDropdown': 'Mois',
      'picker.yearDropdown': 'Année',
      'picker.today': 'Aujourd’hui',
      'picker.selected': 'Sélectionné',
    };
    const { rerender } = render(
      <PlainProvider locale="fr-FR" messages={french} persist={false}>
        <Calendar defaultMonth={day} today={day} mode="single" selected={day} showWeekNumber />
      </PlainProvider>,
    );
    expect(screen.getByRole('grid', { name: 'novembre 2026' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Mois' })).toHaveTextContent('novembre');
    expect(
      screen.getByRole('button', { name: /Aujourd’hui.*20 novembre 2026.*Sélectionné/ }),
    ).toBeInTheDocument();
    rerender(
      <PlainProvider locale="ar-EG" persist={false}>
        <Calendar
          defaultMonth={day}
          today={day}
          showWeekNumber
          labels={{ labelYearDropdown: () => 'Year override' }}
        />
      </PlainProvider>,
    );
    expect(screen.getByRole('combobox', { name: 'Year override' })).toHaveTextContent('٢٠٢٦');
    expect(screen.getByRole('rowheader', { name: 'الأسبوع ٤٧' })).toHaveTextContent('٤٧');
  });

  it('keeps calendar geometry Gregorian for locales with a different default display calendar', () => {
    render(
      <PlainProvider locale="fa-IR" persist={false}>
        <Calendar defaultMonth={day} today={day} />
        <DatePicker defaultValue={day} />
        <FullCalendar events={[]} defaultDate="2026-11-20" />
        <GanttChart
          tasks={[
            { id: 'review', label: 'Application task', start: '2026-11-20', end: '2026-11-23' },
          ]}
        />
      </PlainProvider>,
    );
    const expectedMonth = new Intl.DateTimeFormat('fa-IR', {
      calendar: 'gregory',
      month: 'long',
      year: 'numeric',
    }).format(day);
    expect(screen.getAllByRole('grid', { name: expectedMonth })).toHaveLength(2);
    expect(screen.getByRole('combobox', { name: 'Choose year' })).toHaveTextContent('۲۰۲۶');
    expect(screen.getByRole('button', { name: 'Pick a date' })).toHaveTextContent('۲۰۲۶');
    const table = screen.getByRole('table', { name: 'Gantt chart data', hidden: true });
    expect(table).toHaveTextContent('۲۰۲۶');
    expect(table).not.toHaveTextContent('۱۴۰۵');
  });

  it('localizes calendar and picker tools through the main provider, including open portals', async () => {
    render(
      <PlainProvider locale="ar" persist={false}>
        <TimePicker aria-label="Time value" defaultValue="09:15" />
        <DateTimePicker aria-label="Appointment" defaultValue="2026-11-20T09:15" />
        <DateRangePicker />
      </PlainProvider>,
    );
    expect(screen.getByRole('button', { name: 'اختر فترة' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'اختيار الوقت' }));
    expect(screen.getByRole('combobox', { name: 'الساعة' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'الدقيقة' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'تم' }));
    expect(screen.getByLabelText('Time value')).toHaveValue('09:15');
    await userEvent.click(screen.getByRole('button', { name: 'فتح التقويم' }));
    expect(screen.getByRole('combobox', { name: 'اختر الشهر' })).toHaveTextContent('نوفمبر');
    expect(screen.getByLabelText('Appointment')).toHaveValue('2026-11-20T09:15');
  });

  it('localizes file sizes, validation and color-picker instructions and respects native overrides', async () => {
    render(
      <PlainProvider locale="ar-EG" persist={false}>
        <Dropzone defaultValue={[new File(['x'.repeat(2048)], 'application.txt')]} />
        <ColorPicker />
        <Banner dismissible dismissLabel="App dismiss">
          Application notice
        </Banner>
      </PlainProvider>,
    );
    expect(screen.getByRole('list', { name: 'الملفات المحددة' })).toHaveTextContent('٢ ك.ب');
    expect(screen.getByRole('button', { name: 'App dismiss' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'اختر لوناً' }));
    expect(screen.getByText(arabicMessages['color.keyboardHint'] as string)).toBeInTheDocument();
  });

  it('localizes native command labels and pagination with caller props taking precedence', () => {
    render(
      <PlainProvider locale="ar-EG" persist={false}>
        <Command>
          <CommandInput />
          <CommandList>
            <CommandItem>Application command</CommandItem>
          </CommandList>
        </Command>
        <Pagination page={2} pageCount={3} onPageChange={() => {}} />
        <EmptyState title="Application title" />
      </PlainProvider>,
    );
    expect(screen.getByRole('combobox', { name: 'بحث' })).toHaveAttribute('placeholder', 'بحث');
    expect(screen.getByRole('listbox', { name: 'نتائج البحث' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'الصفحة ٢' })).toHaveTextContent('٢');
    expect(screen.getByText('Application title')).toBeInTheDocument();
  });

  it('uses the provider locale when matching multi-select options', async () => {
    render(
      <PlainProvider locale="tr-TR" persist={false}>
        <MultiSelect
          options={[
            { value: 'a', label: 'ISPARTA' },
            { value: 'b', label: 'ISTANBUL' },
          ]}
        />
      </PlainProvider>,
    );
    await userEvent.type(screen.getByRole('combobox'), 'ıspa');
    expect(screen.getByRole('option', { name: 'ISPARTA' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'ISTANBUL' })).not.toBeInTheDocument();
  });

  it('localizes default slider-thumb names and tag tooltips while preserving explicit thumb labels', () => {
    render(
      <PlainProvider locale="ar-EG" persist={false}>
        <Slider defaultValue={[20, 80]} />
        <Slider defaultValue={[5]} />
        <Slider defaultValue={[10, 90]} thumbLabels={['App minimum', 'App maximum']} />
        <TagsInput defaultValue={['Application tag']} />
      </PlainProvider>,
    );
    expect(screen.getByRole('slider', { name: 'القيمة ١' })).toHaveAttribute('aria-valuenow', '20');
    expect(screen.getByRole('slider', { name: 'القيمة ٢' })).toHaveAttribute('aria-valuenow', '80');
    expect(screen.getByRole('slider', { name: 'القيمة' })).toHaveAttribute('aria-valuenow', '5');
    expect(screen.getByRole('slider', { name: 'App minimum' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'App maximum' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'إزالة Application tag' })).toHaveAttribute(
      'title',
      'إزالة Application tag',
    );
  });

  it('retains existing page-label overrides and supports explicit numeral conventions', () => {
    render(
      <PlainProvider
        locale="ar-EG-u-nu-latn"
        messages={{ 'table.page': 'App page' }}
        persist={false}
      >
        <Pagination page={2} pageCount={3} onPageChange={() => {}} />
        <LanguageStatus />
      </PlainProvider>,
    );
    expect(screen.getByRole('button', { name: 'App page 2' })).toHaveTextContent('2');
    expect(screen.getByTestId('language')).toHaveTextContent('1,200');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });

  it('localizes the full-calendar toolbar and chart data alternatives from one provider', () => {
    render(
      <PlainProvider
        locale="de-DE"
        translations={{
          de: {
            'calendar.today': 'Heute',
            'calendar.month': 'Monat',
            'calendar.week': 'Woche',
            'chart.data': '{label} Daten',
          },
        }}
        persist={false}
      >
        <FullCalendar events={[]} defaultDate="2026-11-20" views={['month', 'week']} />
        <BarChart
          label="Capacity"
          data={[{ name: 'Application category', value: 1234.5 }]}
          series={[{ dataKey: 'value' }]}
        />
        <DonutChart label="Storage" data={[{ name: 'Application category', value: 1234.5 }]} />
      </PlainProvider>,
    );
    expect(screen.getByRole('button', { name: 'Heute' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Calendar view' })).toHaveTextContent('Monat');
    expect(screen.getAllByText('1.234,5')).toHaveLength(2);
    expect(screen.getByText('Capacity Daten')).toBeInTheDocument();
  });

  it('renders localized provider content on the server without accessing document globals', () => {
    const html = renderToString(
      <PlainProvider locale="ar" persist={false}>
        <ThemeScope locale="fr" messages={{ 'common.save': 'Enregistrer' }}>
          <LanguageStatus />
        </ThemeScope>
        <DatePicker />
      </PlainProvider>,
    );
    expect(html).toContain('lang="fr"');
    expect(html).toContain('Enregistrer');
    expect(html).toContain('اختر تاريخاً');
  });
});
