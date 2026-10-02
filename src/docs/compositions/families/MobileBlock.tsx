import * as React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  Pause,
  Phone,
  Play,
  Plus,
  RotateCcw,
  Send,
  Star,
  Ticket,
  Wallet,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  EmptyState,
  Progress,
} from '../../../ui/primitives';
import { Checkbox, Field, Slider, Textarea } from '../../../ui/forms';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../../ui/overlays';
import {
  BlockHeading,
  ChoiceSelect,
  EntryDialog,
  money,
  SearchField,
  StateBadge,
  Status,
} from '../helpers';
import type { FormField, MobileConfig, RecordItem } from '../types';

const captureFields: FormField[] = [
  { name: 'title', label: 'Title', type: 'text', required: true },
  { name: 'detail', label: 'Details', type: 'textarea' },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    required: true,
    initial: 'Note',
    options: ['Note', 'Task', 'Idea'].map((label) => ({ value: label, label })),
  },
];
const habitFields: FormField[] = [
  { name: 'title', label: 'Routine', type: 'text', required: true },
  { name: 'detail', label: 'Daily goal', type: 'text', required: true },
];
const checkinFields: FormField[] = [
  { name: 'name', label: 'Attendee name', type: 'text', required: true },
];
export function MobileBlock({ config }: { config: MobileConfig }) {
  const [items, setItems] = React.useState<RecordItem[]>(() => [...config.items]);
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState('All');
  const [selected, setSelected] = React.useState(config.items[0]?.id ?? '');
  const [detail, setDetail] = React.useState<RecordItem | undefined>();
  const [message, setMessage] = React.useState('');
  const [replies, setReplies] = React.useState<Record<string, string[]>>({});
  const [create, setCreate] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [saved, setSaved] = React.useState<string[]>([]);
  const [feedback, setFeedback] = React.useState('');
  const [instructions, setInstructions] = React.useState('Leave with reception.');
  const [pass, setPass] = React.useState('');
  const [error, setError] = React.useState('');
  const current = items.find((item) => item.id === selected) ?? items[0];
  const visible = items.filter(
    (item) =>
      `${item.title} ${item.detail}`.toLowerCase().includes(query.toLowerCase()) &&
      (filter === 'All' || item.status === filter),
  );
  const update = (id: string, patch: Partial<RecordItem>) =>
    setItems(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  React.useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [running]);
  React.useEffect(() => {
    if (config.variant === 'player' && elapsed >= (current.value ?? 720)) setRunning(false);
  }, [elapsed, current.value, config.variant]);
  const timer = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  const composer = (
    <form
      className="pb-composer"
      onSubmit={(event) => {
        event.preventDefault();
        if (!message.trim()) {
          setError('Write a message first.');
          return;
        }
        const id = detail?.id ?? selected;
        setReplies({ ...replies, [id]: [...(replies[id] ?? []), message.trim()] });
        setMessage('');
        setError('');
        setFeedback('Message added');
      }}
    >
      <Field label="Message" error={error}>
        <Textarea
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            setError('');
          }}
        />
      </Field>
      <Button type="submit" size="sm">
        <Send aria-hidden="true" />
        Send
      </Button>
    </form>
  );
  const fields: FormField[] =
    config.variant === 'wallet'
      ? [
          {
            name: 'amount',
            label: 'Amount (USD)',
            type: 'number',
            min: 0.01,
            max: current.value,
            required: true,
          },
          {
            name: 'destination',
            label: 'Destination',
            type: 'select',
            required: true,
            options: items
              .filter((item) => item.status === 'Active' && item.id !== selected)
              .map((item) => ({ value: item.id, label: item.title })),
          },
        ]
      : config.variant === 'checkin'
        ? checkinFields
        : config.variant === 'habits'
          ? habitFields
          : config.variant === 'delivery'
            ? [
                {
                  name: 'instructions',
                  label: 'Delivery instructions',
                  type: 'textarea',
                  required: true,
                  initial: instructions,
                },
              ]
            : captureFields;
  return (
    <section data-block="mobile" data-variant={config.variant} className="pb-mobile">
      <BlockHeading
        title={config.title}
        actions={
          ['capture', 'habits'].includes(config.variant) ? (
            <Button
              variant="ghost"
              size="icon"
              title="Add item"
              aria-label="Add item"
              onClick={() => setCreate(true)}
            >
              <Plus aria-hidden="true" />
            </Button>
          ) : undefined
        }
      />
      {config.variant === 'inbox' || config.variant === 'contacts' ? (
        <>
          <SearchField
            value={query}
            onChange={setQuery}
            label={config.variant === 'inbox' ? 'Search messages' : 'Search contacts'}
          />
          {config.variant === 'inbox' && (
            <ChoiceSelect
              label="Message view"
              value={filter}
              onChange={setFilter}
              choices={['All', 'Unread', 'Read'].map((label) => ({ value: label, label }))}
            />
          )}
          <div className="pb-mobile-list">
            {visible.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  setDetail(item);
                  setSelected(item.id);
                  if (config.variant === 'inbox') update(item.id, { status: 'Read' });
                  setMessage('');
                }}
              >
                <Avatar>
                  <AvatarFallback>
                    {item.title
                      .split(' ')
                      .map((part) => part[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
                {item.status === 'Unread' ? (
                  <span className="pb-unread-dot" />
                ) : (
                  <ChevronRight size={16} aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
          {!visible.length && <EmptyState title="No matches" />}
        </>
      ) : config.variant === 'wallet' ? (
        <>
          <ChoiceSelect
            label="Wallet account"
            value={selected}
            onChange={setSelected}
            choices={items
              .filter((item) => item.status === 'Active')
              .map((item) => ({ value: item.id, label: item.title }))}
          />
          <div className="pb-wallet-balance">
            <Wallet size={24} aria-hidden="true" />
            <span>{current.title} balance</span>
            <strong>{money(current.value ?? 0)}</strong>
            <small>{current.detail}</small>
            <Button onClick={() => setCreate(true)}>
              <ArrowRight aria-hidden="true" />
              Transfer
            </Button>
          </div>
          <h3 className="pb-section-title">Recent activity</h3>
          {items
            .filter((item) => item.status !== 'Active')
            .map((item) => (
              <div className="pb-list-row" key={item.id}>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
                <strong>{money(item.value ?? 0)}</strong>
              </div>
            ))}
        </>
      ) : config.variant === 'fitness' ? (
        <>
          <div className="pb-mobile-metrics">
            {items.map((item) => (
              <div key={item.id}>
                <span>{item.title}</span>
                <strong>{item.value?.toLocaleString('en-US')}</strong>
                <small>{item.detail}</small>
              </div>
            ))}
          </div>
          <div className="pb-session">
            <Clock size={23} aria-hidden="true" />
            <span>Walking session</span>
            <output>{timer}</output>
            <div className="pb-actions">
              <Button onClick={() => setRunning(!running)}>
                {running ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
                {running ? 'Pause' : elapsed ? 'Resume' : 'Start session'}
              </Button>
              <Button
                variant="outline"
                disabled={!elapsed}
                onClick={() => {
                  setRunning(false);
                  update('move', {
                    value:
                      (items.find((item) => item.id === 'move')?.value ?? 0) +
                      Math.ceil(elapsed / 60),
                  });
                  setFeedback(`${Math.ceil(elapsed / 60)} minutes recorded`);
                  setElapsed(0);
                }}
              >
                <Check aria-hidden="true" />
                Finish
              </Button>
            </div>
          </div>
        </>
      ) : config.variant === 'delivery' ? (
        <>
          <div className="pb-delivery-estimate">
            <Badge variant="accent">Out for delivery</Badge>
            <h3>Today, 14:00-16:00</h3>
            <p>Order OBJ-1042</p>
          </div>
          <ol className="pb-mobile-timeline">
            {items.map((item) => (
              <li key={item.id} data-complete={item.status === 'Complete'}>
                <span>
                  {item.status === 'Complete' ? <Check size={14} aria-hidden="true" /> : <span />}
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </div>
              </li>
            ))}
          </ol>
          <div className="pb-delivery-instructions">
            <strong>Delivery instructions</strong>
            <p>{instructions}</p>
            <Button variant="outline" size="sm" onClick={() => setCreate(true)}>
              Edit instructions
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={items.every((item) => item.status === 'Complete')}
            onClick={() => {
              const next = items.find((item) => item.status !== 'Complete');
              if (next) update(next.id, { status: 'Complete' });
            }}
          >
            Advance delivery
          </Button>
        </>
      ) : config.variant === 'player' ? (
        <>
          <div className="pb-reading-cover">
            <span>FIELD NOTES</span>
            <strong>{current.title}</strong>
            <small>{current.owner}</small>
          </div>
          <div className="pb-row">
            <span>{current.detail}</span>
            <Button
              variant="ghost"
              size="icon"
              title="Save chapter"
              aria-label="Save chapter"
              aria-pressed={saved.includes(selected)}
              onClick={() =>
                setSaved(
                  saved.includes(selected)
                    ? saved.filter((id) => id !== selected)
                    : [...saved, selected],
                )
              }
            >
              <Star fill={saved.includes(selected) ? 'currentColor' : 'none'} aria-hidden="true" />
            </Button>
          </div>
          <Slider
            value={[Math.min(elapsed, current.value ?? 720)]}
            max={current.value ?? 720}
            step={1}
            onValueChange={(value) => setElapsed(value[0])}
            aria-label="Reading progress"
          />
          <div className="pb-row pb-caption">
            <span>{timer}</span>
            <span>{Math.floor((current.value ?? 720) / 60)}:00</span>
          </div>
          <div className="pb-reader-controls">
            <Button
              size="icon"
              variant="outline"
              title="Previous chapter"
              aria-label="Previous chapter"
              disabled={items.findIndex((item) => item.id === selected) === 0}
              onClick={() => {
                setSelected(items[items.findIndex((item) => item.id === selected) - 1].id);
                setElapsed(0);
              }}
            >
              <ArrowLeft aria-hidden="true" />
            </Button>
            <Button
              onClick={() => {
                if (!running && elapsed >= (current.value ?? 720)) setElapsed(0);
                setRunning(!running);
              }}
            >
              {running ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              {running ? 'Pause reading' : 'Start reading'}
            </Button>
            <Button
              size="icon"
              variant="outline"
              title="Next chapter"
              aria-label="Next chapter"
              disabled={items.findIndex((item) => item.id === selected) === items.length - 1}
              onClick={() => {
                setSelected(items[items.findIndex((item) => item.id === selected) + 1].id);
                setElapsed(0);
              }}
            >
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
          <div className="pb-mobile-list">
            {items.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={selected === item.id}
                onClick={() => {
                  setSelected(item.id);
                  setElapsed(0);
                  setRunning(false);
                }}
              >
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
                <Badge variant="outline">
                  {saved.includes(item.id) ? 'Saved' : `${Math.floor((item.value ?? 0) / 60)} min`}
                </Badge>
              </button>
            ))}
          </div>
        </>
      ) : config.variant === 'checkin' ? (
        pass ? (
          <div className="pb-checkin-pass">
            <Check size={30} aria-hidden="true" />
            <h3>You are checked in</h3>
            <strong>{pass}</strong>
            <p>{current.title}</p>
            <code>NS-1042-{selected.toUpperCase()}</code>
            <Button variant="outline" onClick={() => setPass('')}>
              Change attendee
            </Button>
          </div>
        ) : (
          <>
            <div className="pb-mobile-list">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected === item.id}
                  onClick={() => setSelected(item.id)}
                >
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <Badge variant="outline">{item.value} places</Badge>
                </button>
              ))}
            </div>
            <Button onClick={() => setCreate(true)}>
              <Check aria-hidden="true" />
              Check in
            </Button>
          </>
        )
      ) : config.variant === 'habits' ? (
        <>
          <div className="pb-habit-summary">
            <strong>
              {items.filter((item) => item.status === 'Complete').length}/{items.length}
            </strong>
            <span>routines completed today</span>
            <Progress
              aria-label="Daily routine progress"
              value={
                (items.filter((item) => item.status === 'Complete').length /
                  Math.max(items.length, 1)) *
                100
              }
            />
          </div>
          <div className="pb-list">
            {items.map((item) => (
              <div className="pb-list-row" key={item.id}>
                <Checkbox
                  aria-label={`Complete ${item.title}`}
                  checked={item.status === 'Complete'}
                  onCheckedChange={(value) =>
                    update(item.id, { status: value ? 'Complete' : 'Pending' })
                  }
                />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
                <Badge variant="outline">{item.value ?? 0} day streak</Badge>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setItems(items.map((item) => ({ ...item, status: 'Pending' })));
              setFeedback('Today’s progress reset');
            }}
          >
            <RotateCcw aria-hidden="true" />
            Reset today
          </Button>
        </>
      ) : config.variant === 'tickets' ? (
        <div className="pb-pass-list">
          {items.map((item) => (
            <article key={item.id}>
              <div className="pb-row">
                <Ticket size={21} aria-hidden="true" />
                <StateBadge value={item.status ?? 'Upcoming'} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
              <footer>
                <span>
                  {item.value} {item.value === 1 ? 'guest' : 'guests'}
                </span>
                <Button size="sm" variant="outline" onClick={() => setDetail(item)}>
                  View pass
                  <ChevronRight aria-hidden="true" />
                </Button>
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <>
          <SearchField label="Search captures" value={query} onChange={setQuery} />
          <ChoiceSelect
            label="Capture type"
            value={filter}
            onChange={setFilter}
            choices={['All', 'Note', 'Task', 'Idea'].map((label) => ({ value: label, label }))}
          />
          <div className="pb-capture-list">
            {visible.map((item) => (
              <button type="button" key={item.id} onClick={() => setDetail(item)}>
                <StateBadge value={item.status ?? 'Note'} />
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </button>
            ))}
          </div>
          {!visible.length && (
            <EmptyState
              title="No captures yet"
              action={
                <Button variant="outline" onClick={() => setCreate(true)}>
                  <Plus aria-hidden="true" />
                  Add capture
                </Button>
              }
            />
          )}
        </>
      )}
      <EntryDialog
        open={create}
        onOpenChange={setCreate}
        title={
          config.variant === 'wallet'
            ? 'Transfer funds'
            : config.variant === 'delivery'
              ? 'Delivery instructions'
              : config.variant === 'checkin'
                ? 'Attendee details'
                : config.variant === 'habits'
                  ? 'New routine'
                  : 'Quick capture'
        }
        fields={fields}
        onSubmit={(values) => {
          if (config.variant === 'wallet') {
            setItems([
              ...items.map((item) =>
                item.id === selected
                  ? { ...item, value: (item.value ?? 0) - Number(values.amount) }
                  : item.id === values.destination
                    ? { ...item, value: (item.value ?? 0) + Number(values.amount) }
                    : item,
              ),
              {
                id: `tx-${Date.now()}`,
                title: `Transfer to ${items.find((item) => item.id === values.destination)?.title}`,
                detail: 'Now · Transfer',
                status: 'Outgoing',
                value: -Number(values.amount),
              },
            ]);
            setFeedback('Transfer recorded');
          } else if (config.variant === 'delivery') {
            setInstructions(values.instructions);
            setFeedback('Instructions updated');
          } else if (config.variant === 'checkin') setPass(values.name);
          else {
            setItems([
              {
                id: `item-${Date.now()}`,
                title: values.title,
                detail: values.detail || '',
                status: config.variant === 'habits' ? 'Pending' : values.type,
                value: 0,
              },
              ...items,
            ]);
            setFeedback('Item added');
          }
        }}
      />
      <Dialog
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) {
            setDetail(undefined);
            setMessage('');
          }
        }}
      >
        <DialogContent>
          <DialogTitle>{detail?.title}</DialogTitle>
          <DialogDescription>{detail?.detail}</DialogDescription>
          {config.variant === 'inbox' || config.variant === 'contacts' ? (
            <>
              {config.variant === 'contacts' && (
                <div className="pb-contact-actions">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${detail?.owner?.replaceAll(' ', '')}`}>
                      <Phone aria-hidden="true" />
                      Call
                    </a>
                  </Button>
                  <Badge variant="outline">{detail?.status}</Badge>
                </div>
              )}
              <div className="pb-chat-bubble">{detail?.detail}</div>
              {detail &&
                replies[detail.id]?.map((reply, index) => (
                  <div key={index} className="pb-chat-bubble pb-chat-own">
                    {reply}
                  </div>
                ))}
              {composer}
            </>
          ) : config.variant === 'tickets' ? (
            <div className="pb-checkin-pass">
              <Ticket size={28} aria-hidden="true" />
              <code>{detail?.id}</code>
              <p>{detail?.value} guests</p>
              <Button
                disabled={detail?.status === 'Attended'}
                onClick={() => {
                  if (detail) update(detail.id, { status: 'Attended' });
                  setDetail(undefined);
                  setFeedback('Attendance recorded');
                }}
              >
                <Check aria-hidden="true" />
                Mark attended
              </Button>
            </div>
          ) : (
            <Badge variant="outline">{detail?.status}</Badge>
          )}
        </DialogContent>
      </Dialog>
      <Status>{feedback}</Status>
    </section>
  );
}
