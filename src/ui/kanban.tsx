import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ArrowRightLeft } from 'lucide-react';
import { Button, EmptyState } from './primitives';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './overlays';
import { StyleProvider, useDirection, useStyles, type PlainStyleProps } from './styling';
import { useTranslation } from './i18n';
import { useMotionSettings } from './motion-policy';

export interface KanbanColumn<T> {
  id: string;
  title: React.ReactNode;
  items: readonly T[];
  disabled?: boolean;
}
export interface KanbanMove<T> {
  item: T;
  from: string;
  to: string;
  index: number;
  previousIndex: number;
}
export interface KanbanBoardProps<T>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'children'>, PlainStyleProps {
  columns: readonly KanbanColumn<T>[];
  onColumnsChange?: (columns: KanbanColumn<T>[], move: KanbanMove<T>) => void;
  getItemId: (item: T) => string;
  getItemLabel: (item: T) => string;
  renderCard: (item: T, context: { columnId: string; dragging: boolean }) => React.ReactNode;
  renderColumnHeader?: (column: KanbanColumn<T>) => React.ReactNode;
  renderColumnFooter?: (column: KanbanColumn<T>) => React.ReactNode;
  onCardClick?: (item: T) => void;
  canMove?: (move: KanbanMove<T>) => boolean;
  disabled?: boolean;
  columnWidth?: number | string;
  label?: string;
}
/** Shared immutable transaction for dragging and explicit keyboard/touch commands. */
export function moveKanbanItem<T>(
  columns: readonly KanbanColumn<T>[],
  id: string,
  to: string,
  index: number,
  getItemId: (item: T) => string,
) {
  const source = columns.find((column) => column.items.some((item) => getItemId(item) === id));
  const target = columns.find((column) => column.id === to);
  if (!source || !target || source.disabled || target.disabled) return;
  const previousIndex = source.items.findIndex((item) => getItemId(item) === id);
  const item = source.items[previousIndex];
  const list = target.items.filter((item) => getItemId(item) !== id);
  const nextIndex = Math.max(0, Math.min(list.length, index));
  list.splice(nextIndex, 0, item);
  const move = { item, from: source.id, to, index: nextIndex, previousIndex };
  const next = columns.map((column) =>
    column.id === target.id
      ? { ...column, items: list }
      : column.id === source.id
        ? { ...column, items: column.items.filter((item) => getItemId(item) !== id) }
        : column,
  );
  return { columns: next, move };
}
function KanbanCard<T>({
  item,
  index,
  column,
  props,
  move,
}: {
  index: number;
  item: T;
  column: KanbanColumn<T>;
  props: KanbanBoardProps<T>;
  move: (id: string, column: string, index: number) => void;
}) {
  const { t } = useTranslation();
  const styles = useStyles();
  const motion = useMotionSettings();
  const id = props.getItemId(item),
    label = props.getItemLabel(item);
  const disabled = props.disabled || column.disabled || !props.onColumnsChange;
  const sortable = useSortable({
    id: `item:${id}`,
    disabled,
    transition: motion.enabled ? { duration: 180, easing: 'ease' } : null,
  });
  return (
    <div
      ref={sortable.setNodeRef}
      data-kanban-item={id}
      {...styles('kanban.card', 'ui-kanban-card', undefined, props.unstyled)}
      data-dragging={sortable.isDragging || undefined}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
    >
      <div className="ui-kanban-card-tools">
        <button
          ref={sortable.setActivatorNodeRef}
          type="button"
          disabled={disabled}
          {...sortable.attributes}
          {...sortable.listeners}
          aria-label={t('kanban.drag', { label })}
          className="ui-kanban-grip"
        >
          <GripVertical aria-hidden="true" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              aria-label={t('kanban.move', { label })}
            >
              <ArrowRightLeft size={14} aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {props.columns
              .filter((c) => !c.disabled && c.id !== column.id)
              .map((c) => (
                <DropdownMenuItem key={c.id} onSelect={() => move(id, c.id, c.items.length)}>
                  {t('kanban.moveTo', { label: typeof c.title === 'string' ? c.title : c.id })}
                </DropdownMenuItem>
              ))}
            {index > 0 && (
              <DropdownMenuItem onSelect={() => move(id, column.id, index - 1)}>
                {t('kanban.moveUp')}
              </DropdownMenuItem>
            )}
            {index < column.items.length - 1 && (
              <DropdownMenuItem onSelect={() => move(id, column.id, index + 1)}>
                {t('kanban.moveDown')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {props.onCardClick ? (
        <button
          type="button"
          className="ui-kanban-card-content"
          onClick={() => props.onCardClick?.(item)}
          aria-label={label}
        >
          {props.renderCard(item, { columnId: column.id, dragging: sortable.isDragging })}
        </button>
      ) : (
        <div className="ui-kanban-card-content">
          {props.renderCard(item, { columnId: column.id, dragging: sortable.isDragging })}
        </div>
      )}
    </div>
  );
}
function KanbanLane<T>({
  column,
  props,
  move,
}: {
  column: KanbanColumn<T>;
  props: KanbanBoardProps<T>;
  move: (id: string, column: string, index: number) => void;
}) {
  const styles = useStyles();
  const { t } = useTranslation();
  const drop = useDroppable({
    id: `column:${column.id}`,
    disabled: props.disabled || column.disabled,
  });
  const heading = React.useId();
  return (
    <section
      ref={drop.setNodeRef}
      aria-labelledby={heading}
      {...styles('kanban.column', 'ui-kanban-column', undefined, props.unstyled)}
      data-over={drop.isOver || undefined}
    >
      <header id={heading}>
        {props.renderColumnHeader?.(column) ?? (
          <>
            <strong>{column.title}</strong>
            <span>{column.items.length}</span>
          </>
        )}
      </header>
      <SortableContext
        items={column.items.map((item) => `item:${props.getItemId(item)}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="ui-kanban-items">
          {column.items.map((item, index) => (
            <KanbanCard
              index={index}
              key={props.getItemId(item)}
              item={item}
              column={column}
              props={props}
              move={move}
            />
          ))}
          {!column.items.length && <EmptyState title={t('kanban.empty')} icon={null} />}
        </div>
      </SortableContext>
      {props.renderColumnFooter?.(column)}
    </section>
  );
}
export function KanbanBoard<T>(props: KanbanBoardProps<T>) {
  const {
    columns,
    className,
    unstyled,
    disabled,
    columnWidth = 288,
    label,
    dir,
    getItemId,
    getItemLabel,
    renderCard,
    renderColumnHeader: _header,
    renderColumnFooter: _footer,
    onCardClick: _click,
    onColumnsChange,
    canMove,
    ...native
  } = props;
  void [_header, _footer, _click];
  const styles = useStyles();
  const direction = useDirection(dir === 'ltr' || dir === 'rtl' ? dir : undefined);
  const { t } = useTranslation();
  const board = React.useRef<HTMLDivElement>(null);
  const focusAfterMove = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (!focusAfterMove.current) return;
    const id = focusAfterMove.current;
    const frame = requestAnimationFrame(() => {
      const card = [
        ...(board.current?.querySelectorAll<HTMLElement>('[data-kanban-item]') ?? []),
      ].find((node) => node.dataset.kanbanItem === id);
      card?.querySelector<HTMLButtonElement>('.ui-kanban-grip')?.focus();
      focusAfterMove.current = undefined;
    });
    return () => cancelAnimationFrame(frame);
  }, [columns]);
  const [active, setActive] = React.useState<string>();
  const [announcement, announce] = React.useState('');
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const move = (id: string, target: string, index: number) => {
    if (disabled || !onColumnsChange) return;
    const transaction = moveKanbanItem(columns, id, target, index, getItemId);
    if (!transaction || (canMove && !canMove(transaction.move))) return;
    focusAfterMove.current = id;
    onColumnsChange(transaction.columns, transaction.move);
    const column = columns.find((c) => c.id === target);
    announce(
      t('kanban.moved', {
        label: getItemLabel(transaction.move.item),
        column: typeof column?.title === 'string' ? column.title : target,
      }),
    );
  };
  const end = ({ active, over }: DragEndEvent) => {
    setActive(undefined);
    if (!over) return;
    const id = String(active.id).slice(5),
      targetId = String(over.id);
    const target = targetId.startsWith('column:')
      ? columns.find((c) => c.id === targetId.slice(7))
      : columns.find((c) => c.items.some((i) => `item:${getItemId(i)}` === targetId));
    if (target)
      move(
        id,
        target.id,
        targetId.startsWith('column:')
          ? target.items.length
          : target.items.findIndex((i) => `item:${getItemId(i)}` === targetId),
      );
  };
  const activeColumn = columns.find((c) => c.items.some((i) => getItemId(i) === active));
  const activeItem = activeColumn?.items.find((i) => getItemId(i) === active);
  return (
    <StyleProvider unstyled={unstyled}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active }) => setActive(String(active.id).slice(5))}
        onDragEnd={end}
        onDragCancel={() => setActive(undefined)}
        accessibility={{
          screenReaderInstructions: { draggable: t('kanban.instructions') },
          announcements: {
            onDragStart: ({ active }) => {
              const item = columns
                .flatMap((c) => c.items)
                .find((i) => `item:${getItemId(i)}` === active.id);
              return t('kanban.drag', { label: item ? getItemLabel(item) : String(active.id) });
            },
            onDragOver: () => undefined,
            onDragEnd: () => undefined,
            onDragCancel: () => t('common.cancel'),
          },
        }}
      >
        <div
          ref={board}
          role="region"
          aria-label={label ?? t('kanban.label')}
          dir={direction}
          {...styles('kanban.root', 'ui-kanban-board', className, unstyled)}
          {...native}
          style={
            {
              '--ui-kanban-column-width':
                typeof columnWidth === 'number' ? `${columnWidth}px` : columnWidth,
              ...native.style,
            } as React.CSSProperties
          }
        >
          {columns.map((column) => (
            <KanbanLane key={column.id} column={column} props={props} move={move} />
          ))}
        </div>
        <DragOverlay>
          {activeItem && activeColumn ? (
            <div {...styles('kanban.card', 'ui-kanban-overlay', undefined, unstyled)}>
              {renderCard(activeItem, { columnId: activeColumn.id, dragging: true })}
            </div>
          ) : null}
        </DragOverlay>
        <span className="ui-visually-hidden" role="status">
          {announcement}
        </span>
      </DndContext>
    </StyleProvider>
  );
}
