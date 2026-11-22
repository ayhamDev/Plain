import * as React from 'react';
import { createRoot } from 'react-dom/client';
import * as UI from '@plain/ui';
import { Folder, Home, MoreHorizontal, Settings, User } from 'lucide-react';
import '@plain/ui/styles.css';

const params = new URLSearchParams(location.search);
const count = params.has('long') ? 50 : 4;
const hover = params.get('hover');
const expansionMode = params.get('mode') === 'overlay' ? 'overlay' : 'inline';
const localPaint =
  params.has('local-paint') || params.has('selected-colors')
    ? ({
        ...(params.has('local-paint')
          ? { '--ui-sidebar-overlay-background': 'rgba(40, 80, 160, 0.25)' }
          : {}),
        ...(params.has('selected-colors')
          ? {
              '--ui-primary-container': 'var(--ui-sidebar-background, var(--ui-surface-low))',
              '--ui-sidebar-accent': '#dbe9ff',
              '--ui-sidebar-accent-foreground': '#123456',
            }
          : {}),
      } as React.CSSProperties)
    : undefined;
function Fixture() {
  const [name, setName] = React.useState('Personal workspace');
  const [current, setCurrent] = React.useState('Overview');
  const [scroll, setScroll] = React.useState(0);
  const [accounts, setAccounts] = React.useState(0);
  const [railExpanded, setRailExpanded] = React.useState(params.has('pinned'));
  const nav = React.useRef<HTMLElement>(null);
  const items = Array.from({ length: count }, (_, index) => ({
    value: String(index),
    label: index === count - 1 ? 'Last workspace' : `Workspace ${index + 1}`,
    icon: <Folder />,
    badge: index === 1 ? '3' : undefined,
  }));
  return (
    <main style={{ padding: 16 }}>
      <h1>Sidebar overflow</h1>
      <UI.SidebarProvider
        defaultCollapsed={params.has('collapsed') || hover === 'sidebar'}
        expandOnHover={hover === 'sidebar'}
        expansionMode={hover === 'sidebar' ? expansionMode : 'inline'}
        overlayBackdrop={!params.has('no-backdrop')}
        width="248px"
        collapsedWidth={params.get('compact') === '48' ? '48px' : '64px'}
        style={{ height: 360, maxWidth: 780, width: '100%', border: '1px solid var(--ui-border)' }}
      >
        <UI.NavigationRail
          id="fixture-rail"
          expandOnHover={hover === 'rail'}
          expansionMode={hover === 'rail' ? expansionMode : 'inline'}
          overlayBackdrop={!params.has('no-backdrop')}
          expanded={railExpanded}
          onExpandedChange={setRailExpanded}
          expandedWidth={params.get('wide') ?? '264px'}
          style={localPaint}
          items={items}
          aria-label="Workspaces"
          variant={params.get('variant') === 'floating' ? 'floating' : 'attached'}
          header={<UI.Strong>p.</UI.Strong>}
          footer={
            <UI.Button variant="ghost" size="icon" aria-label="Workspace account">
              <User />
            </UI.Button>
          }
        />
        <UI.Sidebar
          style={localPaint}
          label="Fixture navigation"
          variant={
            params.get('variant') === 'floating'
              ? 'floating'
              : params.get('variant') === 'inset'
                ? 'inset'
                : 'sidebar'
          }
          side={params.get('side') === 'end' ? 'end' : 'start'}
        >
          <UI.SidebarHeader collapsedContent={<UI.Strong aria-label="Compact brand">p.</UI.Strong>}>
            <div style={{ display: 'grid', gap: 8, width: '100%', minWidth: 0 }}>
              <UI.Strong style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                A very long workspace header and account name
              </UI.Strong>
              <UI.SidebarInput
                aria-label="Workspace name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              {params.has('popup') && (
                <UI.DropdownMenu modal={params.has('modal-popup')}>
                  <UI.DropdownMenuTrigger asChild>
                    <UI.Button variant="outline" size="sm">
                      Navigation tools
                    </UI.Button>
                  </UI.DropdownMenuTrigger>
                  <UI.DropdownMenuContent side="right" align="start">
                    <UI.DropdownMenuItem onSelect={() => setAccounts((value) => value + 1)}>
                      Workspace action
                    </UI.DropdownMenuItem>
                  </UI.DropdownMenuContent>
                </UI.DropdownMenu>
              )}
            </div>
          </UI.SidebarHeader>
          <UI.SidebarContent
            ref={nav}
            tabIndex={0}
            onScroll={(event) => setScroll(event.currentTarget.scrollTop)}
          >
            <UI.SidebarGroup label="Workspace navigation with a deliberately long group label">
              <UI.SidebarMenu>
                <UI.SidebarMenuItem>
                  <UI.SidebarItem
                    icon={<Home />}
                    active={current === 'Overview'}
                    onClick={() => setCurrent('Overview')}
                  >
                    Overview
                  </UI.SidebarItem>
                </UI.SidebarMenuItem>
                <UI.SidebarMenuItem>
                  <UI.SidebarItem icon={<Folder />} onClick={() => setCurrent('Inbox')}>
                    Inbox
                  </UI.SidebarItem>
                  <UI.SidebarMenuBadge>999</UI.SidebarMenuBadge>
                </UI.SidebarMenuItem>
                <UI.SidebarMenuItem>
                  <UI.SidebarItem icon={<Settings />} onClick={() => setCurrent('Projects')}>
                    Projects
                  </UI.SidebarItem>
                  <UI.SidebarMenuAction aria-label="Project actions">
                    <MoreHorizontal />
                  </UI.SidebarMenuAction>
                </UI.SidebarMenuItem>
                <UI.SidebarMenuItem>
                  <UI.SidebarItem onClick={() => setCurrent('Settings')}>Settings</UI.SidebarItem>
                </UI.SidebarMenuItem>
                {Array.from({ length: count }, (_, index) => {
                  const label =
                    index === count - 1
                      ? 'Last destination'
                      : `Project ${index + 1} ${'UnbrokenWorkspaceName'.repeat(5)}`;
                  return (
                    <UI.SidebarMenuItem key={index}>
                      <UI.SidebarItem icon={<Folder />} onClick={() => setCurrent(label)}>
                        {label}
                      </UI.SidebarItem>
                    </UI.SidebarMenuItem>
                  );
                })}
              </UI.SidebarMenu>
            </UI.SidebarGroup>
          </UI.SidebarContent>
          <UI.SidebarFooter
            collapsedContent={
              <UI.Button
                aria-label="Compact account"
                variant="ghost"
                size="icon"
                style={{ width: 28, height: 28, minHeight: 28, padding: 0 }}
                onClick={() => setAccounts((value) => value + 1)}
              >
                <User />
              </UI.Button>
            }
          >
            <UI.Button
              variant="outline"
              size="sm"
              onClick={() => setAccounts((value) => value + 1)}
            >
              Footer account
            </UI.Button>
          </UI.SidebarFooter>
          <UI.SidebarRail />
        </UI.Sidebar>
        <UI.SidebarInset asChild>
          <section
            aria-label="Workspace content"
            style={{ padding: 12, minWidth: 0, overflowWrap: 'anywhere' }}
          >
            {!params.has('no-trigger') && <UI.SidebarTrigger />}
            {hover === 'rail' && (
              <UI.Button
                aria-controls="fixture-rail"
                aria-expanded={railExpanded}
                onClick={() => setRailExpanded((value) => !value)}
              >
                Toggle rail expansion
              </UI.Button>
            )}
            <h2>{current}</h2>
            <UI.Button onClick={() => nav.current?.scrollTo({ top: nav.current.scrollHeight })}>
              Scroll to last item
            </UI.Button>
            {hover && (
              <UI.Button onClick={() => setAccounts((value) => value + 1)}>
                Content action
              </UI.Button>
            )}
            <output aria-label="Native scroll">{Math.round(scroll)}</output>
            <output aria-label="Account calls">{accounts}</output>
          </section>
        </UI.SidebarInset>
      </UI.SidebarProvider>
    </main>
  );
}
const root = createRoot(document.getElementById('root')!);
root.render(
  <UI.PlainProvider
    persist={false}
    dir={params.get('dir') === 'rtl' ? 'rtl' : 'ltr'}
    theme={{
      mode: params.get('theme') === 'dark' ? 'dark' : 'light',
      motion: params.get('motion') === 'none' ? 'none' : 'system',
    }}
  >
    <Fixture />
  </UI.PlainProvider>,
);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
