import * as React from 'react';
import { RadioGroup, Slot } from 'radix-ui';
import { Check, ChevronRight, PanelLeft, X } from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from './overlays';
import { StyleProvider, useDirection, useStyles, type PlainStyleProps } from './styling';

export interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  isMobile: boolean;
  contentId: string;
  toggle: () => void;
}
const SidebarContext = /* @__PURE__ */ React.createContext<
  | (SidebarContextValue & { setContentId: (id: string) => void; variables: React.CSSProperties })
  | null
>(null);

export function useSidebar(): SidebarContextValue {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error('Sidebar components must be used inside SidebarProvider.');
  return context;
}

export interface SidebarProviderProps
  extends React.HTMLAttributes<HTMLDivElement>, PlainStyleProps {
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  defaultMobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  mobileBreakpoint?: number;
  width?: string;
  collapsedWidth?: string;
  sidebarId?: string;
}

export const SidebarProvider = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  SidebarProviderProps
>(
  (
    {
      collapsed: controlledCollapsed,
      defaultCollapsed = false,
      onCollapsedChange,
      mobileOpen: controlledMobileOpen,
      defaultMobileOpen = false,
      onMobileOpenChange,
      mobileBreakpoint = 768,
      width,
      collapsedWidth,
      sidebarId,
      className,
      style,
      unstyled,
      children,
      dir,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const direction = useDirection(dir as 'ltr' | 'rtl' | undefined);
    const generatedId = React.useId();
    const [contentId, setContentId] = React.useState(sidebarId ?? `sidebar-${generatedId}`);
    const [localCollapsed, updateCollapsed] = React.useState(defaultCollapsed);
    const [localMobileOpen, updateMobileOpen] = React.useState(defaultMobileOpen);
    const [isMobile, setIsMobile] = React.useState(false);
    const collapsed = controlledCollapsed ?? localCollapsed;
    const mobileOpen = controlledMobileOpen ?? localMobileOpen;
    const setCollapsed = React.useCallback(
      (next: boolean) => {
        if (controlledCollapsed === undefined) updateCollapsed(next);
        onCollapsedChange?.(next);
      },
      [controlledCollapsed, onCollapsedChange],
    );
    const setMobileOpen = React.useCallback(
      (next: boolean) => {
        if (controlledMobileOpen === undefined) updateMobileOpen(next);
        onMobileOpenChange?.(next);
      },
      [controlledMobileOpen, onMobileOpenChange],
    );
    React.useEffect(() => {
      const breakpoint = Number.isFinite(mobileBreakpoint) ? Math.max(1, mobileBreakpoint) : 768;
      const media = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
      const update = () => setIsMobile(media.matches);
      update();
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }, [mobileBreakpoint]);
    const toggle = React.useCallback(() => {
      if (isMobile) setMobileOpen(!mobileOpen);
      else setCollapsed(!collapsed);
    }, [isMobile, setMobileOpen, mobileOpen, setCollapsed, collapsed]);
    const variables = React.useMemo(
      () =>
        ({
          ...Object.fromEntries(
            Object.entries(style ?? {}).filter(([key]) => key.startsWith('--ui-')),
          ),
          ...(width ? { '--ui-sidebar-width': width } : {}),
          ...(collapsedWidth ? { '--ui-sidebar-collapsed-width': collapsedWidth } : {}),
        }) as React.CSSProperties,
      [style, width, collapsedWidth],
    );
    const context = React.useMemo(
      () => ({
        collapsed,
        setCollapsed,
        mobileOpen,
        setMobileOpen,
        isMobile,
        contentId,
        setContentId,
        toggle,
        variables,
      }),
      [collapsed, setCollapsed, mobileOpen, setMobileOpen, isMobile, contentId, toggle, variables],
    );
    return (
      <SidebarContext.Provider value={context}>
        <StyleProvider unstyled={unstyled}>
          <Sheet open={isMobile && mobileOpen} onOpenChange={setMobileOpen}>
            <div
              ref={ref}
              dir={direction}
              {...styles('sidebar.provider', 'ui-sidebar-provider', className, unstyled)}
              data-sidebar-state={collapsed ? 'collapsed' : 'expanded'}
              data-mobile={isMobile}
              style={
                {
                  ...(width ? { '--ui-sidebar-width': width } : {}),
                  ...(collapsedWidth ? { '--ui-sidebar-collapsed-width': collapsedWidth } : {}),
                  ...style,
                } as React.CSSProperties
              }
              {...props}
            >
              {children}
            </div>
          </Sheet>
        </StyleProvider>
      </SidebarContext.Provider>
    );
  },
);
SidebarProvider.displayName = 'SidebarProvider';

export interface SidebarProps extends React.HTMLAttributes<HTMLElement>, PlainStyleProps {
  side?: 'start' | 'end';
  label?: string;
}
export const Sidebar = /* @__PURE__ */ React.forwardRef<HTMLElement, SidebarProps>(
  (
    { side = 'start', label = 'Navigation', id, children, className, unstyled, dir, ...props },
    ref,
  ) => {
    const styles = useStyles();
    const context = React.useContext(SidebarContext);
    if (!context) throw new Error('Sidebar must be used inside SidebarProvider.');
    const { isMobile, collapsed, contentId, setContentId, variables } = context;
    const direction = useDirection(dir as 'ltr' | 'rtl' | undefined);
    React.useEffect(() => {
      if (id) setContentId(id);
    }, [id, setContentId]);
    if (isMobile)
      return (
        <StyleProvider unstyled={unstyled}>
          <SheetContent
            ref={ref as React.Ref<HTMLDivElement>}
            side={side}
            dir={direction}
            id={id ?? contentId}
            showClose={false}
            aria-describedby={undefined}
            {...styles('sidebar.root', 'ui-sidebar ui-sidebar-mobile', className, unstyled)}
            data-sidebar-state="expanded"
            {...props}
            style={{
              ...variables,
              ...(!(unstyled ?? styles.unstyled)
                ? {
                    width: 'var(--ui-sidebar-width, 256px)',
                    maxWidth: 'calc(100vw - 32px)',
                    borderWidth: 'var(--ui-sidebar-border-width, 0px)',
                    borderRadius: 'var(--ui-sidebar-radius, 0px)',
                    background:
                      'var(--ui-sidebar-background, var(--ui-surface-low, var(--ui-background)))',
                    color: 'var(--ui-sidebar-foreground, var(--ui-foreground))',
                    paddingBlockStart: 'max(56px, calc(env(safe-area-inset-top) + 48px))',
                    paddingBlockEnd: 'max(16px, env(safe-area-inset-bottom))',
                    paddingLeft: 'max(8px, env(safe-area-inset-left))',
                    paddingRight: 'max(8px, env(safe-area-inset-right))',
                  }
                : {}),
              ...props.style,
            }}
          >
            <SheetTitle {...styles('sidebar.title', 'ui-visually-hidden', undefined, unstyled)}>
              {label}
            </SheetTitle>
            <SheetClose
              aria-label="Close navigation"
              title="Close navigation"
              {...styles('sidebar.close', 'ui-sidebar-close', undefined, unstyled)}
            >
              <X
                {...styles('sidebar.close-icon', 'ui-sidebar-trigger-icon', undefined, unstyled)}
                aria-hidden="true"
              />
            </SheetClose>
            {children}
          </SheetContent>
        </StyleProvider>
      );
    return (
      <StyleProvider unstyled={unstyled}>
        <aside
          ref={ref}
          dir={direction}
          id={id ?? contentId}
          aria-label={label}
          {...styles('sidebar.root', 'ui-sidebar ui-sidebar-desktop', className, unstyled)}
          data-state={collapsed ? 'collapsed' : 'expanded'}
          data-side={side}
          {...props}
        >
          {children}
        </aside>
      </StyleProvider>
    );
  },
);
Sidebar.displayName = 'Sidebar';

export const SidebarTrigger = /* @__PURE__ */ React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & PlainStyleProps
>(({ className, unstyled, onClick, children, ...props }, ref) => {
  const styles = useStyles();
  const { isMobile, mobileOpen, collapsed, contentId, toggle } = useSidebar();
  const trigger = (
    <button
      ref={ref}
      type="button"
      aria-label={
        isMobile ? 'Open navigation' : collapsed ? 'Expand navigation' : 'Collapse navigation'
      }
      title={isMobile ? 'Open navigation' : collapsed ? 'Expand navigation' : 'Collapse navigation'}
      aria-expanded={isMobile ? mobileOpen : !collapsed}
      aria-controls={contentId}
      {...styles('sidebar.trigger', 'ui-sidebar-trigger', className, unstyled)}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !isMobile) toggle();
      }}
    >
      {children ?? (
        <PanelLeft
          {...styles('sidebar.trigger-icon', 'ui-sidebar-trigger-icon', undefined, unstyled)}
          aria-hidden="true"
        />
      )}
    </button>
  );
  return isMobile ? <SheetTrigger asChild>{trigger}</SheetTrigger> : trigger;
});
SidebarTrigger.displayName = 'SidebarTrigger';

export const SidebarHeader = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <div
      ref={ref}
      {...styles('sidebar.header', 'ui-sidebar-header', className, unstyled)}
      {...props}
    />
  );
});
SidebarHeader.displayName = 'SidebarHeader';
export const SidebarFooter = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <div
      ref={ref}
      {...styles('sidebar.footer', 'ui-sidebar-footer', className, unstyled)}
      {...props}
    />
  );
});
SidebarFooter.displayName = 'SidebarFooter';
export const SidebarContent = /* @__PURE__ */ React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <nav
      ref={ref}
      aria-label="Sidebar navigation"
      {...styles('sidebar.content', 'ui-sidebar-content', className, unstyled)}
      {...props}
    />
  );
});
SidebarContent.displayName = 'SidebarContent';
export interface SidebarGroupProps extends React.HTMLAttributes<HTMLElement>, PlainStyleProps {
  label?: string;
}
export const SidebarGroup = /* @__PURE__ */ React.forwardRef<HTMLElement, SidebarGroupProps>(
  ({ label, children, className, unstyled, ...props }, ref) => {
    const styles = useStyles();
    const id = React.useId();
    return (
      <section
        ref={ref}
        aria-labelledby={label ? id : undefined}
        {...styles('sidebar.group', 'ui-sidebar-group', className, unstyled)}
        {...props}
      >
        {label && (
          <h2
            id={id}
            {...styles('sidebar.group-label', 'ui-sidebar-group-label', undefined, unstyled)}
          >
            {label}
          </h2>
        )}
        {children}
      </section>
    );
  },
);
SidebarGroup.displayName = 'SidebarGroup';
export const SidebarMenu = /* @__PURE__ */ React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <ul ref={ref} {...styles('sidebar.menu', 'ui-sidebar-menu', className, unstyled)} {...props} />
  );
});
SidebarMenu.displayName = 'SidebarMenu';
export const SidebarMenuItem = /* @__PURE__ */ React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <li
      ref={ref}
      {...styles('sidebar.menu-item', 'ui-sidebar-menu-item', className, unstyled)}
      {...props}
    />
  );
});
SidebarMenuItem.displayName = 'SidebarMenuItem';
export interface SidebarItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, PlainStyleProps {
  asChild?: boolean;
  active?: boolean;
  icon?: React.ReactNode;
  label?: string;
  closeOnSelect?: boolean;
}
export const SidebarItem = /* @__PURE__ */ React.forwardRef<HTMLButtonElement, SidebarItemProps>(
  (
    {
      asChild,
      active,
      icon,
      label,
      closeOnSelect = true,
      children,
      onClick,
      className,
      unstyled,
      disabled,
      onClickCapture,
      onKeyDownCapture,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const sidebar = React.useContext(SidebarContext);
    const Element = asChild ? Slot.Root : 'button';
    const accessibleLabel = label ?? (typeof children === 'string' ? children : undefined);
    const fallbackIcon =
      !icon &&
      sidebar?.collapsed &&
      !sidebar.isMobile &&
      accessibleLabel?.slice(0, 1).toLocaleUpperCase();
    return (
      <Element
        ref={ref}
        type={asChild ? undefined : 'button'}
        aria-current={active ? 'page' : undefined}
        aria-label={accessibleLabel}
        title={accessibleLabel}
        data-active={active || undefined}
        {...styles('sidebar.item', 'ui-sidebar-item', className, unstyled)}
        {...props}
        disabled={asChild ? undefined : disabled}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : props.tabIndex}
        onClickCapture={(event) => {
          if (disabled) {
            event.preventDefault();
            event.stopPropagation();
          } else onClickCapture?.(event);
        }}
        onKeyDownCapture={(event) => {
          if (disabled && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            event.stopPropagation();
          } else onKeyDownCapture?.(event);
        }}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
          if (!event.defaultPrevented && closeOnSelect && sidebar?.isMobile)
            sidebar.setMobileOpen(false);
        }}
      >
        {asChild ? (
          children
        ) : (
          <>
            {(icon || fallbackIcon) && (
              <span
                {...styles('sidebar.item-icon', 'ui-sidebar-item-icon', undefined, unstyled)}
                aria-hidden="true"
              >
                {icon || fallbackIcon}
              </span>
            )}
            <span {...styles('sidebar.item-label', 'ui-sidebar-item-label', undefined, unstyled)}>
              {children}
            </span>
          </>
        )}
      </Element>
    );
  },
);
SidebarItem.displayName = 'SidebarItem';
export const SidebarInset = /* @__PURE__ */ React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <main
      ref={ref}
      {...styles('sidebar.inset', 'ui-sidebar-inset', className, unstyled)}
      {...props}
    />
  );
});
SidebarInset.displayName = 'SidebarInset';

export interface AppShellProps extends React.HTMLAttributes<HTMLDivElement>, PlainStyleProps {
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  bottomNavigation?: React.ReactNode;
  contentId?: string;
  skipLinkLabel?: string;
}
export const AppShell = /* @__PURE__ */ React.forwardRef<HTMLDivElement, AppShellProps>(
  (
    {
      sidebar,
      header,
      footer,
      bottomNavigation,
      contentId,
      skipLinkLabel = 'Skip to content',
      children,
      className,
      unstyled,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const id = React.useId();
    const mainId = contentId ?? `main-${id}`;
    return (
      <StyleProvider unstyled={unstyled}>
        <div
          ref={ref}
          {...styles('app-shell.root', 'ui-app-shell', className, unstyled)}
          {...props}
        >
          <a
            href={`#${mainId}`}
            {...styles('app-shell.skip-link', 'ui-skip-link', undefined, unstyled)}
          >
            {skipLinkLabel}
          </a>
          {sidebar}
          <div {...styles('app-shell.body', 'ui-app-shell-body', undefined, unstyled)}>
            {header && (
              <header {...styles('app-shell.header', 'ui-app-shell-header', undefined, unstyled)}>
                {header}
              </header>
            )}
            <main
              id={mainId}
              tabIndex={-1}
              {...styles('app-shell.main', 'ui-app-shell-main', undefined, unstyled)}
            >
              {children}
            </main>
            {footer && (
              <footer {...styles('app-shell.footer', 'ui-app-shell-footer', undefined, unstyled)}>
                {footer}
              </footer>
            )}
            {bottomNavigation}
          </div>
        </div>
      </StyleProvider>
    );
  },
);
AppShell.displayName = 'AppShell';

export interface BottomNavigationItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  disabled?: boolean;
}
export interface BottomNavigationProps extends React.HTMLAttributes<HTMLElement>, PlainStyleProps {
  items: readonly BottomNavigationItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  fixed?: boolean;
}
export const BottomNavigation = /* @__PURE__ */ React.forwardRef<
  HTMLElement,
  BottomNavigationProps
>(({ items, value, defaultValue, onValueChange, fixed, className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  const [local, setLocal] = React.useState(defaultValue ?? items[0]?.value ?? '');
  const current = value ?? local;
  return (
    <nav
      ref={ref}
      aria-label="Primary navigation"
      {...styles('bottom-navigation.root', 'ui-bottom-navigation', className, unstyled)}
      data-fixed={fixed || undefined}
      {...props}
    >
      {items.map((item) => {
        const Element = item.href ? 'a' : 'button';
        return (
          <Element
            key={item.value}
            type={item.href ? undefined : 'button'}
            href={item.disabled ? undefined : item.href}
            disabled={item.href ? undefined : item.disabled}
            aria-disabled={item.disabled || undefined}
            tabIndex={item.disabled ? -1 : undefined}
            aria-current={current === item.value ? 'page' : undefined}
            {...styles('bottom-navigation.item', 'ui-bottom-navigation-item', undefined, unstyled)}
            onClick={(event) => {
              if (item.disabled) {
                event.preventDefault();
                return;
              }
              if (value === undefined) setLocal(item.value);
              onValueChange?.(item.value);
            }}
          >
            {item.icon && (
              <span
                {...styles(
                  'bottom-navigation.icon',
                  'ui-bottom-navigation-icon',
                  undefined,
                  unstyled,
                )}
                aria-hidden="true"
              >
                {item.icon}
              </span>
            )}
            <span
              {...styles(
                'bottom-navigation.label',
                'ui-bottom-navigation-label',
                undefined,
                unstyled,
              )}
            >
              {item.label}
            </span>
          </Element>
        );
      })}
    </nav>
  );
});
BottomNavigation.displayName = 'BottomNavigation';

export interface StepperStep {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}
export interface StepperProps extends React.HTMLAttributes<HTMLElement>, PlainStyleProps {
  steps: readonly StepperStep[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  linear?: boolean;
}
export const Stepper = /* @__PURE__ */ React.forwardRef<HTMLElement, StepperProps>(
  (
    {
      steps,
      value,
      defaultValue,
      onValueChange,
      orientation = 'horizontal',
      linear = false,
      className,
      unstyled,
      dir,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const direction = useDirection(dir as 'ltr' | 'rtl' | undefined);
    const [local, setLocal] = React.useState(defaultValue ?? steps[0]?.value ?? '');
    const current = value ?? local;
    const active = Math.max(
      0,
      steps.findIndex((step) => step.value === current),
    );
    return (
      <nav
        ref={ref}
        dir={direction}
        aria-label="Progress steps"
        {...styles('stepper.root', 'ui-stepper', className, unstyled)}
        data-orientation={orientation}
        {...props}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const next =
            orientation === 'vertical'
              ? 'ArrowDown'
              : direction === 'rtl'
                ? 'ArrowLeft'
                : 'ArrowRight';
          const previous =
            orientation === 'vertical'
              ? 'ArrowUp'
              : direction === 'rtl'
                ? 'ArrowRight'
                : 'ArrowLeft';
          if (![next, previous, 'Home', 'End'].includes(event.key)) return;
          const buttons = Array.from(
            event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
          );
          const index = buttons.indexOf(event.target as HTMLButtonElement);
          if (index < 0) return;
          event.preventDefault();
          buttons[
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? buttons.length - 1
                : Math.max(0, Math.min(buttons.length - 1, index + (event.key === next ? 1 : -1)))
          ]?.focus();
        }}
      >
        <ol {...styles('stepper.list', 'ui-stepper-list', undefined, unstyled)}>
          {steps.map((step, index) => (
            <li
              key={step.value}
              {...styles('stepper.item', 'ui-stepper-item', undefined, unstyled)}
              data-state={index < active ? 'complete' : index === active ? 'current' : 'pending'}
            >
              <button
                type="button"
                disabled={step.disabled || (linear && index > active + 1)}
                aria-current={index === active ? 'step' : undefined}
                {...styles('stepper.trigger', 'ui-stepper-trigger', undefined, unstyled)}
                onClick={() => {
                  if (value === undefined) setLocal(step.value);
                  onValueChange?.(step.value);
                }}
              >
                <span
                  {...styles('stepper.indicator', 'ui-stepper-indicator', undefined, unstyled)}
                  aria-hidden="true"
                >
                  {step.icon ?? (index < active ? <Check size={16} /> : index + 1)}
                </span>
                <span {...styles('stepper.text', 'ui-stepper-text', undefined, unstyled)}>
                  <span {...styles('stepper.label', 'ui-stepper-label', undefined, unstyled)}>
                    {step.label}
                  </span>
                  {step.description && (
                    <span
                      {...styles(
                        'stepper.description',
                        'ui-stepper-description',
                        undefined,
                        unstyled,
                      )}
                    >
                      {step.description}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
    );
  },
);
Stepper.displayName = 'Stepper';

export interface SegmentedControlOption {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  'aria-label'?: string;
}
export type SegmentedControlProps = React.ComponentPropsWithoutRef<typeof RadioGroup.Root> &
  PlainStyleProps & {
    options: readonly SegmentedControlOption[];
  };
export const SegmentedControl = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  SegmentedControlProps
>(({ options, className, unstyled, dir, orientation = 'horizontal', ...props }, ref) => {
  const styles = useStyles();
  const direction = useDirection(dir as 'ltr' | 'rtl' | undefined);
  return (
    <RadioGroup.Root
      ref={ref}
      dir={direction}
      orientation={orientation}
      aria-label="Options"
      {...styles('segmented-control.root', 'ui-segmented-control', className, unstyled)}
      {...props}
    >
      {options.map((option) => (
        <RadioGroup.Item
          key={option.value}
          value={option.value}
          disabled={props.disabled || option.disabled}
          aria-label={option['aria-label']}
          {...styles('segmented-control.item', 'ui-segmented-control-item', undefined, unstyled)}
        >
          {option.icon && (
            <span
              {...styles(
                'segmented-control.icon',
                'ui-segmented-control-icon',
                undefined,
                unstyled,
              )}
              aria-hidden="true"
            >
              {option.icon}
            </span>
          )}
          {option.label}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
});
SegmentedControl.displayName = 'SegmentedControl';

export interface TreeNode {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children?: readonly TreeNode[];
  disabled?: boolean;
}
export interface TreeViewProps
  extends Omit<React.HTMLAttributes<HTMLUListElement>, 'children'>, PlainStyleProps {
  nodes: readonly TreeNode[];
  selectedId?: string;
  defaultSelectedId?: string;
  onSelectionChange?: (id: string, node: TreeNode) => void;
  expandedIds?: readonly string[];
  defaultExpandedIds?: readonly string[];
  onExpandedChange?: (ids: string[]) => void;
}
interface VisibleNode {
  node: TreeNode;
  parent?: string;
}
export const TreeView = /* @__PURE__ */ React.forwardRef<HTMLUListElement, TreeViewProps>(
  (
    {
      nodes,
      selectedId,
      defaultSelectedId,
      onSelectionChange,
      expandedIds,
      defaultExpandedIds = [],
      onExpandedChange,
      className,
      unstyled,
      dir,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const direction = useDirection(dir as 'ltr' | 'rtl' | undefined);
    const id = React.useId();
    const [localSelected, setSelected] = React.useState(defaultSelectedId);
    const [localExpanded, setExpanded] = React.useState<readonly string[]>(defaultExpandedIds);
    const [focused, setFocused] = React.useState<string | undefined>(defaultSelectedId);
    const elements = React.useRef(new Map<string, HTMLLIElement>());
    const search = React.useRef({ text: '', time: 0 });
    const selected = selectedId ?? localSelected;
    const expanded = new Set(expandedIds ?? localExpanded);
    const visible: VisibleNode[] = [];
    const visit = (items: readonly TreeNode[], parent?: string) =>
      items.forEach((node) => {
        visible.push({ node, parent });
        if (node.children && expanded.has(node.id)) visit(node.children, node.id);
      });
    visit(nodes);
    const enabled = visible.filter(({ node }) => !node.disabled);
    const focusId = enabled.some(({ node }) => node.id === focused) ? focused : enabled[0]?.node.id;
    const focus = (nodeId: string | undefined) => {
      if (nodeId) {
        setFocused(nodeId);
        elements.current.get(nodeId)?.focus();
      }
    };
    const select = (node: TreeNode) => {
      if (node.disabled) return;
      if (selectedId === undefined) setSelected(node.id);
      onSelectionChange?.(node.id, node);
    };
    const changeExpanded = (next: Set<string>) => {
      const values = [...next];
      if (expandedIds === undefined) setExpanded(values);
      onExpandedChange?.(values);
    };
    const toggle = (node: TreeNode) => {
      if (node.disabled || !node.children?.length) return;
      const next = new Set(expanded);
      if (next.has(node.id)) next.delete(node.id);
      else next.add(node.id);
      changeExpanded(next);
    };
    const renderNodes = (items: readonly TreeNode[], level: number): React.ReactNode =>
      items.map((node, position) => {
        const hasChildren = !!node.children?.length;
        const open = expanded.has(node.id);
        return (
          <li
            key={node.id}
            ref={(element) => {
              if (element) elements.current.set(node.id, element);
              else elements.current.delete(node.id);
            }}
            role="treeitem"
            id={`${id}-${encodeURIComponent(node.id)}`}
            aria-label={node.label}
            aria-level={level}
            aria-posinset={position + 1}
            aria-setsize={items.length}
            aria-selected={node.id === selected}
            aria-expanded={hasChildren ? open : undefined}
            aria-disabled={node.disabled || undefined}
            tabIndex={node.id === focusId ? 0 : -1}
            {...styles('tree-view.item', 'ui-tree-item', undefined, unstyled)}
            onFocus={(event) => {
              if (event.target === event.currentTarget) setFocused(node.id);
            }}
          >
            <div
              {...styles('tree-view.row', 'ui-tree-row', undefined, unstyled)}
              style={{ paddingInlineStart: (level - 1) * 16 + 8 }}
              onClick={() => {
                if (!node.disabled) {
                  focus(node.id);
                  select(node);
                }
              }}
            >
              {hasChildren ? (
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={node.disabled}
                  aria-label={`${open ? 'Collapse' : 'Expand'} ${node.label}`}
                  {...styles('tree-view.toggle', 'ui-tree-toggle', undefined, unstyled)}
                  onClick={(event) => {
                    event.stopPropagation();
                    focus(node.id);
                    toggle(node);
                  }}
                >
                  <ChevronRight
                    {...styles('tree-view.chevron', 'ui-tree-chevron', undefined, unstyled)}
                    data-expanded={open}
                    aria-hidden="true"
                  />
                </button>
              ) : (
                <span
                  {...styles('tree-view.spacer', 'ui-tree-spacer', undefined, unstyled)}
                  aria-hidden="true"
                />
              )}
              {node.icon && (
                <span
                  {...styles('tree-view.icon', 'ui-tree-icon', undefined, unstyled)}
                  aria-hidden="true"
                >
                  {node.icon}
                </span>
              )}
              <span {...styles('tree-view.label', 'ui-tree-label', undefined, unstyled)}>
                {node.label}
              </span>
            </div>
            {hasChildren && open && (
              <ul role="group" {...styles('tree-view.group', 'ui-tree-group', undefined, unstyled)}>
                {renderNodes(node.children!, level + 1)}
              </ul>
            )}
          </li>
        );
      });
    return (
      <ul
        ref={ref}
        role="tree"
        aria-label="Files"
        dir={direction}
        {...styles('tree-view.root', 'ui-tree-view', className, unstyled)}
        {...props}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
          const target = (event.target as HTMLElement).closest('[role="treeitem"]');
          const entry = visible.find(
            ({ node }) => `${id}-${encodeURIComponent(node.id)}` === target?.id,
          );
          if (!entry || entry.node.disabled) return;
          const { node, parent } = entry;
          const index = enabled.findIndex((entry) => entry.node.id === node.id);
          const expandKey = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
          const collapseKey = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
          if (
            [
              'ArrowDown',
              'ArrowUp',
              'Home',
              'End',
              expandKey,
              collapseKey,
              'Enter',
              ' ',
              '*',
            ].includes(event.key)
          ) {
            event.preventDefault();
            if (event.key === 'ArrowDown')
              focus(enabled[Math.min(index + 1, enabled.length - 1)]?.node.id);
            else if (event.key === 'ArrowUp') focus(enabled[Math.max(index - 1, 0)]?.node.id);
            else if (event.key === 'Home') focus(enabled[0]?.node.id);
            else if (event.key === 'End') focus(enabled.at(-1)?.node.id);
            else if (event.key === expandKey) {
              if (node.children?.length && !expanded.has(node.id)) toggle(node);
              else focus(node.children?.find((child) => !child.disabled)?.id);
            } else if (event.key === collapseKey) {
              if (node.children?.length && expanded.has(node.id)) toggle(node);
              else focus(parent);
            } else if (event.key === '*') {
              const next = new Set(expanded);
              visible
                .filter(
                  (entry) =>
                    entry.parent === parent && !entry.node.disabled && entry.node.children?.length,
                )
                .forEach(({ node }) => next.add(node.id));
              changeExpanded(next);
            } else select(node);
          } else if (event.key.length === 1 && !event.nativeEvent.isComposing) {
            const now = Date.now();
            const text =
              (now - search.current.time < 700 ? search.current.text : '') +
              event.key.toLocaleLowerCase();
            search.current = { text, time: now };
            const prefix = [...text].every((character) => character === text[0]) ? text[0] : text;
            const ordered = [...enabled.slice(index + 1), ...enabled.slice(0, index + 1)];
            focus(
              ordered.find(({ node }) => node.label.toLocaleLowerCase().startsWith(prefix))?.node
                .id,
            );
          }
        }}
      >
        {renderNodes(nodes, 1)}
      </ul>
    );
  },
);
TreeView.displayName = 'TreeView';
