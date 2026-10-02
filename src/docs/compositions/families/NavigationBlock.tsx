import * as React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Command,
  Copy,
  FileText,
  Folder,
  Home,
  Layers,
  Menu,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Users,
} from 'lucide-react';
import { Badge, Button, EmptyState } from '../../../ui/primitives';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../../ui/overlays';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/navigation';
import { BlockHeading, ChoiceSelect, EntryDialog, SearchField, Status } from '../helpers';
import type { FormField, NavigationConfig, RecordItem } from '../types';

const icons = [Home, Layers, Users, Settings, Star];
const workspaceFields = [
  { name: 'name', label: 'Workspace name', type: 'text' as const, required: true },
  { name: 'purpose', label: 'Purpose', type: 'text' as const, required: true },
];
const projectFields: FormField[] = [
  { name: 'name', label: 'Project name', type: 'text', required: true },
  { name: 'purpose', label: 'Project brief', type: 'textarea', required: true },
];
const invitationFields: FormField[] = [
  { name: 'name', label: 'Full name', type: 'text', required: true },
  { name: 'email', label: 'Email address', type: 'email', required: true },
];
export function NavigationBlock({ config }: { config: NavigationConfig }) {
  const [items, setItems] = React.useState<RecordItem[]>(() => [...config.items]);
  const [selected, setSelected] = React.useState(
    (config.variant === 'breadcrumb' ? config.items[config.items.length - 1] : config.items[0])
      ?.id ?? '',
  );
  const [query, setQuery] = React.useState('');
  const [collapsed, setCollapsed] = React.useState(config.variant === 'rail');
  const [expanded, setExpanded] = React.useState<string[]>([config.items[0]?.id ?? '']);
  const [open, setOpen] = React.useState(false);
  const [create, setCreate] = React.useState(false);
  const [feedback, setFeedback] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState('3');
  const [saved, setSaved] = React.useState<string[]>([]);
  const [notes, setNotes] = React.useState<Record<string, string>>({});
  const selectedItem = items.find((item) => item.id === selected) ?? items[0];
  const visible = items.filter((item) =>
    `${item.title} ${item.detail}`.toLowerCase().includes(query.toLowerCase()),
  );
  const select = (id: string) => {
    setSelected(id);
    setQuery('');
    setOpen(false);
  };
  const destination = (
    <div className="pb-destination" aria-live="polite">
      <div className="pb-caption">{config.title}</div>
      <h3>{selectedItem?.title}</h3>
      <p>{selectedItem?.detail}</p>
      {selectedItem?.value !== undefined && (
        <Badge variant="outline">{selectedItem.value} records</Badge>
      )}
      <div className="pb-destination-records">
        {items
          .filter((item) => item.id !== selected)
          .slice(0, 3)
          .map((item) => (
            <button type="button" key={item.id} onClick={() => select(item.id)}>
              <FileText size={17} aria-hidden="true" />
              <span>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </span>
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          ))}
      </div>
    </div>
  );
  const menu = (iconOnly = false) => (
    <nav aria-label={config.title}>
      {visible.map((item, index) => {
        const Icon = icons[index % icons.length];
        return (
          <Button
            key={item.id}
            variant={selected === item.id ? 'secondary' : 'ghost'}
            aria-current={selected === item.id ? 'page' : undefined}
            aria-label={item.title}
            title={iconOnly ? item.title : undefined}
            onClick={() => select(item.id)}
          >
            <Icon aria-hidden="true" />
            {!iconOnly && (
              <>
                <span>{item.title}</span>
                {item.value !== undefined && <span className="pb-nav-count">{item.value}</span>}
              </>
            )}
          </Button>
        );
      })}
    </nav>
  );
  return (
    <section data-block="navigation" data-variant={config.variant}>
      {config.variant === 'sidebar' || config.variant === 'rail' ? (
        <div className={`pb-navigation-shell ${collapsed ? 'pb-navigation-collapsed' : ''}`}>
          <aside>
            <div className="pb-row">
              <strong>{collapsed ? config.title[0] : config.title}</strong>
              <Button
                size="icon"
                variant="ghost"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-expanded={!collapsed}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                onClick={() => setCollapsed(!collapsed)}
              >
                <Menu aria-hidden="true" />
              </Button>
            </div>
            {!collapsed && (
              <SearchField value={query} onChange={setQuery} label="Search navigation" />
            )}
            {menu(collapsed)}
            <small className="pb-caption">{collapsed ? 'AM' : 'Avery Morgan'}</small>
          </aside>
          {destination}
        </div>
      ) : config.variant === 'topbar' ? (
        <>
          <header className="pb-topnav">
            <strong>{config.title}</strong>
            {menu()}
            <Button
              size="icon"
              variant="ghost"
              title="Open bag"
              aria-label="Open bag"
              onClick={() => setOpen(true)}
            >
              <ShoppingBag aria-hidden="true" />
            </Button>
          </header>
          <SearchField value={query} onChange={setQuery} label="Search collections" />
          {query ? (
            <div className="pb-list">
              {visible.map((item) => (
                <div className="pb-list-row" key={item.id}>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Save ${item.title}`}
                    title="Save collection"
                    aria-pressed={saved.includes(item.id)}
                    onClick={() =>
                      setSaved(
                        saved.includes(item.id)
                          ? saved.filter((id) => id !== item.id)
                          : [...saved, item.id],
                      )
                    }
                  >
                    <Star aria-hidden="true" />
                  </Button>
                </div>
              ))}
              {!visible.length && <EmptyState title="No collections found" />}
            </div>
          ) : (
            destination
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogTitle>Saved collections</DialogTitle>
              <DialogDescription>{saved.length} collections</DialogDescription>
              {saved.length ? (
                saved.map((id) => <p key={id}>{items.find((item) => item.id === id)?.title}</p>)
              ) : (
                <EmptyState title="Nothing saved yet" />
              )}
            </DialogContent>
          </Dialog>
        </>
      ) : config.variant === 'command' ? (
        <>
          <BlockHeading title={config.title} subtitle={config.subtitle} />
          <Button variant="outline" className="pb-command-trigger" onClick={() => setOpen(true)}>
            <Search aria-hidden="true" />
            <span>Search commands</span>
            <Command size={15} aria-hidden="true" />
          </Button>
          {destination}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogTitle>Commands</DialogTitle>
              <DialogDescription className="sr-only">
                Workspace destinations and actions
              </DialogDescription>
              <SearchField label="Search commands" value={query} onChange={setQuery} />
              <div className="pb-command-list">
                {visible.map((item) => (
                  <Button
                    variant="ghost"
                    key={item.id}
                    onClick={() => {
                      select(item.id);
                      if (['create', 'invite'].includes(item.id)) setCreate(true);
                    }}
                  >
                    <ChevronRight aria-hidden="true" />
                    <span>
                      {item.title}
                      <small>{item.detail}</small>
                    </span>
                  </Button>
                ))}
                {!visible.length && <EmptyState title="No matching commands" />}
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : config.variant === 'breadcrumb' ? (
        <>
          <nav aria-label="Breadcrumb" className="pb-breadcrumb">
            {items
              .slice(0, items.findIndex((item) => item.id === selected) + 1)
              .map((item, index) => (
                <React.Fragment key={item.id}>
                  {index > 0 && <ChevronRight size={13} aria-hidden="true" />}
                  <button
                    type="button"
                    aria-current={selected === item.id ? 'page' : undefined}
                    onClick={() => select(item.id)}
                  >
                    {item.title}
                  </button>
                </React.Fragment>
              ))}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Copy document path"
              title="Copy path"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    items
                      .slice(0, items.findIndex((item) => item.id === selected) + 1)
                      .map((item) => item.title)
                      .join(' / '),
                  );
                  setFeedback('Path copied');
                } catch {
                  setFeedback('Clipboard unavailable');
                }
              }}
            >
              <Copy aria-hidden="true" />
            </Button>
          </nav>
          {destination}
        </>
      ) : config.variant === 'tabs' ? (
        <>
          <BlockHeading title={config.title} />
          <Tabs value={selected} onValueChange={select}>
            <TabsList variant="underline" aria-label="Issue views">
              {items.map((item) => (
                <TabsTrigger value={item.id} key={item.id}>
                  {item.title}
                  <Badge variant="outline">{item.value}</Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            {items.map((item) => (
              <TabsContent value={item.id} key={item.id}>
                <SearchField
                  label={`Search ${item.title.toLowerCase()} issues`}
                  value={query}
                  onChange={setQuery}
                />
                <div className="pb-list">
                  {item.detail
                    .split(', ')
                    .filter((text) => text.toLowerCase().includes(query.toLowerCase()))
                    .map((text) => (
                      <div className="pb-list-row" key={text}>
                        <FileText size={16} aria-hidden="true" />
                        <strong>{text}</strong>
                        <Badge variant="outline">{item.title}</Badge>
                      </div>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </>
      ) : config.variant === 'tree' ? (
        <div className="pb-explorer">
          <aside>
            <BlockHeading title={config.title} />
            <SearchField value={query} onChange={setQuery} label="Search files" />
            <ul>
              {visible.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-expanded={expanded.includes(item.id)}
                    onClick={() =>
                      setExpanded(
                        expanded.includes(item.id)
                          ? expanded.filter((id) => id !== item.id)
                          : [...expanded, item.id],
                      )
                    }
                  >
                    {expanded.includes(item.id) ? (
                      <ChevronDown size={14} aria-hidden="true" />
                    ) : (
                      <ChevronRight size={14} aria-hidden="true" />
                    )}
                    <Folder size={16} aria-hidden="true" />
                    {item.title}
                  </button>
                  {expanded.includes(item.id) && (
                    <button
                      className="pb-tree-file"
                      type="button"
                      aria-current={selected === item.id ? 'true' : undefined}
                      onClick={() => select(item.id)}
                    >
                      <FileText size={15} aria-hidden="true" />
                      {item.detail}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </aside>
          <div className="pb-file-preview">
            <FileText size={32} aria-hidden="true" />
            <h3>{selectedItem.detail}</h3>
            <p>
              {selectedItem.title} / {selectedItem.detail}
            </p>
            <textarea
              aria-label="File notes"
              placeholder="Add file notes..."
              value={notes[selected] ?? ''}
              onChange={(event) => setNotes({ ...notes, [selected]: event.target.value })}
            />
          </div>
        </div>
      ) : config.variant === 'workspace' ? (
        <>
          <BlockHeading
            title={config.title}
            actions={
              <Button size="sm" variant="outline" onClick={() => setCreate(true)}>
                <Plus aria-hidden="true" />
                New workspace
              </Button>
            }
          />
          <SearchField value={query} onChange={setQuery} label="Search workspaces" />
          <div className="pb-workspace-list">
            {visible.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={selected === item.id}
                onClick={() => select(item.id)}
              >
                <span className="pb-brand-mark">{item.title[0]}</span>
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {item.detail} · {item.value} members
                  </small>
                </span>
                <Badge variant="outline">{item.status}</Badge>
                {selected === item.id && <span className="pb-selected-dot" />}
              </button>
            ))}
          </div>
          {!visible.length && <EmptyState title="No workspaces found" />}
        </>
      ) : config.variant === 'pagination' ? (
        <>
          <BlockHeading title={config.title} />
          <div className="pb-list">
            {items.slice(page * Number(pageSize), (page + 1) * Number(pageSize)).map((item) => (
              <button
                type="button"
                className="pb-resource-row"
                key={item.id}
                onClick={() => {
                  select(item.id);
                  setOpen(true);
                }}
              >
                <FileText size={18} aria-hidden="true" />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            ))}
          </div>
          <div className="pb-pagination">
            <span>
              {page * Number(pageSize) + 1}–{Math.min(items.length, (page + 1) * Number(pageSize))}{' '}
              of {items.length}
            </span>
            <ChoiceSelect
              label="Results per page"
              value={pageSize}
              onChange={(value) => {
                setPageSize(value);
                setPage(0);
              }}
              choices={['3', '5', '8'].map((value) => ({ value, label: `${value} per page` }))}
            />
            <Button
              variant="outline"
              size="icon"
              disabled={page === 0}
              aria-label="Previous page"
              title="Previous page"
              onClick={() => setPage(page - 1)}
            >
              <ArrowLeft aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={(page + 1) * Number(pageSize) >= items.length}
              aria-label="Next page"
              title="Next page"
              onClick={() => setPage(page + 1)}
            >
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogTitle>{selectedItem.title}</DialogTitle>
              <DialogDescription>{selectedItem.detail}</DialogDescription>
              <p className="pb-prose">
                A shared reference for the Northstar team. Keep decisions clear, record the reasons
                behind them, and revisit the work as the project develops.
              </p>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="pb-bottom-shell">
          <BlockHeading title={config.title} />
          {destination}
          <nav aria-label="Main destinations" className="pb-bottomnav">
            {items.map((item, index) => {
              const Icon = icons[index % icons.length];
              return (
                <button
                  type="button"
                  key={item.id}
                  aria-current={selected === item.id ? 'page' : undefined}
                  onClick={() => select(item.id)}
                >
                  <Icon size={19} aria-hidden="true" />
                  <span>{item.title}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
      <EntryDialog
        open={create}
        onOpenChange={setCreate}
        title={config.variant === 'workspace' ? 'New workspace' : (selectedItem?.title ?? 'Create')}
        fields={
          config.variant === 'workspace'
            ? workspaceFields
            : selected === 'invite'
              ? invitationFields
              : projectFields
        }
        onSubmit={(values) => {
          const item = {
            id: `workspace-${Date.now()}`,
            title: values.name,
            detail: values.purpose || values.email,
            status: selected === 'invite' ? 'Invited' : 'Free',
            value: 1,
          };
          setItems([...items, item]);
          setSelected(item.id);
          setFeedback(`${values.name} created`);
        }}
      />
      <Status>{feedback}</Status>
    </section>
  );
}
