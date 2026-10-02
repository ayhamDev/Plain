import { useStyles, type PlainStyleProps } from './styling';
import * as React from 'react';
import { useTranslation } from './i18n';
export type TableProps = React.ComponentPropsWithoutRef<'table'> &
  PlainStyleProps & {
    wrapperProps?: React.HTMLAttributes<HTMLDivElement>;
    stickyHeader?: boolean;
    stickyHeaderOffset?: number;
    stickyFooter?: boolean;
    stickyFooterOffset?: number;
    stickyScrollbar?: boolean;
    stickyScrollbarOffset?: number;
    scrollHeight?: React.CSSProperties['maxHeight'];
  };
export const Table = /* @__PURE__ */ React.forwardRef<HTMLTableElement, TableProps>(
  (
    {
      className,
      unstyled,
      wrapperProps,
      stickyHeader,
      stickyHeaderOffset = 0,
      stickyFooter,
      stickyFooterOffset = 0,
      stickyScrollbar,
      stickyScrollbarOffset = 0,
      scrollHeight,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const { t } = useTranslation();
    const tableRef = React.useRef<HTMLTableElement>(null);
    const scrollbarRef = React.useRef<HTMLDivElement>(null);
    const barTrack = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => tableRef.current!);
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const [scrollable, setScrollable] = React.useState(false);
    React.useEffect(() => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const update = () => {
        setScrollable(wrapper.scrollWidth > wrapper.clientWidth + 1);
        if (barTrack.current) barTrack.current.style.width = `${wrapper.scrollWidth}px`;
      };
      update();
      const observer = new ResizeObserver(update);
      observer.observe(wrapper);
      if (wrapper.firstElementChild) observer.observe(wrapper.firstElementChild);
      return () => observer.disconnect();
    }, [stickyScrollbar, scrollable, props.children]);
    React.useEffect(() => {
      const wrapper = wrapperRef.current,
        table = tableRef.current;
      if (!wrapper || !table || (!stickyHeader && !stickyFooter)) return;
      const header = stickyHeader ? table.tHead : null;
      const footer = stickyFooter ? table.tFoot : null;
      if (!header && !footer) return;
      const bounds: HTMLElement[] = [];
      for (
        let ancestor = wrapper.parentElement;
        ancestor && ancestor !== document.body;
        ancestor = ancestor.parentElement
      ) {
        if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(ancestor).overflowY))
          bounds.push(ancestor);
      }
      const originals = [header, footer]
        .filter((part): part is HTMLTableSectionElement => !!part)
        .map((part) => ({
          part,
          transform: part.style.transform,
          position: part.style.position,
          zIndex: part.style.zIndex,
          transitionProperty: part.style.transitionProperty,
        }));
      let frame = 0,
        headerOffset = 0,
        footerOffset = 0;
      const update = () => {
        frame = 0;
        const box = wrapper.getBoundingClientRect(),
          tableBox = table.getBoundingClientRect();
        let top = scrollHeight ? box.top : 0,
          bottom = scrollHeight ? Math.min(innerHeight, box.bottom) : innerHeight;
        for (const boundary of bounds) {
          const rect = boundary.getBoundingClientRect();
          top = Math.max(top, rect.top);
          bottom = Math.min(bottom, rect.bottom);
        }
        if (header) {
          const rect = header.getBoundingClientRect(),
            naturalTop = rect.top - headerOffset;
          headerOffset = Math.max(
            0,
            Math.min(
              top + stickyHeaderOffset - naturalTop,
              tableBox.bottom - naturalTop - rect.height,
            ),
          );
        }
        if (footer) {
          const rect = footer.getBoundingClientRect(),
            naturalBottom = rect.bottom - footerOffset;
          footerOffset = Math.min(
            0,
            Math.max(
              bottom - stickyFooterOffset - naturalBottom,
              tableBox.top - naturalBottom + rect.height,
            ),
          );
        }
        if (header) header.style.transform = `translateY(${headerOffset}px)`;
        if (footer) footer.style.transform = `translateY(${footerOffset}px)`;
      };
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };
      for (const { part } of originals) {
        part.style.position = 'relative';
        part.style.zIndex = '3';
        part.style.transitionProperty = 'none';
      }
      document.addEventListener('scroll', schedule, true);
      window.addEventListener('resize', schedule);
      const observer = new ResizeObserver(schedule);
      observer.observe(table);
      observer.observe(wrapper);
      for (const { part } of originals) observer.observe(part);
      schedule();
      return () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        document.removeEventListener('scroll', schedule, true);
        window.removeEventListener('resize', schedule);
        for (const { part, transform, position, zIndex, transitionProperty } of originals) {
          part.style.transform = transform;
          part.style.position = position;
          part.style.zIndex = zIndex;
          part.style.transitionProperty = transitionProperty;
        }
      };
    }, [
      stickyHeader,
      stickyHeaderOffset,
      stickyFooter,
      stickyFooterOffset,
      scrollHeight,
      props.children,
    ]);
    return (
      <div {...styles('table.container', 'ui-table-container', undefined, unstyled)}>
        <div
          ref={wrapperRef}
          tabIndex={scrollable ? 0 : undefined}
          role={scrollable ? 'region' : undefined}
          aria-label={
            scrollable && !props['aria-labelledby']
              ? t('table.scrollArea', { label: props['aria-label'] ?? t('table.label') })
              : undefined
          }
          aria-labelledby={scrollable ? props['aria-labelledby'] : undefined}
          {...wrapperProps}
          {...styles(
            'table.wrapper',
            'ui-table-scroll relative w-full overflow-x-auto',
            wrapperProps?.className,
            unstyled,
          )}
          style={{
            ...wrapperProps?.style,
            ...(scrollHeight === undefined ? {} : { maxHeight: scrollHeight }),
          }}
          onScroll={(event) => {
            wrapperProps?.onScroll?.(event);
            const bar = scrollbarRef.current;
            if (bar && bar.scrollLeft !== event.currentTarget.scrollLeft)
              bar.scrollLeft = event.currentTarget.scrollLeft;
          }}
        >
          <table
            ref={tableRef}
            {...styles(
              'table.root',
              'w-full caption-bottom bg-[var(--ui-table-background)] text-sm text-[var(--ui-table-foreground)]',
              className,
              unstyled,
            )}
            {...props}
          />
        </div>
        {stickyScrollbar && scrollable && (
          <div
            ref={scrollbarRef}
            {...styles('table.scrollbar', 'ui-table-sync-scrollbar', undefined, unstyled)}
            style={{ bottom: stickyScrollbarOffset }}
            role="region"
            tabIndex={0}
            aria-label={t('table.scrollArea', { label: props['aria-label'] ?? t('table.label') })}
            onScroll={(event) => {
              const wrapper = wrapperRef.current;
              if (wrapper && wrapper.scrollLeft !== event.currentTarget.scrollLeft)
                wrapper.scrollLeft = event.currentTarget.scrollLeft;
            }}
          >
            <div ref={barTrack} style={{ height: 1 }} />
          </div>
        )}
      </div>
    );
  },
);
Table.displayName = 'Table';
export function TableHeader({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'thead'> & PlainStyleProps) {
  const styles = useStyles();
  return (
    <thead
      {...styles(
        'table.header',
        'border-b-[length:var(--ui-border-width)] border-[var(--ui-table-border)] bg-[var(--ui-table-header)]',
        className,
        unstyled,
      )}
      {...props}
    />
  );
}
export function TableBody({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'tbody'> & PlainStyleProps) {
  const styles = useStyles();
  return (
    <tbody
      {...styles('table.body', '[&_tr:last-child]:border-0', className, unstyled)}
      {...props}
    />
  );
}
export function TableFooter({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'tfoot'> & PlainStyleProps) {
  const styles = useStyles();
  return (
    <tfoot
      {...styles(
        'table.footer',
        'border-t-[length:var(--ui-border-width)] border-[var(--ui-table-border)] bg-[var(--ui-table-header)] font-medium',
        className,
        unstyled,
      )}
      {...props}
    />
  );
}
export function TableRow({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'tr'> & PlainStyleProps) {
  const styles = useStyles();
  return (
    <tr
      {...styles(
        'table.row',
        'ui-interactive border-b-[length:var(--ui-border-width)] border-[var(--ui-table-border)] hover:bg-[var(--ui-table-hover)] data-[state=selected]:bg-[var(--ui-table-selected)] data-[state=selected]:text-[var(--ui-table-selected-foreground)]',
        className,
        unstyled,
      )}
      {...props}
    />
  );
}
export function TableHead({
  className,
  scope = 'col',
  unstyled,
  ...props
}: React.ComponentProps<'th'> & PlainStyleProps) {
  const styles = useStyles();
  return (
    <th
      scope={scope}
      {...styles(
        'table.head',
        'h-11 px-4 text-start align-middle text-xs font-medium whitespace-nowrap text-[var(--ui-table-muted-foreground)]',
        className,
        unstyled,
      )}
      {...props}
    />
  );
}
export function TableCell({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'td'> & PlainStyleProps) {
  const styles = useStyles();
  return <td {...styles('table.cell', 'px-4 py-3 align-middle', className, unstyled)} {...props} />;
}
export function TableCaption({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'caption'> & PlainStyleProps) {
  const styles = useStyles();
  return (
    <caption
      {...styles('table.caption', 'mt-4 text-sm text-muted-foreground', className, unstyled)}
      {...props}
    />
  );
}
