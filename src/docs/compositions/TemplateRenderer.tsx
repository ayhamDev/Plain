import * as React from 'react';
import {
  ArrowRight,
  ChevronRight,
  FileText,
  Inbox,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback, Badge, Button, EmptyState } from '../../ui/primitives';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../ui/overlays';
import { Block } from './registry';
import { SettingsBlock } from './families/SettingsBlock';
import { EntryDialog, SearchField, Status } from './helpers';
import type { TemplateConfig } from './types';

interface CreatedRecord {
  id: string;
  route: string;
  values: Record<string, string>;
}
const routeIcons = [LayoutDashboard, Inbox, Users, FileText, Settings];
const profileConfig = {
  family: 'settings' as const,
  variant: 'profile' as const,
  title: 'Your profile',
  items: [
    { id: 'name', label: 'Full name', detail: 'Display name', value: 'Avery Morgan' },
    { id: 'email', label: 'Email', detail: 'Account address', value: 'avery@example.com' },
  ],
};
export function TemplateRenderer({ config }: { config: TemplateConfig }) {
  const [active, setActive] = React.useState(config.initialRoute ?? config.routes[0]?.id ?? '');
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [records, setRecords] = React.useState<CreatedRecord[]>([]);
  const [detail, setDetail] = React.useState<CreatedRecord | undefined>();
  const [feedback, setFeedback] = React.useState('');
  const [imageFailed, setImageFailed] = React.useState(false);
  const route = config.routes.find((candidate) => candidate.id === active) ?? config.routes[0];
  const website = ['website', 'editorial'].includes(config.layout);
  const mobile = config.layout === 'mobile';
  const firstRoute = route?.id === (config.initialRoute ?? config.routes[0]?.id);
  const choose = (id: string) => {
    setActive(id);
    setMenuOpen(false);
    setSearchOpen(false);
    setQuery('');
    setFeedback('');
  };
  const navigation = (bottom = false) => (
    <nav aria-label={`${config.brand} destinations`} className={bottom ? 'pt-bottomnav' : 'pt-nav'}>
      {config.routes.map((item, index) => {
        const Icon = routeIcons[index % routeIcons.length];
        return (
          <button
            type="button"
            key={item.id}
            aria-label={item.label}
            aria-current={route?.id === item.id ? 'page' : undefined}
            onClick={() => choose(item.id)}
          >
            {!website && <Icon size={17} aria-hidden="true" />}
            <span>{item.label}</span>
            {!bottom && !website && (
              <ChevronRight className="pt-nav-chevron" size={13} aria-hidden="true" />
            )}
          </button>
        );
      })}
    </nav>
  );
  if (!route) return <EmptyState title="No application screens" />;
  return (
    <section
      data-template={config.layout}
      className="pt-root"
      aria-label={`${config.brand} application`}
    >
      <header className="pt-header">
        <div className="pt-brand">
          <Button
            className="pt-menu-button"
            variant="ghost"
            size="icon"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            title={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
          <span className="pt-brand-symbol">{config.brand.slice(0, 1)}</span>
          <strong>{config.brand}</strong>
        </div>
        {(website || ['topbar', 'dashboard'].includes(config.layout)) && (
          <div className="pt-header-nav">{navigation()}</div>
        )}
        <div className="pt-header-actions">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search workspace"
            title="Search workspace"
            onClick={() => setSearchOpen(true)}
          >
            <Search aria-hidden="true" />
          </Button>
          <Button
            size={mobile ? 'icon' : 'sm'}
            variant="outline"
            aria-label={config.primaryAction}
            title={mobile ? config.primaryAction : undefined}
            onClick={() => setCreateOpen(true)}
          >
            <Plus aria-hidden="true" />
            {!mobile && <span>{config.primaryAction}</span>}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Account"
            title="Account"
            onClick={() => setProfileOpen(true)}
          >
            <Avatar size="sm">
              <AvatarFallback>AM</AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </header>
      <div className="pt-body" data-menu-open={menuOpen}>
        <aside className="pt-sidebar">
          <div className="pt-sidebar-label">{website ? 'Explore' : 'Workspace'}</div>
          {navigation()}
          <div className="pt-sidebar-footer">
            <Badge variant="outline">{records.length} new records</Badge>
            <small>Avery Morgan</small>
          </div>
        </aside>
        <div className="pt-main">
          {website && firstRoute && config.website?.image && !imageFailed && (
            <section className="pt-hero">
              <img
                src={config.website.image}
                alt={config.website.imageAlt ?? config.website.heroTitle}
                onError={() => setImageFailed(true)}
                loading="lazy"
              />
              <div className="pt-hero-copy">
                <h1>{config.website.heroTitle}</h1>
                <p>{config.website.heroCopy}</p>
                <Button onClick={() => choose(config.routes[1]?.id ?? route.id)}>
                  {config.website.action}
                  <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </section>
          )}
          <div className="pt-titlebar">
            <div>
              <span className="pt-breadcrumb">
                {config.brand} / {route.label}
              </span>
              {!(website && firstRoute && config.website?.image && !imageFailed) && (
                <h1>{route.title}</h1>
              )}
            </div>
            {!website && !mobile && <Badge variant="outline">October 2026</Badge>}
          </div>
          <div className="pt-panels" data-layout={route.layout ?? 'stack'}>
            {route.blockIds.map((id) => (
              <section className="pt-panel" key={id}>
                <Block id={id} config={route.blockOverrides?.[id]} />
              </section>
            ))}
          </div>
          {records.filter((record) => record.route === route.id).length > 0 && (
            <section className="pt-created-records">
              <h2>New records</h2>
              {records
                .filter((record) => record.route === route.id)
                .map((record) => (
                  <button type="button" key={record.id} onClick={() => setDetail(record)}>
                    <FileText size={17} aria-hidden="true" />
                    <span>
                      <strong>
                        {record.values.title ??
                          record.values.name ??
                          Object.values(record.values)[0]}
                      </strong>
                      <small>
                        {record.values.details ??
                          record.values.email ??
                          record.values.date ??
                          'Created now'}
                      </small>
                    </span>
                    <ChevronRight size={15} aria-hidden="true" />
                  </button>
                ))}
            </section>
          )}
          <Status>{feedback}</Status>
          {website && (
            <footer className="pt-site-footer">
              <strong>{config.brand}</strong>
              <span>2026</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => choose(config.routes[config.routes.length - 1].id)}
              >
                {config.routes[config.routes.length - 1].label}
                <ArrowRight aria-hidden="true" />
              </Button>
            </footer>
          )}
        </div>
      </div>
      {mobile && navigation(true)}
      <EntryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={config.primaryAction}
        fields={config.createFields}
        onSubmit={(values) => {
          setRecords([{ id: `record-${Date.now()}`, route: route.id, values }, ...records]);
          setFeedback(`${values.title ?? values.name ?? 'Record'} created`);
        }}
      />
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent>
          <DialogTitle>Search {config.brand}</DialogTitle>
          <DialogDescription className="sr-only">
            Destinations and newly created records
          </DialogDescription>
          <SearchField
            value={query}
            onChange={setQuery}
            label="Search workspace"
            placeholder="Search destinations and records..."
          />
          <div className="pt-search-results">
            {config.routes
              .filter((item) =>
                `${item.label} ${item.title}`.toLowerCase().includes(query.toLowerCase()),
              )
              .map((item) => (
                <Button variant="ghost" key={item.id} onClick={() => choose(item.id)}>
                  <LayoutDashboard aria-hidden="true" />
                  <span>
                    {item.title}
                    <small>{item.label}</small>
                  </span>
                  <ArrowRight aria-hidden="true" />
                </Button>
              ))}
            {records
              .filter((record) =>
                Object.values(record.values).join(' ').toLowerCase().includes(query.toLowerCase()),
              )
              .map((record) => (
                <Button
                  variant="ghost"
                  key={record.id}
                  onClick={() => {
                    choose(record.route);
                    setDetail(record);
                  }}
                >
                  <FileText aria-hidden="true" />
                  <span>
                    {record.values.title ?? record.values.name}
                    <small>New record</small>
                  </span>
                </Button>
              ))}
            {!config.routes.some((item) =>
              `${item.label} ${item.title}`.toLowerCase().includes(query.toLowerCase()),
            ) &&
              !records.some((record) =>
                Object.values(record.values).join(' ').toLowerCase().includes(query.toLowerCase()),
              ) && <EmptyState title="No matching destinations or records" />}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogTitle>Account</DialogTitle>
          <DialogDescription className="sr-only">Workspace account details</DialogDescription>
          <SettingsBlock config={profileConfig} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(undefined)}>
        <DialogContent>
          <DialogTitle>{detail?.values.title ?? detail?.values.name ?? 'Record'}</DialogTitle>
          <DialogDescription className="sr-only">Created record details</DialogDescription>
          <dl className="pb-details">
            {detail &&
              config.createFields.map((field) => (
                <div key={field.name}>
                  <dt>{field.label}</dt>
                  <dd>{detail.values[field.name] || 'Not provided'}</dd>
                </div>
              ))}
          </dl>
          <Button
            variant="outline"
            onClick={() => {
              setRecords(records.filter((record) => record.id !== detail?.id));
              setDetail(undefined);
              setFeedback('Record archived');
            }}
          >
            Archive record
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
