import * as React from 'react';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import { defaultFilter } from 'cmdk';
import { Check } from 'lucide-react';
import { SearchInput } from './search-input';
import { useStyles } from './style-context';
import { useTranslation } from './i18n';

export interface PhoneCountryOption {
  id: string;
  label: string;
  englishLabel: string;
  callingCode: string;
}
interface PhoneCountryListProps {
  options: readonly PhoneCountryOption[];
  value: string;
  onSelect: (id: string) => void;
  onDismiss: () => void;
  sheet: boolean;
}

/** A combobox over the complete data set; TanStack mounts only the visible rows. */
export function PhoneCountryList({
  options,
  value,
  onSelect,
  onDismiss,
  sheet,
}: PhoneCountryListProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState<string | null>(value);
  const viewport = React.useRef<HTMLDivElement>(null);
  const listId = React.useId();
  const filtered = React.useMemo(
    () =>
      !query.trim()
        ? options
        : options
            .map((option, index) => ({
              option,
              index,
              score: defaultFilter(option.id, query.trim(), [
                option.label,
                option.englishLabel,
                option.callingCode,
              ]),
            }))
            .filter((item) => item.score > 0)
            .sort((a, b) => b.score - a.score || a.index - b.index)
            .map((item) => item.option),
    [options, query],
  );
  const activeIndex = Math.max(
    0,
    filtered.findIndex((option) => option.id === active),
  );
  const optionId = (index: number) => `${listId}-${filtered[index].id}`;
  const getItemKey = React.useCallback((index: number) => filtered[index].id, [filtered]);
  const rangeExtractor = React.useCallback(
    (range: Parameters<typeof defaultRangeExtractor>[0]) => {
      const visible = defaultRangeExtractor(range);
      return filtered.length
        ? [...new Set([...visible, activeIndex])].sort((a, b) => a - b)
        : visible;
    },
    [activeIndex, filtered.length],
  );
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: filtered.length,
    getScrollElement: () => viewport.current,
    getItemKey,
    estimateSize: () => 44,
    overscan: 5,
    initialRect: { width: 320, height: 320 },
    initialOffset: Math.max(0, activeIndex * 44 - 132),
    useAnimationFrameWithResizeObserver: true,
    // Keep the active descendant mounted even while a pointer scrolls elsewhere.
    rangeExtractor,
  });
  React.useEffect(() => {
    if (filtered.length) virtualizer.scrollToIndex(activeIndex, { align: 'auto' });
  }, [activeIndex, filtered.length, virtualizer]);
  const measured = virtualizer.getVirtualItems();
  const visible = measured.length
    ? measured
    : [
        ...new Set([
          ...Array.from({ length: Math.min(12, filtered.length) }, (_, index) => index),
          ...(filtered.length ? [activeIndex] : []),
        ]),
      ].map((index) => ({ index, key: filtered[index].id, start: index * 44 }));
  const move = (index: number) => {
    const next = Math.max(0, Math.min(filtered.length - 1, index));
    if (filtered[next]) setActive(filtered[next].id);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(activeIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(activeIndex - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      move(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      move(filtered.length - 1);
    } else if (event.key === 'PageDown' || event.key === 'PageUp') {
      event.preventDefault();
      const page = Math.max(1, Math.floor((viewport.current?.clientHeight || 320) / 44));
      move(activeIndex + (event.key === 'PageDown' ? page : -page));
    } else if (event.key === 'Enter' && filtered.length) {
      event.preventDefault();
      onSelect(filtered[activeIndex].id);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onDismiss();
    }
  };
  return (
    <div {...styles('phone-input.choices', 'ui-phone-country-choices')}>
      <div {...styles('phone-input.search', 'ui-phone-country-search')}>
        <SearchInput
          data-selection-search
          role="combobox"
          aria-expanded="true"
          aria-autocomplete="list"
          aria-label={t('phone.searchCountry')}
          placeholder={t('phone.searchCountry')}
          aria-controls={listId}
          aria-activedescendant={filtered.length ? optionId(activeIndex) : undefined}
          variant="ghost"
          value={query}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            setActive(null);
          }}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div
        ref={viewport}
        id={listId}
        role="listbox"
        tabIndex={0}
        aria-label={t('phone.country')}
        aria-activedescendant={filtered.length ? optionId(activeIndex) : undefined}
        onKeyDown={handleKeyDown}
        {...styles('phone-input.list', 'ui-phone-country-list')}
        style={
          !styles.unstyled
            ? { height: sheet ? undefined : 320, maxHeight: sheet ? 'none' : 320 }
            : undefined
        }
      >
        {!filtered.length ? (
          <div {...styles('phone-input.empty', 'ui-phone-country-empty')}>
            {t('phone.noCountries')}
          </div>
        ) : (
          <div
            role="presentation"
            {...styles('phone-input.virtual-content', 'ui-phone-country-virtual')}
            style={{
              height: virtualizer.getTotalSize() || filtered.length * 44,
              position: 'relative',
            }}
          >
            {visible.map((row) => {
              const option = filtered[row.index];
              return (
                <div
                  key={row.key}
                  ref={virtualizer.measureElement}
                  data-index={row.index}
                  id={optionId(row.index)}
                  role="option"
                  aria-selected={value === option.id}
                  aria-posinset={row.index + 1}
                  aria-setsize={filtered.length}
                  data-active={row.index === activeIndex || undefined}
                  {...styles('phone-input.option', 'ui-phone-country-option')}
                  style={{
                    position: 'absolute',
                    insetInline: 0,
                    top: 0,
                    transform: `translateY(${row.start}px)`,
                  }}
                  onPointerDown={(event) => {
                    if (event.pointerType === 'mouse') event.preventDefault();
                  }}
                  onPointerMove={(event) => {
                    if (event.pointerType === 'mouse') setActive(option.id);
                  }}
                  onClick={() => onSelect(option.id)}
                >
                  <Check
                    {...styles('phone-input.selected-icon', 'ui-phone-country-check')}
                    aria-hidden="true"
                    style={{ opacity: value === option.id ? 1 : 0 }}
                  />
                  <span {...styles('phone-input.option-name', 'ui-phone-country-name')}>
                    {option.label}
                  </span>
                  <bdi dir="ltr" {...styles('phone-input.calling-code', 'ui-phone-calling-code')}>
                    {option.callingCode}
                  </bdi>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
