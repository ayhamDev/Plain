import * as React from 'react';
import {
  Check,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  Plus,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import { Badge, Button, EmptyState } from '../../../ui/primitives';
import { Checkbox, Field, Input, Switch } from '../../../ui/forms';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../../ui/overlays';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/navigation';
import {
  BlockHeading,
  ChoiceSelect,
  downloadText,
  EntryDialog,
  SearchField,
  Status,
} from '../helpers';
import type { SettingItem, SettingsConfig } from '../types';

const nameFields = [{ name: 'name', label: 'Name', type: 'text' as const, required: true }];
const memberFields = [
  { name: 'name', label: 'Full name', type: 'text' as const, required: true },
  { name: 'email', label: 'Email', type: 'email' as const, required: true },
];
export function SettingsBlock({ config }: { config: SettingsConfig }) {
  const [items, setItems] = React.useState<SettingItem[]>(() =>
    config.items.map((item) => ({ ...item })),
  );
  const [saved, setSaved] = React.useState(() => JSON.stringify(config.items));
  const [query, setQuery] = React.useState('');
  const [revealed, setRevealed] = React.useState<string[]>([]);
  const [interval, setInterval] = React.useState('Monthly');
  const [create, setCreate] = React.useState(false);
  const [detail, setDetail] = React.useState<SettingItem | undefined>();
  const [consent, setConsent] = React.useState(false);
  const [confirm, setConfirm] = React.useState('');
  const [lifecycle, setLifecycle] = React.useState<'active' | 'archived' | 'deleted'>('active');
  const [feedback, setFeedback] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [channels, setChannels] = React.useState<Record<string, Record<string, boolean>>>(() =>
    Object.fromEntries(
      config.items.map((item) => [
        item.id,
        { Email: item.enabled ?? false, Push: item.enabled ?? false, Digest: item.id === 'digest' },
      ]),
    ),
  );
  const [savedChannels, setSavedChannels] = React.useState(() => JSON.stringify(channels));
  const dirty = JSON.stringify(items) !== saved || JSON.stringify(channels) !== savedChannels;
  const update = (id: string, patch: Partial<SettingItem>) =>
    setItems(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const visible = items.filter((item) =>
    `${item.label} ${item.detail}`.toLowerCase().includes(query.toLowerCase()),
  );
  const save = () => {
    const next: Record<string, string> = {};
    const invalid = items.find(
      (item) => item.id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.value ?? ''),
    );
    if (invalid) {
      next.email = 'Enter a valid email address.';
    }
    if (items.some((item) => item.id === 'name' && !item.value?.trim())) {
      next.name = 'A name is required.';
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaved(JSON.stringify(items));
    setSavedChannels(JSON.stringify(channels));
    setErrors({});
    setFeedback('Changes saved');
  };
  const saveBar = (
    <div className="pb-settings-save">
      <span>{dirty ? 'Unsaved changes' : 'Up to date'}</span>
      <Button
        variant="outline"
        size="sm"
        disabled={!dirty}
        onClick={() => {
          setItems(JSON.parse(saved) as SettingItem[]);
          setChannels(JSON.parse(savedChannels) as Record<string, Record<string, boolean>>);
          setErrors({});
        }}
      >
        Discard
      </Button>
      <Button size="sm" disabled={!dirty} onClick={save}>
        <Check aria-hidden="true" />
        Save changes
      </Button>
    </div>
  );
  return (
    <section data-block="settings" data-variant={config.variant}>
      <BlockHeading
        title={config.title}
        actions={
          ['api', 'team'].includes(config.variant) ? (
            <Button size="sm" variant="outline" onClick={() => setCreate(true)}>
              <Plus aria-hidden="true" />
              {config.variant === 'api' ? 'Create key' : 'Invite member'}
            </Button>
          ) : undefined
        }
      />
      {config.variant === 'profile' ||
      config.variant === 'workspace' ||
      config.variant === 'billing' ? (
        <>
          {config.variant === 'billing' && (
            <div className="pb-plan-summary">
              <Badge variant="accent">{items[0]?.value} plan</Badge>
              <ChoiceSelect
                label="Billing interval"
                value={interval}
                onChange={(value) => {
                  setInterval(value);
                  setFeedback(`${value} billing selected`);
                }}
                choices={['Monthly', 'Annual'].map((label) => ({ value: label, label }))}
              />
            </div>
          )}
          <div className="pb-settings-fields">
            {items.map((item) => (
              <Field
                label={item.label}
                description={item.detail}
                key={item.id}
                error={errors[item.id]}
              >
                {item.id === 'timezone' || item.id === 'visibility' || item.id === 'plan' ? (
                  <ChoiceSelect
                    label={item.label}
                    value={item.value ?? ''}
                    onChange={(value) => update(item.id, { value })}
                    choices={(item.id === 'timezone'
                      ? ['Europe/London', 'Africa/Cairo', 'America/New_York', 'Asia/Tokyo']
                      : item.id === 'plan'
                        ? ['Solo', 'Team', 'Studio']
                        : ['Private', 'Workspace', 'Public']
                    ).map((label) => ({ value: label, label }))}
                  />
                ) : (
                  <Input
                    type={item.id === 'email' ? 'email' : 'text'}
                    value={item.value ?? ''}
                    onChange={(event) => update(item.id, { value: event.target.value })}
                  />
                )}
              </Field>
            ))}
          </div>
          {saveBar}
        </>
      ) : config.variant === 'notifications' ? (
        <>
          <div
            className="pb-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Notification channels"
          >
            <table className="pb-notification-matrix">
              <caption className="sr-only">Notification channels</caption>
              <thead>
                <tr>
                  <th>Event</th>
                  {['Email', 'Push', 'Digest'].map((channel) => (
                    <th key={channel}>{channel}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <th scope="row">
                      {item.label}
                      <small>{item.detail}</small>
                    </th>
                    {['Email', 'Push', 'Digest'].map((channel) => (
                      <td key={channel}>
                        <Switch
                          aria-label={`${item.label} ${channel.toLowerCase()}`}
                          checked={channels[item.id][channel]}
                          onCheckedChange={(value) =>
                            setChannels({
                              ...channels,
                              [item.id]: { ...channels[item.id], [channel]: value },
                            })
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setChannels(
                Object.fromEntries(
                  items.map((item) => [item.id, { Email: false, Push: false, Digest: false }]),
                ),
              )
            }
          >
            <X aria-hidden="true" />
            Mute all
          </Button>
          {saveBar}
        </>
      ) : config.variant === 'security' ? (
        <>
          <div className="pb-list-row">
            <Shield size={22} aria-hidden="true" />
            <span>
              <strong>{items[0].label}</strong>
              <small>{items[0].detail}</small>
            </span>
            <Switch
              aria-label={items[0].label}
              checked={items[0].enabled}
              onCheckedChange={(enabled) => update(items[0].id, { enabled })}
            />
          </div>
          <h3 className="pb-section-title">Active sessions</h3>
          <div className="pb-list">
            {items.slice(1).map((item, index) => (
              <div className="pb-list-row" key={item.id}>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </span>
                {index === 0 ? (
                  <Badge variant="outline">Current</Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!item.enabled}
                    onClick={() => {
                      update(item.id, { enabled: false });
                      setFeedback(`${item.label} revoked`);
                    }}
                  >
                    {item.enabled ? 'Revoke session' : 'Revoked'}
                  </Button>
                )}
              </div>
            ))}
          </div>
          {saveBar}
        </>
      ) : config.variant === 'api' ? (
        <>
          <div className="pb-list">
            {items.map((item) => (
              <div className="pb-api-row" key={item.id}>
                <KeyRound size={20} aria-hidden="true" />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                  <code>
                    {revealed.includes(item.id) ? item.value : '************************'}
                  </code>
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`${revealed.includes(item.id) ? 'Hide' : 'Reveal'} ${item.label} key`}
                  title={revealed.includes(item.id) ? 'Hide value' : 'Reveal value'}
                  onClick={() =>
                    setRevealed(
                      revealed.includes(item.id)
                        ? revealed.filter((id) => id !== item.id)
                        : [...revealed, item.id],
                    )
                  }
                >
                  {revealed.includes(item.id) ? (
                    <EyeOff aria-hidden="true" />
                  ) : (
                    <Eye aria-hidden="true" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Revoke ${item.label} key`}
                  title="Revoke key"
                  onClick={() => {
                    setItems(items.filter((key) => key.id !== item.id));
                    setFeedback('Key revoked');
                  }}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
          {!items.length && <EmptyState title="No API keys" />}
        </>
      ) : config.variant === 'integrations' ? (
        <>
          <SearchField value={query} onChange={setQuery} label="Search integrations" />
          <div className="pb-list">
            {visible.map((item) => (
              <div className="pb-list-row" key={item.id}>
                <Link2 size={22} aria-hidden="true" />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </span>
                <Badge variant={item.enabled ? 'accent' : 'outline'}>
                  {item.enabled ? 'Connected' : 'Available'}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDetail(item);
                    setConsent(false);
                  }}
                >
                  {item.enabled ? 'Manage' : 'Connect'}
                </Button>
              </div>
            ))}
          </div>
          {!visible.length && <EmptyState title="No integrations found" />}
          <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(undefined)}>
            <DialogContent>
              <DialogTitle>{detail?.label}</DialogTitle>
              <DialogDescription>Requested permissions</DialogDescription>
              <p className="pb-prose">{detail?.detail}</p>
              {detail?.enabled ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    update(detail.id, { enabled: false });
                    setDetail(undefined);
                    setFeedback('Connection removed');
                  }}
                >
                  Disconnect
                </Button>
              ) : (
                <>
                  <label className="pb-check-field">
                    <Checkbox
                      checked={consent}
                      onCheckedChange={(value) => setConsent(value === true)}
                    />
                    Allow this connection
                  </label>
                  <Button
                    disabled={!consent}
                    onClick={() => {
                      if (detail) update(detail.id, { enabled: true });
                      setDetail(undefined);
                      setFeedback('Connection recorded');
                    }}
                  >
                    <Check aria-hidden="true" />
                    Connect
                  </Button>
                </>
              )}
            </DialogContent>
          </Dialog>
        </>
      ) : config.variant === 'team' ? (
        <>
          <SearchField value={query} onChange={setQuery} label="Search workspace members" />
          <div className="pb-list">
            {visible.map((item) => (
              <div className="pb-list-row" key={item.id}>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </span>
                {item.value === 'Owner' ? (
                  <Badge variant="outline">Owner</Badge>
                ) : (
                  <ChoiceSelect
                    label={`${item.label} role`}
                    value={item.value ?? 'Member'}
                    onChange={(value) => update(item.id, { value })}
                    choices={['Admin', 'Member', 'Guest'].map((label) => ({ value: label, label }))}
                  />
                )}
              </div>
            ))}
          </div>
          {saveBar}
        </>
      ) : config.variant === 'appearance' ? (
        <>
          <div className="pb-settings-fields">
            {items.map((item) => (
              <Field key={item.id} label={item.label}>
                <ChoiceSelect
                  label={item.label}
                  value={item.value ?? ''}
                  onChange={(value) => update(item.id, { value })}
                  choices={(item.id === 'theme'
                    ? ['Light', 'Dark']
                    : item.id === 'density'
                      ? ['Compact', 'Comfortable']
                      : ['Default', 'Large']
                  ).map((label) => ({ value: label, label }))}
                />
              </Field>
            ))}
          </div>
          <div
            className="pb-appearance-sample"
            data-theme={
              items.find((item) => item.id === 'theme')?.value === 'Dark' ? 'dark' : 'light'
            }
            data-density={
              items.find((item) => item.id === 'density')?.value === 'Compact'
                ? 'compact'
                : 'comfortable'
            }
            data-text-size={
              items.find((item) => item.id === 'size')?.value === 'Large' ? 'large' : 'default'
            }
          >
            <h3>Project overview</h3>
            <p>Atlas redesign · Product team</p>
            <Tabs defaultValue="activity">
              <TabsList>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
              </TabsList>
              <TabsContent value="activity">
                <div className="pb-list-row">
                  <span>Design review</span>
                  <Badge variant="accent">Complete</Badge>
                </div>
                <div className="pb-list-row">
                  <span>Keyboard audit</span>
                  <Badge variant="outline">In progress</Badge>
                </div>
              </TabsContent>
              <TabsContent value="files">
                <div className="pb-list-row">
                  <span>Navigation specification</span>
                  <small>Document · Updated today</small>
                </div>
                <div className="pb-list-row">
                  <span>Release checklist</span>
                  <small>Document · 8 tasks</small>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          {saveBar}
        </>
      ) : lifecycle !== 'active' ? (
        <EmptyState
          title={`Workspace ${lifecycle}`}
          action={
            <Button
              variant="outline"
              onClick={() => {
                setLifecycle('active');
                setConfirm('');
              }}
            >
              Restore workspace
            </Button>
          }
        />
      ) : (
        <div className="pb-lifecycle">
          <section>
            <h3>Export workspace</h3>
            <p>{items[0]?.detail}</p>
            <Button
              variant="outline"
              onClick={() =>
                downloadText(
                  'workspace-manifest.json',
                  JSON.stringify(
                    {
                      name: items[0]?.value,
                      items: config.items,
                      exportedAt: new Date().toISOString(),
                    },
                    null,
                    2,
                  ),
                  'application/json',
                )
              }
            >
              <Download aria-hidden="true" />
              Export manifest
            </Button>
          </section>
          <section>
            <h3>Archive workspace</h3>
            <p>{items[0]?.label}</p>
            <Button variant="outline" onClick={() => setLifecycle('archived')}>
              Archive
            </Button>
          </section>
          <section className="pb-danger-zone">
            <h3>Delete workspace</h3>
            <Field label="Workspace name">
              <Input
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder={items[0]?.value}
              />
            </Field>
            <Button
              variant="destructive"
              disabled={confirm !== items[0]?.value}
              onClick={() => setLifecycle('deleted')}
            >
              <Trash2 aria-hidden="true" />
              Delete workspace
            </Button>
          </section>
        </div>
      )}
      <EntryDialog
        open={create}
        onOpenChange={setCreate}
        title={config.variant === 'api' ? 'Create key' : 'Invite member'}
        fields={config.variant === 'api' ? nameFields : memberFields}
        onSubmit={(values) => {
          const id = `local-${Date.now()}`;
          setItems([
            ...items,
            {
              id,
              label: values.name,
              detail: config.variant === 'api' ? 'Created now · Read-only' : values.email,
              value: config.variant === 'api' ? `local_demo_${id}` : 'Guest',
            },
          ]);
          setFeedback(config.variant === 'api' ? 'Placeholder key created' : 'Invitation recorded');
        }}
      />
      <Status>{feedback}</Status>
    </section>
  );
}
