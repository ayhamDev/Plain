import * as React from 'react';
import { Direction } from 'radix-ui';

export const englishMessages = {
  'input.number': 'Number',
  'input.password': 'Password',
  'input.pin': 'Verification code',
  'input.tags': 'Tags',
  'input.requiredTag': 'Add at least one tag.',
  'rating.title': 'Rating',
  'activity.label': 'Activity',
  'banner.dismiss': 'Dismiss notification',
  'select.option': 'Select an option',
  'select.search': 'Search options...',
  'select.empty': 'No options found.',
  'virtual.items': 'Items',
  'color.invalid': 'Enter a valid hexadecimal color.',
  'picker.monthDropdown': 'Choose month',
  'picker.yearDropdown': 'Choose year',
  'picker.weekNumber': 'Week {number}',
  'picker.weekHeader': 'Week number',
  'table.selectedActions': 'Selected row actions',
  'table.clearSelection': 'Clear selection',
  'dialog.close': 'Close dialog',
  'picker.clearValue': 'Clear value',
  'calendar.requiredTitle': 'Enter an event title.',
  'common.close': 'Close',
  'common.clear': 'Clear',
  'common.reset': 'Reset',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.done': 'Done',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.search': 'Search',
  'common.noResults': 'No results found',
  'common.loading': 'Loading',
  'common.retry': 'Retry',
  'common.options': 'Options',
  'common.remove': 'Remove {label}',
  'common.expand': 'Expand {label}',
  'common.collapse': 'Collapse {label}',
  'calendar.label': 'Calendar',
  'calendar.view': 'Calendar view',
  'calendar.eventCount': '{count} events',
  'calendar.month': 'Month',
  'calendar.week': 'Week',
  'calendar.day': 'Day',
  'calendar.agenda': 'Agenda',
  'calendar.today': 'Today',
  'calendar.previous': 'Previous period',
  'calendar.next': 'Next period',
  'calendar.print': 'Print calendar',
  'calendar.noEvents': 'No events scheduled',
  'calendar.allDay': 'All day',
  'calendar.more': 'more',
  'calendar.addEvent': 'New event',
  'calendar.event': 'Event',
  'calendar.start': 'Start',
  'calendar.end': 'End',
  'calendar.title': 'Event title',
  'calendar.saveEvent': 'Save event',
  'calendar.editEvent': 'Edit event',
  'calendar.invalidEvent': 'End must be after start.',
  'picker.chooseDate': 'Pick a date',
  'picker.openCalendar': 'Open calendar',
  'picker.openTime': 'Choose time',
  'picker.clearDate': 'Clear date',
  'picker.clearTime': 'Clear time',
  'picker.clearDateTime': 'Clear date and time',
  'picker.selectRange': 'Pick a date range',
  'picker.clearRange': 'Clear date range',
  'picker.from': 'Start',
  'picker.to': 'End',
  'picker.time': 'Time',
  'picker.hour': 'Hour',
  'picker.minute': 'Minute',
  'picker.second': 'Second',
  'picker.period': 'Period',
  'picker.invalidDate': 'Choose an available date.',
  'picker.invalidRange': 'Choose an available date range.',
  'picker.invalidTimeRange': 'End time must be after start time.',
  'color.presets': 'Color presets',
  'color.choosePreset': 'Choose {label}',
  'navigation.breadcrumb': 'Breadcrumb',
  'navigation.moreLevels': 'More levels',
  'navigation.pagination': 'Pagination',
  'navigation.skip': 'Skip to content',
  'file.selected': 'Selected files',
  'file.remove': 'Remove {label}',
  'file.upload': 'Upload files',
  'file.drop': 'Drop files here',
  'rating.clear': 'Clear rating',
  'rating.label': '{value} of {max} stars',
  'color.choose': 'Choose color',
  'color.hex': 'Hex color',
  'color.hue': 'Hue',
  'color.saturation': 'Color saturation and brightness',
  'color.red': 'Red',
  'color.green': 'Green',
  'color.blue': 'Blue',
  'table.label': 'Table',
  'table.scrollArea': '{label} scroll area',
  'table.search': 'Search records...',
  'table.filters': 'Filters',
  'table.filterField': 'Filter field',
  'table.filterOperator': 'Filter operator',
  'table.valueFor': 'Filter value for {label}',
  'table.filterValue': 'Filter value',
  'table.minimum': 'Minimum filter value',
  'table.maximum': 'Maximum filter value',
  'table.matching': 'Filter matching',
  'table.matchAll': 'Match all',
  'table.matchAny': 'Match any',
  'table.addFilter': 'Add filter',
  'table.removeFilter': 'Remove filter',
  'table.sort': 'Sort',
  'table.sortOrder': 'Sort order',
  'table.addSort': 'Add sort',
  'table.ascending': 'Ascending',
  'table.descending': 'Descending',
  'table.sortDirection': 'Direction for {label}',
  'table.removeSort': 'Remove sort {label}',
  'table.columns': 'Columns',
  'table.selectRow': 'Select row {id}',
  'table.selectPage': 'Select current page',
  'table.rowsPerPage': 'Rows per page',
  'table.page': 'Page',
  'table.of': 'of {count}',
  'table.firstPage': 'First page',
  'table.previousPage': 'Previous page',
  'table.nextPage': 'Next page',
  'table.lastPage': 'Last page',
  'table.pageNumber': 'Go to page',
  'table.summary': '{selected} selected · {from}-{to} of {total}',
  'table.empty': 'Try another search or clear your filters.',
  'table.clearFilters': 'Clear filters',
  'filter.contains': 'contains',
  'filter.notContains': 'does not contain',
  'filter.eq': 'is',
  'filter.neq': 'is not',
  'filter.in': 'is any of',
  'filter.notIn': 'is none of',
  'filter.gt': 'greater than',
  'filter.gte': 'at least',
  'filter.lt': 'less than',
  'filter.lte': 'at most',
  'filter.between': 'between',
  'filter.empty': 'is empty',
  'filter.notEmpty': 'is not empty',
  'scroll.pull': 'Pull to refresh',
  'scroll.release': 'Release to refresh',
  'scroll.refreshing': 'Refreshing',
  'scroll.failed': 'Refresh failed',
  'navigation.open': 'Open navigation',
  'navigation.expand': 'Expand navigation',
  'navigation.collapse': 'Collapse navigation',
  'navigation.sidebar': 'Sidebar navigation',
  'picker.today': 'Today',
  'picker.selected': 'Selected',
  'navigation.primary': 'Primary navigation',
  'navigation.label': 'Navigation',
  'navigation.close': 'Close navigation',
  'navigation.toggle': 'Toggle navigation',
  'navigation.steps': 'Progress steps',
  'navigation.files': 'Files',
  'panel.close': 'Close panel',
  'panel.resize': 'Resize panel',
  'panel.resizePanels': 'Resize panels',
  'chart.heatmap': 'Heatmap',
  'chart.gantt': 'Gantt chart',
  'chart.row': 'Row',
  'chart.column': 'Column',
  'chart.value': 'Value',
  'chart.label': 'Chart',
  'chart.loading': 'Loading chart',
  'chart.empty': 'No data',
  'chart.data': '{label} data',
  'chart.task': 'Task',
  'chart.progress': 'Progress',
  'kanban.moveUp': 'Move up',
  'kanban.moveDown': 'Move down',
  'kanban.instructions':
    'Press space to pick up an item, arrow keys to move, space to drop, or Escape to cancel.',
  'kanban.label': 'Kanban board',
  'kanban.move': 'Move {label}',
  'kanban.moveTo': 'Move to {label}',
  'kanban.moved': '{label} moved to {column}',
  'kanban.drag': 'Drag {label}',
  'kanban.empty': 'No items',
  'search.title': 'Search',
  'search.back': 'Back',
  'search.results': 'Search results',
  'select.required': 'Select at least one option.',
  'select.options': 'Select options',
  'select.toggle': 'Toggle options',
  'input.clear': 'Clear search',
  'input.showPassword': 'Show password',
  'input.hidePassword': 'Hide password',
  'input.increase': 'Increase value',
  'input.decrease': 'Decrease value',
} as const;
export type TranslationKey = keyof typeof englishMessages;
export type TranslationValues = Readonly<Record<string, string | number>>;
export type TranslationMessage = string | ((values: TranslationValues, locale: string) => string);
export type TranslationMessages = Partial<Record<TranslationKey, TranslationMessage>>;

export const arabicMessages: TranslationMessages = {
  'input.number': 'رقم',
  'input.password': 'كلمة المرور',
  'input.pin': 'رمز التحقق',
  'input.tags': 'الوسوم',
  'input.requiredTag': 'أضف وسماً واحداً على الأقل.',
  'rating.title': 'التقييم',
  'rating.label': '{value} من {max} نجوم',
  'rating.clear': 'مسح التقييم',
  'activity.label': 'النشاط',
  'banner.dismiss': 'إغلاق الإشعار',
  'select.option': 'اختر خياراً',
  'select.search': 'البحث في الخيارات...',
  'select.empty': 'لا توجد خيارات.',
  'select.required': 'اختر خياراً واحداً على الأقل.',
  'virtual.items': 'العناصر',
  'color.invalid': 'أدخل رمز لون صالحاً.',
  'picker.monthDropdown': 'اختر الشهر',
  'picker.yearDropdown': 'اختر السنة',
  'picker.weekNumber': 'الأسبوع {number}',
  'picker.weekHeader': 'رقم الأسبوع',
  'picker.invalidDate': 'اختر تاريخاً متاحاً.',
  'picker.invalidRange': 'اختر فترة متاحة.',
  'picker.invalidTimeRange': 'يجب أن تكون النهاية بعد البداية.',
  'table.selectedActions': 'إجراءات الصفوف المحددة',
  'table.clearSelection': 'مسح الاختيار',
  'navigation.breadcrumb': 'مسار التنقل',
  'navigation.moreLevels': 'مستويات أخرى',
  'navigation.pagination': 'الصفحات',
  'navigation.skip': 'انتقل إلى المحتوى',
  'file.selected': 'الملفات المحددة',
  'file.remove': 'إزالة {label}',
  'file.upload': 'رفع ملفات',
  'file.drop': 'أفلت الملفات هنا',
  'color.presets': 'الألوان المحفوظة',
  'color.choosePreset': 'اختر {label}',
  'color.choose': 'اختر لوناً',
  'color.hex': 'رمز اللون',
  'color.hue': 'درجة اللون',
  'color.saturation': 'التشبع والسطوع',
  'color.red': 'أحمر',
  'color.green': 'أخضر',
  'color.blue': 'أزرق',
  'calendar.label': 'التقويم',
  'calendar.view': 'عرض التقويم',
  'calendar.eventCount': '{count} أحداث',
  'table.minimum': 'أقل قيمة',
  'table.maximum': 'أكبر قيمة',
  'table.sortDirection': 'اتجاه ترتيب {label}',
  'table.removeSort': 'إزالة ترتيب {label}',
  'chart.heatmap': 'خريطة حرارية',
  'chart.gantt': 'مخطط جانت',
  'chart.row': 'الصف',
  'chart.column': 'العمود',
  'chart.value': 'القيمة',
  'kanban.moveUp': 'نقل للأعلى',
  'kanban.moveDown': 'نقل للأسفل',
  'kanban.instructions':
    'اضغط المسافة لالتقاط عنصر، والأسهم لنقله، والمسافة لإفلاته، أو Escape للإلغاء.',
  'dialog.close': 'إغلاق الحوار',
  'picker.clearValue': 'مسح القيمة',
  'calendar.requiredTitle': 'أدخل عنوان الحدث.',
  'common.close': 'إغلاق',
  'common.clear': 'مسح',
  'common.reset': 'إعادة ضبط',
  'common.cancel': 'إلغاء',
  'common.save': 'حفظ',
  'common.delete': 'حذف',
  'common.done': 'تم',
  'common.yes': 'نعم',
  'common.no': 'لا',
  'common.search': 'بحث',
  'common.noResults': 'لا توجد نتائج',
  'common.loading': 'جار التحميل',
  'common.retry': 'إعادة المحاولة',
  'common.options': 'الخيارات',
  'common.remove': 'إزالة {label}',
  'common.expand': 'توسيع {label}',
  'common.collapse': 'طي {label}',
  'calendar.month': 'شهر',
  'calendar.week': 'أسبوع',
  'calendar.day': 'يوم',
  'calendar.agenda': 'جدول الأعمال',
  'calendar.today': 'اليوم',
  'calendar.previous': 'الفترة السابقة',
  'calendar.next': 'الفترة التالية',
  'calendar.print': 'طباعة التقويم',
  'calendar.noEvents': 'لا توجد أحداث مجدولة',
  'calendar.allDay': 'طوال اليوم',
  'calendar.more': 'المزيد',
  'calendar.addEvent': 'حدث جديد',
  'calendar.event': 'الحدث',
  'calendar.start': 'البداية',
  'calendar.end': 'النهاية',
  'calendar.title': 'عنوان الحدث',
  'calendar.saveEvent': 'حفظ الحدث',
  'calendar.editEvent': 'تعديل الحدث',
  'calendar.invalidEvent': 'يجب أن تكون النهاية بعد البداية.',
  'picker.chooseDate': 'اختر تاريخاً',
  'picker.openCalendar': 'فتح التقويم',
  'picker.openTime': 'اختيار الوقت',
  'picker.clearDate': 'مسح التاريخ',
  'picker.clearTime': 'مسح الوقت',
  'picker.clearDateTime': 'مسح التاريخ والوقت',
  'picker.selectRange': 'اختر فترة',
  'picker.clearRange': 'مسح الفترة',
  'picker.from': 'من',
  'picker.to': 'إلى',
  'picker.time': 'الوقت',
  'picker.hour': 'الساعة',
  'picker.minute': 'الدقيقة',
  'picker.second': 'الثانية',
  'picker.period': 'الفترة',
  'table.label': 'الجدول',
  'table.scrollArea': 'منطقة تمرير {label}',
  'table.search': 'البحث في السجلات...',
  'table.filters': 'الفلاتر',
  'table.filterField': 'حقل الفلتر',
  'table.filterOperator': 'عامل الفلتر',
  'table.valueFor': 'قيمة فلتر {label}',
  'table.filterValue': 'قيمة الفلتر',
  'table.matching': 'مطابقة الفلاتر',
  'table.matchAll': 'مطابقة الكل',
  'table.matchAny': 'مطابقة أي',
  'table.addFilter': 'إضافة فلتر',
  'table.removeFilter': 'إزالة فلتر',
  'table.sort': 'ترتيب',
  'table.sortOrder': 'ترتيب الفرز',
  'table.addSort': 'إضافة ترتيب',
  'table.ascending': 'تصاعدي',
  'table.descending': 'تنازلي',
  'table.columns': 'الأعمدة',
  'table.selectRow': 'اختيار الصف {id}',
  'table.selectPage': 'اختيار كل صفوف الصفحة',
  'table.rowsPerPage': 'الصفوف لكل صفحة',
  'table.page': 'الصفحة',
  'table.of': 'من {count}',
  'table.firstPage': 'الصفحة الأولى',
  'table.previousPage': 'الصفحة السابقة',
  'table.nextPage': 'الصفحة التالية',
  'table.lastPage': 'الصفحة الأخيرة',
  'table.pageNumber': 'رقم الصفحة',
  'table.summary': '{selected} محدد · {from} - {to} من {total}',
  'table.empty': 'غيّر البحث أو امسح الفلاتر.',
  'table.clearFilters': 'مسح الفلاتر',
  'filter.contains': 'يحتوي على',
  'filter.notContains': 'لا يحتوي على',
  'filter.eq': 'يساوي',
  'filter.neq': 'لا يساوي',
  'filter.in': 'أي من',
  'filter.notIn': 'ليس ضمن',
  'filter.gt': 'أكبر من',
  'filter.gte': 'على الأقل',
  'filter.lt': 'أقل من',
  'filter.lte': 'على الأكثر',
  'filter.between': 'بين',
  'filter.empty': 'فارغ',
  'filter.notEmpty': 'غير فارغ',
  'scroll.pull': 'اسحب للتحديث',
  'scroll.release': 'اترك للتحديث',
  'scroll.refreshing': 'جار التحديث',
  'scroll.failed': 'فشل التحديث',
  'navigation.primary': 'التنقل الرئيسي',
  'navigation.label': 'التنقل',
  'navigation.close': 'إغلاق التنقل',
  'navigation.toggle': 'تبديل التنقل',
  'navigation.steps': 'الخطوات',
  'navigation.open': 'فتح التنقل',
  'navigation.expand': 'توسيع التنقل',
  'navigation.collapse': 'طي التنقل',
  'navigation.sidebar': 'التنقل الجانبي',
  'picker.today': 'اليوم',
  'picker.selected': 'محدد',
  'navigation.files': 'الملفات',
  'panel.close': 'إغلاق اللوحة',
  'panel.resize': 'تغيير حجم اللوحة',
  'panel.resizePanels': 'تغيير حجم اللوحات',
  'chart.label': 'رسم بياني',
  'chart.loading': 'جار تحميل الرسم',
  'chart.empty': 'لا توجد بيانات',
  'chart.data': 'بيانات {label}',
  'chart.task': 'المهمة',
  'chart.progress': 'التقدم',
  'kanban.label': 'لوحة كانبان',
  'kanban.move': 'نقل {label}',
  'kanban.moveTo': 'نقل إلى {label}',
  'kanban.moved': 'تم نقل {label} إلى {column}',
  'kanban.drag': 'سحب {label}',
  'kanban.empty': 'لا توجد عناصر',
  'search.title': 'بحث',
  'search.back': 'رجوع',
  'search.results': 'نتائج البحث',
  'select.options': 'اختيار الخيارات',
  'select.toggle': 'تبديل الخيارات',
  'input.clear': 'مسح البحث',
  'input.showPassword': 'إظهار كلمة المرور',
  'input.hidePassword': 'إخفاء كلمة المرور',
  'input.increase': 'زيادة القيمة',
  'input.decrease': 'تقليل القيمة',
};

export function languageDirection(locale: string): 'ltr' | 'rtl' {
  try {
    const language = new Intl.Locale(locale);
    const info = language as Intl.Locale & { getTextInfo?: () => { direction: 'ltr' | 'rtl' } };
    return (
      info.getTextInfo?.().direction ??
      (/^(ar|fa|he|ur|ps|sd|ug|yi)(-|$)/i.test(locale) ? 'rtl' : 'ltr')
    );
  } catch {
    return 'ltr';
  }
}
interface LanguageValue {
  locale: string;
  timeZone?: string;
  dir: 'ltr' | 'rtl';
  messages: TranslationMessages;
  overrides: TranslationMessages;
  dictionaries: Readonly<Record<string, TranslationMessages>>;
}
const LanguageContext = /* @__PURE__ */ React.createContext<LanguageValue>({
  locale: 'en',
  dir: 'ltr',
  messages: {},
  overrides: {},
  dictionaries: {},
});
export interface LanguageProviderProps {
  children: React.ReactNode;
  locale?: string;
  timeZone?: string;
  dir?: 'ltr' | 'rtl';
  messages?: TranslationMessages;
  /** Dictionaries are selected by exact locale, then base language. */
  translations?: Readonly<Record<string, TranslationMessages>>;
}
export function LanguageProvider({
  children,
  locale: localLocale,
  timeZone,
  dir,
  messages,
  translations,
}: LanguageProviderProps) {
  const parent = React.useContext(LanguageContext);
  const locale = localLocale ?? parent.locale;
  const value = React.useMemo<LanguageValue>(() => {
    const dictionaries = { ...parent.dictionaries, ...translations };
    const overrides = { ...parent.overrides, ...messages };
    return {
      locale,
      timeZone: timeZone ?? parent.timeZone,
      dir: dir ?? (localLocale ? languageDirection(locale) : parent.dir),
      dictionaries,
      overrides,
      messages: { ...dictionaries[locale.split('-')[0]], ...dictionaries[locale], ...overrides },
    };
  }, [locale, timeZone, dir, localLocale, parent, translations, messages]);
  return (
    <LanguageContext.Provider value={value}>
      <Direction.Provider dir={value.dir}>{children}</Direction.Provider>
    </LanguageContext.Provider>
  );
}
export const TranslationProvider = LanguageProvider;
const dateFormats = new Map<string, Intl.DateTimeFormat>();
const numberFormats = new Map<string, Intl.NumberFormat>();
function cached<F>(cache: Map<string, F>, key: string, create: () => F): F {
  let value = cache.get(key);
  if (!value) {
    value = create();
    if (cache.size >= 64) cache.delete(cache.keys().next().value!);
    cache.set(key, value);
  }
  return value;
}
export function dateFormatter(locale: string = 'en', options: Intl.DateTimeFormatOptions = {}) {
  return cached(dateFormats, JSON.stringify([locale, options]), () => {
    try {
      return new Intl.DateTimeFormat(locale, options);
    } catch {
      return new Intl.DateTimeFormat('en', { ...options, timeZone: undefined });
    }
  });
}
export function numberFormatter(locale: string = 'en', options: Intl.NumberFormatOptions = {}) {
  return cached(numberFormats, JSON.stringify([locale, options]), () => {
    try {
      return new Intl.NumberFormat(locale, options);
    } catch {
      return new Intl.NumberFormat('en', options);
    }
  });
}
export function useTranslation() {
  const language = React.useContext(LanguageContext);
  const t = React.useCallback(
    (key: TranslationKey, values: TranslationValues = {}) => {
      const message =
        language.messages[key] ??
        (language.locale.split('-')[0] === 'ar' ? arabicMessages[key] : undefined) ??
        englishMessages[key];
      return typeof message === 'function'
        ? message(values, language.locale)
        : message.replace(/\{(\w+)\}/g, (match, name: string) =>
            values[name] === undefined ? match : String(values[name]),
          );
    },
    [language],
  );
  return {
    locale: language.locale,
    timeZone: language.timeZone,
    dir: language.dir,
    messages: language.messages,
    t,
  };
}
export const useLanguage = useTranslation;
