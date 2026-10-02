import * as React from 'react';
import type { DateRange } from 'react-day-picker';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock, Plus } from 'lucide-react';
import { Badge, Button, EmptyState, Spinner } from '../../../ui/primitives';
import { Field, Input, Slider, Switch } from '../../../ui/forms';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../../ui/overlays';
import { BlockHeading, ChoiceSelect, EntryDialog, StateBadge, Status } from '../helpers';
import type { RecordItem, ScheduleConfig } from '../types';

const Calendar = React.lazy(() =>
  import('../../../ui/calendar').then((module) => ({ default: module.Calendar })),
);
const contactFields = [
  { name: 'name', label: 'Your name', type: 'text' as const, required: true },
  { name: 'email', label: 'Email', type: 'email' as const, required: true },
];
const eventFields = [
  { name: 'title', label: 'Event title', type: 'text' as const, required: true },
  { name: 'time', label: 'Start time', type: 'time' as const, required: true },
  { name: 'detail', label: 'Location', type: 'text' as const },
];
function localDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}
function dateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function SchedulingBlock({ config }: { config: ScheduleConfig }) {
  const [items, setItems] = React.useState<RecordItem[]>(() => [...config.items]);
  const [date, setDate] = React.useState(config.date);
  const [slot, setSlot] = React.useState(config.slots[0]);
  const [selected, setSelected] = React.useState(config.items[0]?.id ?? '');
  const [range, setRange] = React.useState<DateRange | undefined>();
  const [type, setType] = React.useState(config.slots[0]);
  const [count, setCount] = React.useState(1);
  const [hour, setHour] = React.useState(14);
  const [filter, setFilter] = React.useState('All');
  const [create, setCreate] = React.useState(false);
  const [detail, setDetail] = React.useState<RecordItem | undefined>();
  const [booking, setBooking] = React.useState<
    { name: string; date: string; slot: string; resource: string } | undefined
  >();
  const [feedback, setFeedback] = React.useState('');
  const [eventDates, setEventDates] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(config.items.map((item) => [item.id, config.date])),
  );
  const [hours, setHours] = React.useState<Record<string, { start: string; end: string }>>(() =>
    Object.fromEntries(
      config.items.map((item) => {
        const parts = item.detail.split(/[-–]/);
        return [
          item.id,
          { start: /^\d/.test(parts[0]) ? parts[0] : '09:00', end: parts[1] ?? '17:00' },
        ];
      }),
    ),
  );
  const changeDay = (delta: number) => {
    const next = localDate(date);
    next.setDate(next.getDate() + delta);
    setDate(dateString(next));
    setFeedback('');
  };
  const update = (id: string, status: string) =>
    setItems(items.map((item) => (item.id === id ? { ...item, status } : item)));
  const selectedItem = items.find((item) => item.id === selected) ?? items[0];
  const days =
    range?.from && range.to
      ? Math.round(
          (Date.UTC(range.to.getFullYear(), range.to.getMonth(), range.to.getDate()) -
            Date.UTC(range.from.getFullYear(), range.from.getMonth(), range.from.getDate())) /
            86400000,
        ) + 1
      : 0;
  const dayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(localDate(date));
  const slots = (
    <fieldset className="pb-slot-fieldset">
      <legend>Available times</legend>
      <div className="pb-time-slots">
        {config.slots.map((time) => (
          <button
            type="button"
            key={time}
            aria-pressed={slot === time}
            onClick={() => setSlot(time)}
          >
            {time}
          </button>
        ))}
      </div>
    </fieldset>
  );
  return (
    <section data-block="scheduling" data-variant={config.variant}>
      <BlockHeading
        title={config.title}
        subtitle={config.subtitle}
        actions={
          ['agenda', 'week', 'deadline'].includes(config.variant) ? (
            <Button size="sm" variant="outline" onClick={() => setCreate(true)}>
              <Plus aria-hidden="true" />
              Add event
            </Button>
          ) : undefined
        }
      />
      {booking ? (
        <div className="pb-booking-result">
          <Check size={30} aria-hidden="true" />
          <h3>{config.variant === 'range' ? 'Leave request recorded' : 'Reservation recorded'}</h3>
          <dl className="pb-details">
            <div>
              <dt>Name</dt>
              <dd>{booking.name}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{booking.date}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{booking.slot}</dd>
            </div>
            <div>
              <dt>Reservation</dt>
              <dd>{booking.resource}</dd>
            </div>
          </dl>
          <Button
            variant="outline"
            onClick={() => {
              setBooking(undefined);
              setFeedback('Reservation canceled');
            }}
          >
            Cancel reservation
          </Button>
        </div>
      ) : config.variant === 'booking' ? (
        <div className="pb-booking-layout">
          <React.Suspense fallback={<Spinner label="Loading calendar" />}>
            <Calendar
              mode="single"
              required
              selected={localDate(date)}
              defaultMonth={localDate(config.date)}
              onSelect={(value) => value && setDate(dateString(value))}
              disabled={{ before: localDate(config.date) }}
            />
          </React.Suspense>
          <div>
            <h3>{dayLabel}</h3>
            {slots}
            <div className="pb-row">
              <Clock size={16} aria-hidden="true" />
              <span>30 minutes · Europe/London</span>
            </div>
            <Button onClick={() => setCreate(true)}>
              <ArrowRight aria-hidden="true" />
              Continue
            </Button>
          </div>
        </div>
      ) : config.variant === 'agenda' ? (
        <>
          <div className="pb-date-navigation">
            <Button
              size="icon"
              variant="outline"
              aria-label="Previous day"
              title="Previous day"
              onClick={() => changeDay(-1)}
            >
              <ArrowLeft aria-hidden="true" />
            </Button>
            <Input
              aria-label="Agenda date"
              type="date"
              value={date}
              onChange={(event) => event.target.value && setDate(event.target.value)}
            />
            <Button
              size="icon"
              variant="outline"
              aria-label="Next day"
              title="Next day"
              onClick={() => changeDay(1)}
            >
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
          <div className="pb-agenda">
            {items
              .filter((item) => eventDates[item.id] === date)
              .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
              .map((item) => (
                <div key={item.id}>
                  <time>{item.date}</time>
                  <button type="button" onClick={() => setDetail(item)}>
                    <strong>{item.title}</strong>
                    <small>
                      {item.detail} · {item.value ?? 30} min
                    </small>
                  </button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Complete ${item.title}`}
                    title="Mark complete"
                    disabled={item.status === 'Complete'}
                    onClick={() => update(item.id, 'Complete')}
                  >
                    <Check aria-hidden="true" />
                  </Button>
                </div>
              ))}
            {!items.some((item) => eventDates[item.id] === date) && (
              <EmptyState
                title="No events scheduled"
                action={
                  <Button variant="outline" onClick={() => setCreate(true)}>
                    <Plus aria-hidden="true" />
                    Add event
                  </Button>
                }
              />
            )}
          </div>
        </>
      ) : config.variant === 'week' ? (
        <div className="pb-week-scroll">
          <div className="pb-week-grid">
            {config.slots.map((day) => (
              <div key={day}>
                <h3>{day}</h3>
                {items
                  .filter((item) => item.status === day)
                  .map((item) => (
                    <article key={item.id}>
                      <button type="button" onClick={() => setDetail(item)}>
                        <strong>{item.title}</strong>
                        <small>{item.detail}</small>
                      </button>
                      <ChoiceSelect
                        label={`Move ${item.title} to day`}
                        value={item.status ?? day}
                        onChange={(value) => update(item.id, value)}
                        choices={config.slots.map((label) => ({ value: label, label }))}
                      />
                    </article>
                  ))}
                {!items.some((item) => item.status === day) && (
                  <span className="pb-caption">No events</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : config.variant === 'availability' ? (
        <>
          <div className="pb-availability">
            {items.map((item) => (
              <div key={item.id}>
                <Switch
                  checked={item.status === 'Available'}
                  aria-label={`${item.title} available`}
                  onCheckedChange={(value) => update(item.id, value ? 'Available' : 'Unavailable')}
                />
                <strong>{item.title}</strong>
                {item.status === 'Available' ? (
                  <>
                    <Input
                      type="time"
                      aria-label={`${item.title} start time`}
                      value={hours[item.id].start}
                      onChange={(event) =>
                        setHours({
                          ...hours,
                          [item.id]: { ...hours[item.id], start: event.target.value },
                        })
                      }
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      aria-label={`${item.title} end time`}
                      value={hours[item.id].end}
                      onChange={(event) =>
                        setHours({
                          ...hours,
                          [item.id]: { ...hours[item.id], end: event.target.value },
                        })
                      }
                    />
                  </>
                ) : (
                  <span>Unavailable</span>
                )}
              </div>
            ))}
          </div>
          <Button
            onClick={() => {
              const invalid = items.find(
                (item) =>
                  item.status === 'Available' &&
                  (!hours[item.id].start ||
                    !hours[item.id].end ||
                    hours[item.id].start >= hours[item.id].end),
              );
              setFeedback(
                invalid
                  ? `${invalid.title}: end time must follow start time.`
                  : 'Availability saved',
              );
            }}
          >
            <Check aria-hidden="true" />
            Save availability
          </Button>
        </>
      ) : config.variant === 'shifts' ? (
        <>
          <div className="pb-shift-summary">
            {config.slots.map((shift) => (
              <div key={shift}>
                <span>{shift}</span>
                <strong>{items.filter((item) => item.status === shift).length} people</strong>
              </div>
            ))}
          </div>
          <div className="pb-list">
            {items.map((item) => (
              <div className="pb-list-row" key={item.id}>
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {item.detail} · {item.value} hours
                  </small>
                </span>
                <ChoiceSelect
                  value={item.status ?? config.slots[0]}
                  onChange={(value) => update(item.id, value)}
                  label={`Shift for ${item.title}`}
                  choices={config.slots.map((label) => ({ value: label, label }))}
                />
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => setFeedback('Roster saved')}>
            <Check aria-hidden="true" />
            Save roster
          </Button>
        </>
      ) : config.variant === 'rooms' || config.variant === 'event' ? (
        <>
          <div className="pb-resource-options">
            {items.map((item) => (
              <button
                type="button"
                aria-pressed={selected === item.id}
                disabled={item.status === 'Reserved'}
                key={item.id}
                onClick={() => {
                  setSelected(item.id);
                  setCount(1);
                }}
              >
                <CalendarDays size={20} aria-hidden="true" />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                  <small>
                    {item.value} {config.variant === 'event' ? 'places available' : 'seats'}
                  </small>
                </span>
                <StateBadge value={item.status ?? 'Available'} />
              </button>
            ))}
          </div>
          {slots}
          {config.variant === 'event' && (
            <Field label="Attendees">
              <Input
                type="number"
                min={1}
                max={selectedItem.value}
                value={count}
                onChange={(event) =>
                  setCount(
                    Math.max(1, Math.min(selectedItem.value ?? 1, Number(event.target.value))),
                  )
                }
              />
            </Field>
          )}
          <Button disabled={selectedItem.status === 'Reserved'} onClick={() => setCreate(true)}>
            <ArrowRight aria-hidden="true" />
            {config.variant === 'event' ? 'Register' : 'Reserve room'}
          </Button>
        </>
      ) : config.variant === 'deadline' ? (
        <>
          <ChoiceSelect
            label="Milestone status"
            value={filter}
            onChange={setFilter}
            choices={['All', 'Upcoming', 'Complete'].map((label) => ({ value: label, label }))}
          />
          <ol className="pb-timeline">
            {items
              .filter((item) => filter === 'All' || item.status === filter)
              .map((item) => (
                <li key={item.id}>
                  <span className="pb-timeline-dot" />
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                    <small>
                      {item.owner} · {item.date}
                    </small>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={item.status === 'Complete'}
                    onClick={() => update(item.id, 'Complete')}
                  >
                    <Check aria-hidden="true" />
                    {item.status === 'Complete' ? 'Complete' : 'Complete milestone'}
                  </Button>
                </li>
              ))}
          </ol>
        </>
      ) : config.variant === 'range' ? (
        <>
          <ChoiceSelect
            label="Leave type"
            value={type}
            onChange={setType}
            choices={config.slots.map((label) => ({ value: label, label }))}
          />
          <React.Suspense fallback={<Spinner label="Loading date range" />}>
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              defaultMonth={localDate(config.date)}
              disabled={{ before: localDate(config.date) }}
            />
          </React.Suspense>
          <div className="pb-row">
            <strong>
              {days} {days === 1 ? 'day' : 'days'}
            </strong>
            <Badge variant="outline">{config.items[0].value} available</Badge>
          </div>
          {days > (config.items[0].value ?? 18) && (
            <p role="alert">This range exceeds your remaining allowance.</p>
          )}
          <Button
            disabled={!days || days > (config.items[0].value ?? 18)}
            onClick={() => setCreate(true)}
          >
            <Check aria-hidden="true" />
            Request leave
          </Button>
        </>
      ) : (
        <>
          <div className="pb-timezone-control">
            <strong>{String(hour).padStart(2, '0')}:00 UTC</strong>
            <Slider
              min={0}
              max={23}
              step={1}
              value={[hour]}
              onValueChange={(value) => setHour(value[0])}
              aria-label="Meeting hour in UTC"
            />
          </div>
          <div className="pb-timezone-list">
            {items.map((item) => {
              const at = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00Z`);
              const localHour = Number(
                new Intl.DateTimeFormat('en-US', {
                  timeZone: item.detail,
                  hour: 'numeric',
                  hourCycle: 'h23',
                }).format(at),
              );
              return (
                <div key={item.id}>
                  <span>
                    <strong>{item.title}</strong>
                    <small>
                      {item.status} · {item.detail}
                    </small>
                  </span>
                  <time>
                    {new Intl.DateTimeFormat('en-GB', {
                      timeZone: item.detail,
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(at)}
                  </time>
                  <Badge variant={localHour >= 9 && localHour < 18 ? 'accent' : 'outline'}>
                    {localHour >= 9 && localHour < 18 ? 'Working hours' : 'Outside hours'}
                  </Badge>
                </div>
              );
            })}
          </div>
          <Button
            variant="outline"
            onClick={() =>
              setFeedback(`Meeting selected for ${String(hour).padStart(2, '0')}:00 UTC`)
            }
          >
            <Check aria-hidden="true" />
            Select this time
          </Button>
        </>
      )}
      <EntryDialog
        open={create}
        onOpenChange={setCreate}
        title={
          ['agenda', 'week', 'deadline'].includes(config.variant)
            ? 'Add event'
            : 'Reservation details'
        }
        fields={
          ['agenda', 'week', 'deadline'].includes(config.variant) ? eventFields : contactFields
        }
        action={['agenda', 'week', 'deadline'].includes(config.variant) ? 'Add event' : 'Confirm'}
        onSubmit={(values) => {
          if (['agenda', 'week', 'deadline'].includes(config.variant)) {
            const id = `event-${Date.now()}`;
            setItems([
              ...items,
              {
                id,
                title: values.title,
                detail: values.detail || 'Team event',
                date: config.variant === 'deadline' ? date : values.time,
                status:
                  config.variant === 'week'
                    ? config.slots[0]
                    : config.variant === 'deadline'
                      ? 'Upcoming'
                      : 'Scheduled',
                value: 30,
              },
            ]);
            setEventDates({ ...eventDates, [id]: date });
            setFeedback('Event added');
          } else
            setBooking({
              name: values.name,
              date:
                config.variant === 'range' && range?.from && range.to
                  ? `${dateString(range.from)} to ${dateString(range.to)}`
                  : dayLabel,
              slot: config.variant === 'range' ? `${days} days` : slot,
              resource:
                config.variant === 'range'
                  ? type
                  : `${selectedItem?.title ?? config.title}${config.variant === 'event' ? ` · ${count} attendees` : ''}`,
            });
        }}
      />
      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(undefined)}>
        <DialogContent>
          <DialogTitle>{detail?.title}</DialogTitle>
          <DialogDescription>{detail?.detail}</DialogDescription>
          <dl className="pb-details">
            <div>
              <dt>Owner</dt>
              <dd>{detail?.owner ?? 'Team'}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{detail?.value} minutes</dd>
            </div>
            <div>
              <dt>Schedule</dt>
              <dd>{detail?.date ?? detail?.status}</dd>
            </div>
          </dl>
        </DialogContent>
      </Dialog>
      <Status>{feedback}</Status>
    </section>
  );
}
