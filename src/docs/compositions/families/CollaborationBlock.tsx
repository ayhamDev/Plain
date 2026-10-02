import * as React from 'react';
import { Check, Download, MessageSquare, Plus, Send, ThumbsUp, Trash2 } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  EmptyState,
  Progress,
} from '../../../ui/primitives';
import { Checkbox, Field, Textarea } from '../../../ui/forms';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../../ui/overlays';
import {
  BlockHeading,
  ChoiceSelect,
  downloadText,
  EntryDialog,
  SearchField,
  StateBadge,
  Status,
} from '../helpers';
import type { CollaborationConfig, RecordItem } from '../types';

const taskFields = [
  { name: 'title', label: 'Title', type: 'text' as const, required: true },
  { name: 'detail', label: 'Details', type: 'textarea' as const, required: true },
  { name: 'owner', label: 'Owner', type: 'text' as const },
];
const inviteFields = [
  { name: 'name', label: 'Full name', type: 'text' as const, required: true },
  { name: 'email', label: 'Email', type: 'email' as const, required: true },
];
export function CollaborationBlock({ config }: { config: CollaborationConfig }) {
  const [items, setItems] = React.useState<RecordItem[]>(() => [...config.items]);
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState('All');
  const [selected, setSelected] = React.useState(config.items[0]?.id ?? '');
  const [detail, setDetail] = React.useState<RecordItem | undefined>();
  const [message, setMessage] = React.useState('');
  const [replies, setReplies] = React.useState<Record<string, string[]>>({});
  const [liked, setLiked] = React.useState<string[]>([]);
  const [draftVote, setDraftVote] = React.useState('');
  const [vote, setVote] = React.useState('');
  const [notes, setNotes] = React.useState(() =>
    config.items
      .filter((item) => !item.status)
      .map((item) => `${item.title}\n${item.detail}`)
      .join('\n\n'),
  );
  const [create, setCreate] = React.useState(false);
  const [feedback, setFeedback] = React.useState('');
  const [error, setError] = React.useState('');
  const visible = items.filter(
    (item) =>
      `${item.title} ${item.detail} ${item.owner ?? ''}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === 'All' || item.status === filter),
  );
  const current = items.find((item) => item.id === selected) ?? items[0];
  const update = (id: string, patch: Partial<RecordItem>) =>
    setItems(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const send = (event: React.FormEvent) => {
    event.preventDefault();
    if (!message.trim()) {
      setError('Write a message first.');
      return;
    }
    if (config.variant === 'thread')
      setItems([
        ...items,
        {
          id: `message-${Date.now()}`,
          title: 'You',
          detail: message.trim(),
          owner: 'You',
          date: 'Now',
          value: 0,
        },
      ]);
    else setReplies({ ...replies, [selected]: [...(replies[selected] ?? []), message.trim()] });
    setMessage('');
    setError('');
    setFeedback('Message added');
  };
  const composer = (
    <form className="pb-composer" noValidate onSubmit={send}>
      <Field label="Message" error={error}>
        <Textarea
          value={message}
          placeholder="Write a message..."
          onChange={(event) => {
            setMessage(event.target.value);
            setError('');
          }}
        />
      </Field>
      <Button size="sm" type="submit">
        <Send aria-hidden="true" />
        Send
      </Button>
    </form>
  );
  return (
    <section data-block="collaboration" data-variant={config.variant}>
      <BlockHeading
        title={config.title}
        subtitle={config.subtitle}
        actions={
          ['board', 'members', 'handoff'].includes(config.variant) ? (
            <Button size="sm" variant="outline" onClick={() => setCreate(true)}>
              <Plus aria-hidden="true" />
              {config.variant === 'members' ? 'Invite member' : 'Add item'}
            </Button>
          ) : undefined
        }
      />
      {config.variant === 'board' ? (
        <>
          <SearchField label="Search board" value={query} onChange={setQuery} />
          <div className="pb-board-scroll">
            <div className="pb-board">
              {(config.choices ?? ['To do', 'In progress', 'Done']).map((stage) => (
                <section className="pb-board-column" key={stage}>
                  <header>
                    <h3>{stage}</h3>
                    <Badge variant="outline">
                      {visible.filter((item) => item.status === stage).length}
                    </Badge>
                  </header>
                  {visible
                    .filter((item) => item.status === stage)
                    .map((item) => (
                      <article className="pb-task-card" key={item.id}>
                        <button type="button" onClick={() => setDetail(item)}>
                          <strong>{item.title}</strong>
                          <p>{item.detail}</p>
                        </button>
                        <footer>
                          <Avatar size="sm">
                            <AvatarFallback>
                              {(item.owner ?? 'You').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <ChoiceSelect
                            label={`Move ${item.title}`}
                            value={item.status ?? stage}
                            onChange={(value) => update(item.id, { status: value })}
                            choices={(config.choices ?? []).map((label) => ({
                              value: label,
                              label,
                            }))}
                          />
                        </footer>
                      </article>
                    ))}
                </section>
              ))}
            </div>
          </div>
        </>
      ) : config.variant === 'thread' ? (
        <>
          <div className="pb-message-thread" aria-live="polite">
            {items.map((item) => (
              <article key={item.id}>
                <Avatar size="sm">
                  <AvatarFallback>{item.title.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <header>
                    <strong>{item.title}</strong>
                    <time>{item.date}</time>
                  </header>
                  <p>{item.detail}</p>
                  <Button
                    variant="ghost"
                    size="xs"
                    aria-pressed={liked.includes(item.id)}
                    aria-label={`React to ${item.title}'s message`}
                    onClick={() =>
                      setLiked(
                        liked.includes(item.id)
                          ? liked.filter((id) => id !== item.id)
                          : [...liked, item.id],
                      )
                    }
                  >
                    <ThumbsUp aria-hidden="true" />
                    {(item.value ?? 0) + (liked.includes(item.id) ? 1 : 0)}
                  </Button>
                </div>
              </article>
            ))}
          </div>
          {composer}
        </>
      ) : config.variant === 'comments' ? (
        <>
          <ChoiceSelect
            label="Comment status"
            value={filter}
            onChange={setFilter}
            choices={['All', 'Open', 'Resolved'].map((label) => ({ value: label, label }))}
          />
          <div className="pb-comments">
            {visible.map((item) => (
              <article key={item.id}>
                <header>
                  <strong>{item.owner}</strong>
                  <time>{item.date}</time>
                  <StateBadge value={item.status ?? 'Open'} />
                </header>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
                {replies[item.id]?.map((reply, index) => (
                  <p className="pb-reply" key={index}>
                    <strong>You</strong> {reply}
                  </p>
                ))}
                <div className="pb-actions">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelected(item.id);
                      setDetail(item);
                    }}
                  >
                    <MessageSquare aria-hidden="true" />
                    Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      update(item.id, { status: item.status === 'Resolved' ? 'Open' : 'Resolved' })
                    }
                  >
                    <Check aria-hidden="true" />
                    {item.status === 'Resolved' ? 'Reopen' : 'Resolve'}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : config.variant === 'members' ? (
        <>
          <SearchField label="Search members" value={query} onChange={setQuery} />
          <div className="pb-list">
            {visible.map((item) => (
              <div className="pb-list-row" key={item.id}>
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
                <ChoiceSelect
                  label={`Role for ${item.title}`}
                  value={item.status ?? 'Viewer'}
                  onChange={(value) => update(item.id, { status: value })}
                  choices={(config.choices ?? ['Owner', 'Editor', 'Viewer']).map((label) => ({
                    value: label,
                    label,
                  }))}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Remove ${item.title}`}
                  title="Remove member"
                  disabled={item.status === 'Owner'}
                  onClick={() => {
                    setItems(items.filter((entry) => entry.id !== item.id));
                    setFeedback('Member removed');
                  }}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
        </>
      ) : config.variant === 'approval' ? (
        <>
          <div className="pb-approval-summary">
            <strong>
              {items.filter((item) => item.status === 'Approved').length} / {items.length}
            </strong>
            <span>checkpoints approved</span>
            <Progress
              value={
                (items.filter((item) => item.status === 'Approved').length / items.length) * 100
              }
              aria-label="Release approval progress"
            />
          </div>
          <ol className="pb-approval-chain">
            {items.map((item, index) => (
              <li key={item.id}>
                <span className="pb-step-number">{index + 1}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                  <small>{item.owner}</small>
                </div>
                <StateBadge value={item.status ?? 'Pending'} />
                <div className="pb-actions">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={item.status === 'Approved'}
                    onClick={() => update(item.id, { status: 'Approved' })}
                  >
                    <Check aria-hidden="true" />
                    Approve
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      update(item.id, { status: 'Changes requested' });
                      setFeedback(`${item.title}: changes requested`);
                    }}
                  >
                    Request changes
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        </>
      ) : config.variant === 'notes' ? (
        <>
          <Field label="Meeting notes">
            <Textarea rows={8} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </Field>
          <h3 className="pb-section-title">Action items</h3>
          <div className="pb-list">
            {items
              .filter((item) => item.status)
              .map((item) => (
                <div className="pb-list-row" key={item.id}>
                  <Checkbox
                    aria-label={`Complete ${item.title}`}
                    checked={item.status === 'Complete'}
                    onCheckedChange={(value) =>
                      update(item.id, { status: value ? 'Complete' : 'Open' })
                    }
                  />
                  <span>
                    <strong>{item.title}</strong>
                    <small>
                      {item.owner} · {item.detail}
                    </small>
                  </span>
                </div>
              ))}
          </div>
          <Button onClick={() => setFeedback('Meeting notes saved')}>
            <Check aria-hidden="true" />
            Save notes
          </Button>
        </>
      ) : config.variant === 'poll' ? (
        <form
          className="pb-poll"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draftVote) {
              setFeedback('Choose an option.');
              return;
            }
            setVote(draftVote);
            setFeedback('Vote recorded');
          }}
        >
          <fieldset>
            <legend className="sr-only">Meeting time</legend>
            {items.map((item) => {
              const total =
                items.reduce((sum, option) => sum + (option.value ?? 0), 0) + (vote ? 1 : 0);
              const count = (item.value ?? 0) + (vote === item.id ? 1 : 0);
              return (
                <label key={item.id}>
                  <input
                    type="radio"
                    name="meeting-vote"
                    value={item.id}
                    checked={draftVote === item.id}
                    onChange={() => setDraftVote(item.id)}
                  />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                    <Progress
                      value={(count / Math.max(total, 1)) * 100}
                      aria-label={`${item.title}: ${count} votes`}
                    />
                  </span>
                  <b>{count}</b>
                </label>
              );
            })}
          </fieldset>
          <Button type="submit">
            <Check aria-hidden="true" />
            {vote ? 'Change vote' : 'Vote'}
          </Button>
        </form>
      ) : config.variant === 'inbox' ? (
        <div className="pb-shared-inbox">
          <aside>
            <SearchField value={query} onChange={setQuery} label="Search conversations" />
            {visible.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={selected === item.id}
                onClick={() => {
                  setSelected(item.id);
                  update(item.id, { status: 'Read' });
                  setMessage('');
                }}
              >
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
                {item.status === 'Unread' && <span className="pb-unread-dot" />}
              </button>
            ))}
          </aside>
          <div className="pb-conversation">
            <header>
              <h3>{current.title}</h3>
              <Badge variant="outline">{current.owner}</Badge>
            </header>
            <div className="pb-chat-bubble">{current.detail}</div>
            {replies[current.id]?.map((reply, index) => (
              <div key={index} className="pb-chat-bubble pb-chat-own">
                {reply}
              </div>
            ))}
            {composer}
          </div>
        </div>
      ) : config.variant === 'handoff' ? (
        <>
          <div className="pb-progress-summary">
            <strong>
              {items.filter((item) => item.status === 'Complete').length} of {items.length} complete
            </strong>
            <Progress
              aria-label="Handoff completion"
              value={
                (items.filter((item) => item.status === 'Complete').length / items.length) * 100
              }
            />
          </div>
          <div className="pb-list">
            {items.map((item) => (
              <div className="pb-list-row" key={item.id}>
                <Checkbox
                  aria-label={`Acknowledge ${item.title}`}
                  checked={item.status === 'Complete'}
                  onCheckedChange={(value) =>
                    update(item.id, { status: value ? 'Complete' : 'Open' })
                  }
                />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
              </div>
            ))}
          </div>
          <Button
            disabled={items.some((item) => item.status !== 'Complete')}
            onClick={() => setFeedback('Handoff acknowledged')}
          >
            <Check aria-hidden="true" />
            Acknowledge handoff
          </Button>
        </>
      ) : (
        <>
          <div className="pb-list">
            {items.map((item) => (
              <div className="pb-list-row" key={item.id}>
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {item.detail} · {item.owner}
                  </small>
                </span>
                <StateBadge value={item.status ?? 'Review'} />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={item.status === 'Approved'}
                  onClick={() => update(item.id, { status: 'Approved' })}
                >
                  <Check aria-hidden="true" />
                  Approve
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  title="Download manifest"
                  aria-label={`Download ${item.title} manifest`}
                  onClick={() =>
                    downloadText(
                      `${item.id}-manifest.json`,
                      JSON.stringify(item, null, 2),
                      'application/json',
                    )
                  }
                >
                  <Download aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
      {!visible.length && <EmptyState title="No matching items" />}
      <EntryDialog
        open={create}
        onOpenChange={setCreate}
        title={config.variant === 'members' ? 'Invite member' : 'Add item'}
        fields={config.variant === 'members' ? inviteFields : taskFields}
        onSubmit={(values) => {
          setItems([
            ...items,
            {
              id: `item-${Date.now()}`,
              title: values.title || values.name,
              detail: values.detail || values.email,
              owner: values.owner || 'You',
              status:
                config.variant === 'board'
                  ? (config.choices?.[0] ?? 'To do')
                  : config.variant === 'members'
                    ? 'Viewer'
                    : 'Open',
            },
          ]);
          setFeedback(config.variant === 'members' ? 'Invitation recorded' : 'Item added');
        }}
      />
      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(undefined)}>
        <DialogContent>
          <DialogTitle>{detail?.title}</DialogTitle>
          <DialogDescription>{detail?.detail}</DialogDescription>
          {config.variant === 'comments' ? (
            composer
          ) : (
            <dl className="pb-details">
              <div>
                <dt>Owner</dt>
                <dd>{detail?.owner}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{detail?.status}</dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>
      <Status>{feedback}</Status>
    </section>
  );
}
