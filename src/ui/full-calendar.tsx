import * as React from 'react';
import CalendarEngine, {
  type CalendarApi,
  type CalendarOptions,
  type CalendarRef,
  type DateInput,
  type DatesSetInfo,
  type EventInput,
} from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import listPlugin from '@fullcalendar/react/list';
import interactionPlugin from '@fullcalendar/react/interaction';
import classicThemePlugin from '@fullcalendar/react/themes/classic';
import locales from '@fullcalendar/react/locales-all';
import { useDirection, useStyles, type PlainStyleProps } from './styling';
import { inertAttribute } from './utils';

export type FullCalendarRef = CalendarRef;
export type FullCalendarApi = CalendarApi;
export type FullCalendarEvent = EventInput;
export type FullCalendarOptions = CalendarOptions;
export type FullCalendarView =
  'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek' | 'listDay';

export interface FullCalendarProps extends Omit<CalendarOptions, 'className'>, PlainStyleProps {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  dir?: 'ltr' | 'rtl' | 'auto';
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /** Every v7 engine option and callback is also accepted directly as a prop. */
  options?: CalendarOptions;
  rootProps?: Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>;
  containerRef?: React.Ref<HTMLDivElement>;
  disabled?: boolean;
  /** Controlled engine view. Custom engine view names are accepted. */
  view?: string;
  defaultView?: string;
  onViewChange?: (view: string) => void;
  /** Controlled focused date. ISO strings without offsets represent wall time in timeZone. */
  date?: DateInput;
  onDateChange?: (date: Date) => void;
  /** Uncontrolled calendars switch to this view on narrow screens. False disables switching. */
  mobileView?: string | false;
  mobileBreakpoint?: number;
}

const defaultPlugins = [
  classicThemePlugin,
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  interactionPlugin,
];
const defaultToolbar = {
  start: 'prev,next today',
  center: 'title',
  end: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
};

function useNarrowScreen(breakpoint: number) {
  const query = `(max-width: ${Math.max(0, breakpoint)}px)`;
  const subscribe = React.useCallback(
    (listener: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    },
    [query],
  );
  const snapshot = React.useCallback(() => window.matchMedia(query).matches, [query]);
  return React.useSyncExternalStore(subscribe, snapshot, () => false);
}

/**
 * FullCalendar 7.1 engine with month, week, day, and list views. Import the separate
 * full-calendar.css entry for the v7 skeleton and neutral classic theme. The ref
 * exposes getApi(), including event mutation, selection, navigation, and refetching.
 * Direct engine props override options; supplying plugins replaces the defaults.
 * Events and selection retain the engine's exclusive-end range semantics.
 */
export const FullCalendar = /* @__PURE__ */ React.forwardRef<FullCalendarRef, FullCalendarProps>(
  (allProps, forwardedRef) => {
    const {
      options,
      rootProps,
      containerRef,
      className,
      style,
      id,
      unstyled,
      dir,
      'aria-label': label,
      'aria-labelledby': labelledBy,
      'aria-describedby': describedBy,
      disabled = false,
      view,
      defaultView,
      onViewChange,
      date,
      onDateChange,
      mobileView = 'listWeek',
      mobileBreakpoint = 640,
      ...engineProps
    } = allProps;
    const styles = useStyles();
    const configured = { ...options, ...engineProps };
    const localDirection = dir ?? rootProps?.dir;
    const direction = useDirection(
      configured.direction ??
        (localDirection === 'ltr' || localDirection === 'rtl' ? localDirection : undefined),
    );
    const narrow = useNarrowScreen(mobileBreakpoint);
    const controlledView = Object.prototype.hasOwnProperty.call(allProps, 'view');
    const controlledDate = Object.prototype.hasOwnProperty.call(allProps, 'date');
    const desktopView = React.useRef(
      view ?? defaultView ?? configured.initialView ?? 'dayGridMonth',
    );
    const previousNarrow = React.useRef(narrow);
    const responsiveTarget = React.useRef<string | undefined>(undefined);
    const initial = React.useRef(
      controlledView
        ? (view ?? desktopView.current)
        : narrow && mobileView
          ? mobileView
          : desktopView.current,
    );
    const engineRef = React.useRef<CalendarRef>(null);
    const [display, setDisplay] = React.useState({ view: initial.current, title: '', date: '' });
    React.useImperativeHandle(
      forwardedRef,
      () => ({ getApi: () => engineRef.current!.getApi() }),
      [],
    );

    React.useEffect(() => {
      const api = engineRef.current?.getApi();
      if (!api) return;
      if (controlledView) {
        const next = view ?? defaultView ?? configured.initialView ?? 'dayGridMonth';
        if (api.view.type !== next) api.changeView(next);
      } else if (previousNarrow.current !== narrow && mobileView) {
        if (narrow) {
          desktopView.current = api.view.type;
          responsiveTarget.current = mobileView;
          api.changeView(mobileView);
        } else {
          responsiveTarget.current = desktopView.current;
          api.changeView(desktopView.current);
        }
      }
      previousNarrow.current = narrow;
    }, [
      controlledView,
      view,
      defaultView,
      configured.initialView,
      narrow,
      mobileView,
      display.view,
    ]);

    React.useEffect(() => {
      if (!controlledDate) return;
      const api = engineRef.current?.getApi();
      if (!api) return;
      const next = date ?? configured.initialDate ?? configured.now;
      const target = typeof next === 'function' ? next.call(api) : (next ?? new Date());
      if (api.formatIso(api.getDate(), true) !== api.formatIso(target, true)) api.gotoDate(target);
    }, [controlledDate, date, configured.initialDate, configured.now, display.date]);

    const datesSet = (info: DatesSetInfo) => {
      const api = info.view.calendar;
      const next = {
        view: info.view.type,
        title: info.view.title,
        date: api.formatIso(api.getDate(), true),
      };
      setDisplay((previous) =>
        previous.view === next.view && previous.title === next.title && previous.date === next.date
          ? previous
          : next,
      );
      // Engine callbacks may arrive after a resize; preserve the view saved before switching.
      const respondingToResize = responsiveTarget.current !== undefined;
      if (responsiveTarget.current === next.view) responsiveTarget.current = undefined;
      if (!narrow && !controlledView && !respondingToResize) desktopView.current = next.view;
      if (next.view !== display.view) onViewChange?.(next.view);
      if (next.date !== display.date) onDateChange?.(api.getDate());
      configured.datesSet?.(info);
    };

    return (
      <div
        {...rootProps}
        {...styles(
          'full-calendar.root',
          'ui-full-calendar',
          className ?? rootProps?.className,
          unstyled,
        )}
        ref={containerRef}
        id={id ?? rootProps?.id}
        style={{ ...rootProps?.style, ...style }}
        dir={direction}
        role={rootProps?.role ?? 'region'}
        aria-label={
          label ??
          rootProps?.['aria-label'] ??
          (labelledBy || rootProps?.['aria-labelledby'] ? undefined : 'Calendar')
        }
        aria-labelledby={labelledBy ?? rootProps?.['aria-labelledby']}
        aria-describedby={describedBy ?? rootProps?.['aria-describedby']}
        aria-disabled={disabled || undefined}
        inert={inertAttribute(disabled)}
        data-view={display.view}
        data-mobile={narrow ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
      >
        <CalendarEngine
          height="auto"
          dayMaxEvents
          nowIndicator
          eventInteractive
          navLinks
          locales={locales}
          locale="en"
          headerToolbar={defaultToolbar}
          toolbarClass={
            styles('full-calendar.toolbar', 'ui-full-calendar-toolbar', undefined, unstyled)
              .className
          }
          toolbarSectionClass={
            styles(
              'full-calendar.toolbar-section',
              'ui-full-calendar-toolbar-section',
              undefined,
              unstyled,
            ).className
          }
          toolbarTitleClass={
            styles('full-calendar.title', 'ui-full-calendar-title', undefined, unstyled).className
          }
          buttonClass={(info) =>
            styles(
              'full-calendar.button',
              `ui-full-calendar-button${info.isSelected ? ' ui-full-calendar-button-selected' : ''}`,
              undefined,
              unstyled,
            ).className
          }
          plugins={defaultPlugins}
          timeZone="local"
          {...configured}
          ref={engineRef}
          initialView={initial.current}
          initialDate={date ?? configured.initialDate}
          direction={direction}
          editable={disabled ? false : configured.editable}
          selectable={disabled ? false : configured.selectable}
          datesSet={datesSet}
          eventClick={(info) => {
            if (!disabled) configured.eventClick?.(info);
          }}
          dateClick={(info) => {
            if (!disabled) configured.dateClick?.(info);
          }}
          select={(info) => {
            if (!disabled) configured.select?.(info);
          }}
        />
      </div>
    );
  },
);
FullCalendar.displayName = 'FullCalendar';
