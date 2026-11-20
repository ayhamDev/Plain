import * as React from 'react';
import {
  DataTable,
  DatePicker,
  Field,
  Grid,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ThemeScope,
  TimePicker,
  numberFormatter,
  type DataTableColumn,
  type DataTableFilterField,
  type TranslationMessages,
} from '@plain/ui';

const french: TranslationMessages = {
  'common.clear': 'Effacer',
  'common.reset': 'Réinitialiser',
  'common.done': 'Terminé',
  'common.noResults': 'Aucun résultat',
  'common.loading': 'Chargement',
  'common.retry': 'Réessayer',
  'common.yes': 'Oui',
  'common.no': 'Non',
  'collection.select': 'Sélectionner',
  'collection.selected': '{count} sélectionné(s)',
  'dialog.close': 'Fermer la fenêtre',
  'panel.close': 'Fermer le panneau',
  'picker.chooseDate': 'Choisir une date',
  'picker.openCalendar': 'Ouvrir le calendrier',
  'picker.clearDate': 'Effacer la date',
  'picker.openTime': 'Choisir une heure',
  'picker.clearTime': 'Effacer l’heure',
  'picker.time': 'Heure',
  'picker.hour': 'Heures',
  'picker.minute': 'Minutes',
  'picker.second': 'Secondes',
  'picker.period': 'Période',
  'picker.wheelHint': 'Faites glisser vers le haut ou le bas pour changer l’heure.',
  'picker.monthDropdown': 'Choisir le mois',
  'picker.yearDropdown': 'Choisir l’année',
  'picker.weekNumber': 'Semaine {number}',
  'picker.weekHeader': 'Numéro de semaine',
  'picker.today': 'Aujourd’hui',
  'picker.selected': 'Sélectionné',
  'calendar.label': 'Calendrier',
  'calendar.previous': 'Période précédente',
  'calendar.next': 'Période suivante',
  'select.options': 'Choisir des options',
  'select.empty': 'Aucune option',
  'select.required': 'Choisissez au moins une option.',
  'select.toggle': 'Afficher les options',
  'input.clear': 'Effacer la recherche',
  'table.label': 'Tableau',
  'table.scrollArea': 'Zone de défilement : {label}',
  'table.search': 'Rechercher des éléments…',
  'table.filters': 'Filtres',
  'table.filterField': 'Champ du filtre',
  'table.filterOperator': 'Opérateur du filtre',
  'table.filterValue': 'Valeur du filtre',
  'table.valueFor': 'Valeur pour {label}',
  'table.minimum': 'Valeur minimale',
  'table.maximum': 'Valeur maximale',
  'table.matching': 'Correspondance des filtres',
  'table.matchAll': 'Toutes les conditions',
  'table.matchAny': 'Au moins une condition',
  'table.addFilter': 'Ajouter un filtre',
  'table.removeFilter': 'Supprimer le filtre',
  'table.sort': 'Trier',
  'table.sortOrder': 'Ordre de tri',
  'table.addSort': 'Ajouter un tri',
  'table.removeSort': 'Supprimer le tri {label}',
  'table.sortDirection': 'Ordre pour {label}',
  'table.ascending': 'Croissant',
  'table.descending': 'Décroissant',
  'table.columns': 'Colonnes',
  'table.selectRow': 'Sélectionner la ligne {id}',
  'table.selectPage': 'Sélectionner la page',
  'table.rowsPerPage': 'Lignes par page',
  'table.page': 'Page',
  'table.of': 'sur {count}',
  'table.firstPage': 'Première page',
  'table.previousPage': 'Page précédente',
  'table.nextPage': 'Page suivante',
  'table.lastPage': 'Dernière page',
  'table.pageNumber': 'Aller à la page',
  'table.summary': '{selected} sélectionné(s) · {from}–{to} sur {total}',
  'table.range': '{from}–{to} sur {total}',
  'table.empty': 'Modifiez la recherche ou effacez les filtres.',
  'table.clearFilters': 'Effacer les filtres',
  'filter.eq': 'est',
  'filter.neq': 'n’est pas',
  'filter.gt': 'supérieur à',
  'filter.gte': 'au moins',
  'filter.lt': 'inférieur à',
  'filter.lte': 'au plus',
  'filter.between': 'entre',
  'filter.empty': 'est vide',
  'filter.notEmpty': 'n’est pas vide',
};
const translations = { fr: french };
const copy = {
  en: { date: 'Date', time: 'Time', task: 'Task', amount: 'Estimate' },
  'ar-EG': { date: 'التاريخ', time: 'الوقت', task: 'المهمة', amount: 'التقدير' },
  'fr-FR': { date: 'Date', time: 'Heure', task: 'Tâche', amount: 'Estimation' },
};
type ExampleLocale = keyof typeof copy;
type Task = { id: string; task: string; amount: number };
const tasks: Task[] = [
  { id: 'design', task: 'Design review', amount: 1200 },
  { id: 'development', task: 'Development', amount: 2400 },
  { id: 'release', task: 'Release checklist', amount: 800 },
];

export function LocalizationExample() {
  const [locale, setLocale] = React.useState<ExampleLocale>('en');
  const labels = copy[locale];
  const columns = React.useMemo<DataTableColumn<Task>[]>(
    () => [
      { accessorKey: 'task', header: labels.task },
      {
        accessorKey: 'amount',
        header: labels.amount,
        cell: ({ getValue }) => numberFormatter(locale).format(getValue() as number),
      },
    ],
    [labels, locale],
  );
  const fields = React.useMemo<DataTableFilterField<Task>[]>(
    () => [{ id: 'amount', label: labels.amount, type: 'number' }],
    [labels],
  );
  return (
    <section
      aria-label="Localization example"
      className="localization-example"
      style={{ display: 'grid', gap: 24, minInlineSize: 0 }}
    >
      <Select value={locale} onValueChange={(value) => setLocale(value as ExampleLocale)}>
        <Field label="Preview language" style={{ maxWidth: 280 }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </Field>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="ar-EG">العربية (مصر)</SelectItem>
          <SelectItem value="fr-FR">Français</SelectItem>
        </SelectContent>
      </Select>
      <ThemeScope
        locale={locale}
        translations={translations}
        timeZone="Africa/Cairo"
        style={{ display: 'grid', gap: 24, minInlineSize: 0 }}
      >
        <Grid columns={{ base: 1, md: 2 }} gap={2}>
          <Field label={labels.date}>
            <DatePicker
              name="preview-date"
              defaultValue={new Date(2026, 10, 20)}
              calendarProps={{ today: new Date(2026, 10, 20) }}
            />
          </Field>
          <Field label={labels.time}>
            <TimePicker name="preview-time" defaultValue="09:15" />
          </Field>
        </Grid>
        <DataTable
          data={tasks}
          columns={columns}
          filterFields={fields}
          getRowId={(row) => row.id}
          selectable
          defaultMode="browse"
          pageSize={2}
          pageSizes={[2, 3]}
        />
      </ThemeScope>
    </section>
  );
}
