import { useStyles, type PlainStyleProps } from './styling';
import * as React from 'react';
export type TableProps = React.ComponentPropsWithoutRef<'table'> &
  PlainStyleProps & {
    wrapperProps?: React.HTMLAttributes<HTMLDivElement>;
  };
export const Table = /* @__PURE__ */ React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, unstyled, wrapperProps, ...props }, ref) => {
    const styles = useStyles();
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const [scrollable, setScrollable] = React.useState(false);
    React.useEffect(() => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const update = () => setScrollable(wrapper.scrollWidth > wrapper.clientWidth);
      update();
      const observer = new ResizeObserver(update);
      observer.observe(wrapper);
      if (wrapper.firstElementChild) observer.observe(wrapper.firstElementChild);
      return () => observer.disconnect();
    }, []);
    return (
      <div
        ref={wrapperRef}
        tabIndex={scrollable ? 0 : undefined}
        role={scrollable ? 'region' : undefined}
        aria-label={
          scrollable && !props['aria-labelledby']
            ? `${props['aria-label'] ?? 'Table'} scroll area`
            : undefined
        }
        aria-labelledby={scrollable ? props['aria-labelledby'] : undefined}
        {...wrapperProps}
        {...styles(
          'table.wrapper',
          'relative w-full overflow-x-auto',
          wrapperProps?.className,
          unstyled,
        )}
      >
        <table
          ref={ref}
          {...styles(
            'table.root',
            'w-full caption-bottom bg-[var(--ui-table-background)] text-sm text-[var(--ui-table-foreground)]',
            className,
            unstyled,
          )}
          {...props}
        />
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
