import * as React from 'react';
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  FileText,
  LayoutGrid,
  List,
  Plus,
  RotateCcw,
  Star,
  X,
} from 'lucide-react';
import { Badge, Button, EmptyState, Progress } from '../../../ui/primitives';
import { Checkbox, Input, ToggleGroup, ToggleGroupItem } from '../../../ui/forms';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../../ui/overlays';
import {
  BlockHeading,
  ChoiceSelect,
  EntryDialog,
  ExportButton,
  exportCsv,
  money,
  SearchField,
  StateBadge,
  Status,
} from '../helpers';
import type { OverviewConfig, RecordItem } from '../types';

const taskFields = [
  { name: 'title', label: 'Task', type: 'text' as const, required: true },
  { name: 'detail', label: 'Project', type: 'text' as const, required: true },
  {
    name: 'priority',
    label: 'Priority',
    type: 'select' as const,
    initial: 'Normal',
    options: ['High', 'Normal', 'Low'].map((label) => ({ value: label, label })),
  },
];
export function OverviewBlock({ config }: { config: OverviewConfig }) {
  const [items, setItems] = React.useState<RecordItem[]>(() => [...config.items]);
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState('All');
  const [period, setPeriod] = React.useState('month');
  const [view, setView] = React.useState('list');
  const [plan, setPlan] = React.useState('Team');
  const [saved, setSaved] = React.useState<string[]>([]);
  const [read, setRead] = React.useState<string[]>([]);
  const [detail, setDetail] = React.useState<RecordItem | undefined>();
  const [create, setCreate] = React.useState(false);
  const [feedback, setFeedback] = React.useState('');
  const filters = [
    'All',
    ...new Set(items.map((item) => item.status).filter((value): value is string => !!value)),
  ];
  const visible = items.filter(
    (item) =>
      `${item.title} ${item.detail} ${item.owner ?? ''}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === 'All' || item.status === filter),
  );
  const update = (id: string, patch: Partial<RecordItem>) =>
    setItems(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const completed = items.filter((item) => ['Complete', 'Done'].includes(item.status ?? '')).length;
  const metric = (item: RecordItem) => {
    const value =
      (item.value ?? 0) *
      (period === 'week' && !['conversion', 'average'].includes(item.id) ? 0.27 : 1);
    return ['revenue', 'average'].includes(item.id)
      ? money(value)
      : item.id === 'conversion'
        ? `${value}%`
        : Math.round(value).toLocaleString('en-US');
  };
  const daily = [0.1, 0.12, 0.14, 0.11, 0.16, 0.18, 0.19].map((weight) =>
    Math.round((items[0]?.value ?? 100) * weight * (period === 'week' ? 0.27 : 1)),
  );
  return (
    <section data-block="overview" data-variant={config.variant}>
      <BlockHeading
        title={config.title}
        subtitle={config.subtitle}
        actions={
          config.variant === 'metrics' ? (
            <ChoiceSelect
              label="Reporting period"
              value={period}
              onChange={setPeriod}
              choices={[
                { value: 'month', label: 'This month' },
                { value: 'week', label: 'This week' },
              ]}
            />
          ) : config.variant === 'tasks' ? (
            <Button size="sm" onClick={() => setCreate(true)}>
              <Plus aria-hidden="true" />
              Add task
            </Button>
          ) : config.variant === 'usage' ? (
            <ChoiceSelect
              label="Workspace plan"
              value={plan}
              onChange={setPlan}
              choices={['Solo', 'Team', 'Studio'].map((label) => ({ value: label, label }))}
            />
          ) : (
            <ExportButton
              onClick={() =>
                exportCsv(
                  `${config.variant}.csv`,
                  ['Title', 'Details', 'Status', 'Value'],
                  visible.map((item) => [item.title, item.detail, item.status, item.value]),
                )
              }
            />
          )
        }
      />
      {config.variant === 'metrics' ? (
        <>
          <div className="pb-metrics">
            {items.map((item) => (
              <div className="pb-metric" key={item.id}>
                <span>{item.title}</span>
                <strong>{metric(item)}</strong>
                <small>
                  <ArrowUpRight size={13} aria-hidden="true" />
                  {item.detail}
                </small>
              </div>
            ))}
          </div>
          <div className="pb-sales-breakdown">
            <h3>{items[0]?.title} by day</h3>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
              <div key={day}>
                <span>{day}</span>
                <meter min={0} max={Math.max(...daily, 1)} value={daily[index]} />
                <strong>
                  {items[0]?.id === 'revenue'
                    ? money(daily[index])
                    : daily[index].toLocaleString('en-US')}
                </strong>
              </div>
            ))}
          </div>
        </>
      ) : config.variant === 'health' ? (
        <>
          <div className="pb-health-summary">
            <span className="pb-status-dot" />
            <strong>
              {items.some((item) => item.status === 'Degraded')
                ? 'One service needs attention'
                : 'All services operational'}
            </strong>
            <span>Updated 09:42 UTC</span>
          </div>
          <div className="pb-list">
            {items.map((item) => (
              <div className="pb-list-row" key={item.id}>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
                <StateBadge value={item.status ?? 'Healthy'} />
                <Button
                  size="icon"
                  variant="ghost"
                  title="Service details"
                  aria-label={`Inspect ${item.title}`}
                  onClick={() => setDetail(item)}
                >
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
        </>
      ) : config.variant === 'checklist' || config.variant === 'tasks' ? (
        <>
          {config.variant === 'checklist' && (
            <div className="pb-progress-summary">
              <strong>
                {completed} of {items.length} complete
              </strong>
              <Progress
                value={(completed / Math.max(items.length, 1)) * 100}
                aria-label="Launch readiness"
              />
            </div>
          )}
          {config.variant === 'tasks' && (
            <div className="pb-toolbar">
              <SearchField value={query} onChange={setQuery} label="Search tasks" />
              <ChoiceSelect
                label="Task priority"
                value={filter}
                onChange={setFilter}
                choices={filters.map((label) => ({ value: label, label }))}
              />
            </div>
          )}
          <div className="pb-list">
            {visible.map((item) => (
              <div className="pb-list-row" key={item.id}>
                <Checkbox
                  aria-label={`Complete ${item.title}`}
                  checked={['Complete', 'Done'].includes(item.status ?? '')}
                  onCheckedChange={(checked) =>
                    update(item.id, {
                      status: checked
                        ? 'Complete'
                        : config.variant === 'tasks'
                          ? 'Normal'
                          : 'Pending',
                    })
                  }
                />
                <span className={item.status === 'Complete' ? 'pb-completed' : ''}>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
                <StateBadge value={item.status ?? 'Pending'} />
              </div>
            ))}
          </div>
          {config.variant === 'checklist' && (
            <Button variant="ghost" size="sm" onClick={() => setItems([...config.items])}>
              <RotateCcw aria-hidden="true" />
              Reset checklist
            </Button>
          )}
        </>
      ) : config.variant === 'activity' ? (
        <>
          <div className="pb-toolbar">
            <ChoiceSelect
              label="Activity type"
              value={filter}
              onChange={setFilter}
              choices={filters.map((label) => ({ value: label, label }))}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setRead(items.map((item) => item.id));
                setFeedback('All activity marked read');
              }}
            >
              <Check aria-hidden="true" />
              Mark all read
            </Button>
          </div>
          <ol className="pb-timeline">
            {visible.map((item) => (
              <li key={item.id}>
                <span className={`pb-timeline-dot ${read.includes(item.id) ? 'pb-read' : ''}`} />
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setDetail(item);
                      setRead([...read, item.id]);
                    }}
                  >
                    {item.title}
                  </button>
                  <p>{item.detail}</p>
                  <small>
                    {item.owner} · {item.date}
                  </small>
                </div>
                <StateBadge value={item.status ?? 'Update'} />
              </li>
            ))}
          </ol>
        </>
      ) : config.variant === 'goals' ? (
        <div className="pb-goal-list">
          {items.map((item) => (
            <div key={item.id}>
              <div className="pb-row">
                <strong>{item.title}</strong>
                <StateBadge value={item.status ?? 'On track'} />
              </div>
              <p>{item.detail}</p>
              <div className="pb-goal-progress">
                <Progress value={item.value} aria-label={`${item.title} progress`} />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  aria-label={`${item.title} progress percentage`}
                  value={item.value ?? 0}
                  onChange={(event) =>
                    update(item.id, {
                      value: Math.min(100, Math.max(0, Number(event.target.value))),
                    })
                  }
                />
                <span>%</span>
              </div>
            </div>
          ))}
        </div>
      ) : config.variant === 'files' ? (
        <>
          <div className="pb-toolbar">
            <SearchField value={query} onChange={setQuery} label="Search documents" />
            <ToggleGroup
              type="single"
              value={view}
              onValueChange={(value) => value && setView(value)}
              aria-label="Document layout"
            >
              <ToggleGroupItem value="list" aria-label="List view" title="List view">
                <List aria-hidden="true" />
              </ToggleGroupItem>
              <ToggleGroupItem value="grid" aria-label="Grid view" title="Grid view">
                <LayoutGrid aria-hidden="true" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className={view === 'grid' ? 'pb-document-grid' : 'pb-list'}>
            {visible.map((item) => (
              <article className={view === 'grid' ? 'pb-document' : 'pb-list-row'} key={item.id}>
                <FileText size={22} aria-hidden="true" />
                <button type="button" className="pb-document-open" onClick={() => setDetail(item)}>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Favorite ${item.title}`}
                  title="Favorite document"
                  aria-pressed={saved.includes(item.id)}
                  onClick={() =>
                    setSaved(
                      saved.includes(item.id)
                        ? saved.filter((id) => id !== item.id)
                        : [...saved, item.id],
                    )
                  }
                >
                  <Star
                    aria-hidden="true"
                    fill={saved.includes(item.id) ? 'currentColor' : 'none'}
                  />
                </Button>
              </article>
            ))}
          </div>
        </>
      ) : config.variant === 'usage' ? (
        <>
          <div className="pb-usage-list">
            {items.map((item) => {
              const value = Math.min(
                100,
                (item.value ?? 0) * (plan === 'Solo' ? 1.7 : plan === 'Studio' ? 0.45 : 1),
              );
              return (
                <div key={item.id}>
                  <div className="pb-row">
                    <strong>{item.title}</strong>
                    <span>{Math.round(value)}%</span>
                  </div>
                  <Progress value={value} aria-label={`${item.title} utilization`} />
                  <small>
                    {plan === 'Team'
                      ? item.detail
                      : `${plan} plan · ${Math.round(100 - value)}% headroom`}
                  </small>
                </div>
              );
            })}
          </div>
          <div className="pb-usage-footer">
            <Badge variant="outline">{plan} plan</Badge>
            <span>Next reset October 31</span>
          </div>
        </>
      ) : config.variant === 'announcements' ? (
        <>
          <ChoiceSelect
            label="Audience"
            value={filter}
            onChange={setFilter}
            choices={filters.map((label) => ({ value: label, label }))}
          />
          <div className="pb-bulletins">
            {visible.map((item) => (
              <article key={item.id}>
                <div className="pb-row">
                  <StateBadge value={item.status ?? 'Everyone'} />
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Dismiss announcement"
                    aria-label={`Dismiss ${item.title}`}
                    onClick={() => setItems(items.filter((entry) => entry.id !== item.id))}
                  >
                    <X aria-hidden="true" />
                  </Button>
                </div>
                <button type="button" onClick={() => setDetail(item)}>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </button>
                <small>
                  {item.owner} · {item.date}
                </small>
              </article>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="pb-risk-summary">
            <strong>{items.filter((item) => item.status !== 'Mitigated').length}</strong>
            <span>open risks</span>
            <Badge variant="destructive">
              {items.filter((item) => item.status === 'Critical').length} critical
            </Badge>
          </div>
          <ChoiceSelect
            label="Risk severity"
            value={filter}
            onChange={setFilter}
            choices={filters.map((label) => ({ value: label, label }))}
          />
          <div className="pb-list">
            {visible.map((item) => (
              <div className="pb-list-row" key={item.id}>
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {item.detail} · {item.owner}
                  </small>
                </span>
                <StateBadge value={item.status ?? 'Low'} />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={item.status === 'Mitigated'}
                  onClick={() => {
                    update(item.id, { status: 'Mitigated', value: 0 });
                    setFeedback(`${item.title} marked mitigated`);
                  }}
                >
                  <Check aria-hidden="true" />
                  Mitigate
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
      {!visible.length && (
        <EmptyState
          title="No matching records"
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery('');
                setFilter('All');
              }}
            >
              Clear filters
            </Button>
          }
        />
      )}
      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(undefined)}>
        <DialogContent>
          <DialogTitle>{detail?.title}</DialogTitle>
          <DialogDescription>{detail?.detail}</DialogDescription>
          <dl className="pb-details">
            <div>
              <dt>Owner</dt>
              <dd>{detail?.owner ?? 'Platform team'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{detail?.status}</dd>
            </div>
          </dl>
          {config.variant === 'health' && detail?.status === 'Degraded' && (
            <Button
              onClick={() => {
                update(detail.id, { status: 'Acknowledged' });
                setFeedback(`${detail.title} incident acknowledged`);
                setDetail(undefined);
              }}
            >
              <Check aria-hidden="true" />
              Acknowledge incident
            </Button>
          )}
          {config.variant === 'files' && (
            <p className="pb-prose">
              Project overview, decisions, and next steps. The team is reviewing the current
              proposal and documenting the changes needed for the next release.
            </p>
          )}
        </DialogContent>
      </Dialog>
      <EntryDialog
        open={create}
        onOpenChange={setCreate}
        title="Add task"
        fields={taskFields}
        onSubmit={(values) => {
          setItems([
            ...items,
            {
              id: `task-${Date.now()}`,
              title: values.title,
              detail: values.detail,
              status: values.priority,
            },
          ]);
          setFeedback('Task added');
        }}
      />
      <Status>{feedback}</Status>
    </section>
  );
}
