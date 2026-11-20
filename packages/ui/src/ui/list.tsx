import * as React from 'react';
import { Checkbox } from './forms';
import { Button, Skeleton } from './primitives';
import { useStyles, StyleProvider, type PlainStyleProps } from './styling';
import { useTranslation } from './i18n';
import { useCollectionMode, type CollectionModeProps } from './collection-mode';
export type { CollectionMode, CollectionModeProps } from './collection-mode';

export interface ListItemState {
  selected: boolean;
  selectionMode: boolean;
  disabled: boolean;
}
export interface ListProps<T>
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onSelect'>,
    PlainStyleProps,
    CollectionModeProps {
  items: readonly T[];
  getItemKey: (item: T) => string;
  getItemLabel?: (item: T) => string;
  getItemDisabled?: (item: T) => boolean;
  renderItem: (item: T, state: ListItemState) => React.ReactNode;
  renderLeading?: (item: T, state: ListItemState) => React.ReactNode;
  renderTrailing?: (item: T, state: ListItemState) => React.ReactNode;
  selectable?: boolean;
  selectedKeys?: readonly string[];
  defaultSelectedKeys?: readonly string[];
  onSelectedKeysChange?: (keys: string[]) => void;
  selectionActions?: (keys: readonly string[], clear: () => void) => React.ReactNode;
  selectionType?: 'single' | 'multiple';
  showSelectionControls?: boolean;
  clearSelectionOnExit?: boolean;
  density?: 'compact' | 'comfortable';
  dividers?: boolean;
  loading?: boolean;
  renderEmpty?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

function ListImpl<T>(
  {
    items,
    getItemKey,
    getItemLabel,
    getItemDisabled,
    renderItem,
    renderLeading,
    renderTrailing,
    selectable = false,
    mode,
    defaultMode,
    onModeChange,
    selectedKeys,
    defaultSelectedKeys = [],
    onSelectedKeysChange,
    selectionActions,
    selectionType = 'multiple',
    showSelectionControls = true,
    clearSelectionOnExit = true,
    density = 'comfortable',
    dividers = true,
    loading,
    renderEmpty,
    header,
    footer,
    className,
    unstyled,
    ...props
  }: ListProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const styles = useStyles();
  const { t } = useTranslation();
  const [currentMode, changeMode] = useCollectionMode(
    { mode, defaultMode, onModeChange },
    'browse',
  );
  const selecting = selectable && currentMode === 'selection';
  const [localKeys, setLocalKeys] = React.useState(defaultSelectedKeys);
  const selected = new Set(selectedKeys ?? localKeys);
  const update = (keys: string[]) => {
    const unique = [...new Set(keys)];
    if (selectedKeys === undefined) setLocalKeys(unique);
    onSelectedKeysChange?.(unique);
  };
  const toggle = (key: string) =>
    update(
      selected.has(key)
        ? [...selected].filter((value) => value !== key)
        : selectionType === 'single'
          ? [key]
          : [...selected, key],
    );
  return (
    <StyleProvider unstyled={unstyled}>
      <div
        ref={ref}
        {...styles('list.root', 'ui-list', className, unstyled)}
        data-mode={selecting ? 'selection' : 'browse'}
        data-density={density}
        data-dividers={dividers}
        aria-busy={loading || undefined}
        {...props}
      >
        {(header || (selectable && showSelectionControls)) && (
          <div {...styles('list.header', 'ui-list-header', undefined, unstyled)}>
            {header}
            <div {...styles('list.mode-controls', 'ui-list-mode-controls', undefined, unstyled)}>
              {selecting && (
                <span role="status">{t('collection.selected', { count: selected.size })}</span>
              )}
              {selectable && showSelectionControls && (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-pressed={selecting}
                  onClick={() => {
                    if (selecting && clearSelectionOnExit) update([]);
                    changeMode(selecting ? 'browse' : 'selection');
                  }}
                >
                  {t(selecting ? 'common.done' : 'collection.select')}
                </Button>
              )}
            </div>
          </div>
        )}
        <ul
          {...styles('list.items', 'ui-list-items', undefined, unstyled)}
          aria-label={props['aria-label']}
        >
          {loading
            ? Array.from({ length: 3 }, (_, index) => (
                <li
                  key={index}
                  {...styles('list.loading-item', 'ui-list-row', undefined, unstyled)}
                >
                  <Skeleton style={{ width: 36, height: 36 }} />
                  <Skeleton style={{ flex: 1, height: 32 }} />
                </li>
              ))
            : items.map((item) => {
                const key = getItemKey(item);
                const state = {
                  selected: selected.has(key),
                  selectionMode: selecting,
                  disabled: getItemDisabled?.(item) ?? false,
                };
                return (
                  <li
                    key={key}
                    {...styles('list.item', 'ui-list-row', undefined, unstyled)}
                    data-selected={(selecting && state.selected) || undefined}
                    data-disabled={state.disabled || undefined}
                    onClick={(event) => {
                      if (
                        selecting &&
                        !state.disabled &&
                        !event.defaultPrevented &&
                        !(event.target as HTMLElement).closest(
                          'button, a, input, select, textarea, [role="button"], [contenteditable="true"]',
                        )
                      )
                        toggle(key);
                    }}
                  >
                    {selecting && (
                      <Checkbox
                        aria-label={t('table.selectRow', { id: getItemLabel?.(item) ?? key })}
                        checked={state.selected}
                        disabled={state.disabled}
                        onCheckedChange={() => toggle(key)}
                      />
                    )}
                    {renderLeading && (
                      <div {...styles('list.leading', 'ui-list-leading', undefined, unstyled)}>
                        {renderLeading(item, state)}
                      </div>
                    )}
                    <div {...styles('list.content', 'ui-list-content', undefined, unstyled)}>
                      {renderItem(item, state)}
                    </div>
                    {renderTrailing && (
                      <div {...styles('list.trailing', 'ui-list-trailing', undefined, unstyled)}>
                        {renderTrailing(item, state)}
                      </div>
                    )}
                  </li>
                );
              })}
        </ul>
        {!loading &&
          items.length === 0 &&
          (renderEmpty ?? (
            <div {...styles('list.empty', 'ui-list-empty', undefined, unstyled)} role="status">
              {t('common.noResults')}
            </div>
          ))}
        {selecting && selected.size > 0 && selectionActions && (
          <div
            {...styles('list.selection-actions', 'ui-list-selection-actions', undefined, unstyled)}
            role="region"
            aria-label={t('table.selectedActions')}
          >
            {selectionActions([...selected], () => update([]))}
          </div>
        )}
        {footer && (
          <div {...styles('list.footer', 'ui-list-footer', undefined, unstyled)}>{footer}</div>
        )}
      </div>
    </StyleProvider>
  );
}
export const List = /* @__PURE__ */ Object.assign(/* @__PURE__ */ React.forwardRef(ListImpl), {
  displayName: 'List',
}) as <T>(props: ListProps<T> & React.RefAttributes<HTMLDivElement>) => React.ReactElement;

export function ListItemTitle({
  className,
  unstyled,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & PlainStyleProps) {
  const styles = useStyles();
  return <div {...styles('list.title', 'ui-list-title', className, unstyled)} {...props} />;
}
export function ListItemDescription({
  className,
  unstyled,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & PlainStyleProps) {
  const styles = useStyles();
  return (
    <div {...styles('list.description', 'ui-list-description', className, unstyled)} {...props} />
  );
}
