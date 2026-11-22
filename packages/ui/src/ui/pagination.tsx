import * as React from 'react';
import { type PlainStyleProps, useStyles, StyleProvider } from './style-context';
import { useTranslation, numberFormatter } from './i18n';
import { Button } from './button';
import { ChevronLeft, MoreHorizontal, ChevronRight } from 'lucide-react';

export interface PaginationProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange'>, PlainStyleProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
  unstyled,
  ...props
}: PaginationProps & PlainStyleProps) {
  const styles = useStyles();
  const { t, locale } = useTranslation();
  const count = Number.isFinite(pageCount) ? Math.max(1, Math.floor(pageCount)) : 1;
  const current = Number.isFinite(page) ? Math.max(1, Math.min(count, Math.floor(page))) : 1;
  const pages = new Set(
    [1, count, current - 1, current, current + 1].filter((p) => p >= 1 && p <= count),
  );
  const sorted = [...pages].sort((a, b) => a - b);
  return (
    <StyleProvider unstyled={unstyled}>
      {styles.tooltip(
        <nav
          aria-label={t('navigation.pagination')}
          {...styles('pagination.root', 'flex flex-wrap items-center gap-1', className, unstyled)}
          {...props}
        >
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('table.previousPage')}
            disabled={current === 1}
            onClick={() => onPageChange(current - 1)}
          >
            <ChevronLeft className="rtl:rotate-180" aria-hidden="true" />
          </Button>
          {sorted.map((p, i) => (
            <React.Fragment key={p}>
              {i > 0 && p - sorted[i - 1] > 1 && (
                <span
                  aria-hidden="true"
                  {...styles(
                    'pagination.ellipsis',
                    'flex size-9 items-center justify-center text-muted-foreground',
                    undefined,
                    unstyled,
                  )}
                >
                  <MoreHorizontal {...styles('pagination.icon', 'size-4', undefined, unstyled)} />
                </span>
              )}
              <Button
                variant={p === current ? 'outline' : 'ghost'}
                size="icon"
                aria-label={t('table.pageLabel', { label: t('table.page'), page: p })}
                aria-current={p === current ? 'page' : undefined}
                onClick={() => onPageChange(p)}
              >
                {numberFormatter(locale).format(p)}
              </Button>
            </React.Fragment>
          ))}
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('table.nextPage')}
            disabled={current === count}
            onClick={() => onPageChange(current + 1)}
          >
            <ChevronRight className="rtl:rotate-180" aria-hidden="true" />
          </Button>
        </nav>,
        unstyled,
      )}
    </StyleProvider>
  );
}
