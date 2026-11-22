import * as React from 'react';
import { useMediaQuery } from './media-query';
import { numberFormatter, useTranslation } from './i18n';
import { RadioGroup, Slot } from 'radix-ui';
import { Check, ChevronRight, PanelLeft, X } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from './sheet';
import { StyleProvider, useDirection, useStyles, type PlainStyleProps } from './style-context';
import { useSelectionIndicator } from './selection-indicator';
import { inertAttribute } from './utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { LayoutPresence, useLayoutPresence, type LayoutPresenceProps } from './layout-presence';
import {
  NavigationExpansionFrame,
  navigationExpansionEvents,
  useNavigationExpansion,
  type NavigationExpansionProps,
} from './navigation-expansion';
export type { NavigationExpansionProps } from './navigation-expansion';

export interface SidebarContextValue {
  collapsed: boolean;
  /** Effective visibility, including a temporary hover/focus preview. */
  expanded: boolean;
  hoverExpanded: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  isMobile: boolean;
  contentId: string;
  toggle: () => void;
  collapsible: 'icon' | 'offcanvas' | 'none';
}
const SidebarContext = /* @__PURE__ */ React.createContext<
  | (SidebarContextValue & {
      setContentId: (id: string) => void;
      variables: React.CSSProperties;
      expansion: ReturnType<typeof useNavigationExpansion>;
      expansionMode: 'inline' | 'overlay';
      overlayBackdrop: boolean;
    })
  | null
>(null);

export function useSidebar(): SidebarContextValue {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error('Sidebar components must be used inside SidebarProvider.');
  return context;
}

export interface SidebarProviderProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    PlainStyleProps,
    LayoutPresenceProps,
    NavigationExpansionProps {
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
  mobileWidth?: string;
  collapsible?: 'icon' | 'offcanvas' | 'none';
  /** Set false to disable the scoped Ctrl/Cmd shortcut. */
  shortcut?: string | false;
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
      mobileWidth,
      collapsible = 'icon',
      expandOnHover = false,
      expansionMode = 'inline',
      hoverOpenDelay,
      hoverCloseDelay,
      overlayBackdrop = true,
      shortcut = 'b',
      className,
      style,
      presence,
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
    const breakpoint = Number.isFinite(mobileBreakpoint) ? Math.max(1, mobileBreakpoint) : 768;
    const isMobile = useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
    const collapsed = collapsible !== 'none' && (controlledCollapsed ?? localCollapsed);
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
    const setExpanded = React.useCallback((next: boolean) => setCollapsed(!next), [setCollapsed]);
    const expansion = useNavigationExpansion({
      expanded: !collapsed,
      onExpandedChange: setExpanded,
      enabled: !isMobile && collapsible !== 'none',
      expandOnHover: expandOnHover && collapsible === 'icon',
      expansionMode,
      hoverOpenDelay,
      hoverCloseDelay,
    });
    const toggle = React.useCallback(() => {
      if (isMobile) setMobileOpen(!mobileOpen);
      else if (collapsible !== 'none') setCollapsed(!collapsed);
    }, [isMobile, setMobileOpen, mobileOpen, setCollapsed, collapsed, collapsible]);
    const providerRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => providerRef.current!);
    React.useEffect(() => {
      if (!shortcut) return;
      const key = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
        if (
          !(event.ctrlKey || event.metaKey) ||
          event.key.toLowerCase() !== shortcut.toLowerCase() ||
          event.defaultPrevented ||
          event.altKey ||
          event.shiftKey
        )
          return;
        if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
        if (
          !providerRef.current?.contains(target) &&
          !document.getElementById(contentId)?.contains(target) &&
          !(
            target === document.body &&
            document.querySelectorAll('[data-ui="sidebar"][data-slot="provider"]').length === 1
          )
        )
          return;
        if (!isMobile && collapsible === 'none') return;
        event.preventDefault();
        toggle();
      };
      document.addEventListener('keydown', key);
      return () => document.removeEventListener('keydown', key);
    }, [shortcut, toggle, isMobile, collapsible, contentId]);
    const variables = React.useMemo(
      () =>
        ({
          ...Object.fromEntries(
            Object.entries(style ?? {}).filter(([key]) => key.startsWith('--ui-')),
          ),
          ...(width ? { '--ui-sidebar-width': width } : {}),
          ...(collapsedWidth ? { '--ui-sidebar-collapsed-width': collapsedWidth } : {}),
          ...(mobileWidth ? { '--ui-sidebar-mobile-width': mobileWidth } : {}),
        }) as React.CSSProperties,
      [style, width, collapsedWidth, mobileWidth],
    );
    const context = React.useMemo(
      () => ({
        collapsed,
        expanded: isMobile ? mobileOpen : expansion.expanded,
        hoverExpanded: expansion.hoverExpanded,
        expansion,
        expansionMode,
        overlayBackdrop,
        setCollapsed,
        mobileOpen,
        setMobileOpen,
        isMobile,
        contentId,
        setContentId,
        toggle,
        variables,
        collapsible,
      }),
      [
        collapsed,
        expansion,
        expansionMode,
        overlayBackdrop,
        setCollapsed,
        mobileOpen,
        setMobileOpen,
        isMobile,
        contentId,
        toggle,
        variables,
        collapsible,
      ],
    );
    return (
      <SidebarContext.Provider value={context}>
        <StyleProvider unstyled={unstyled}>
          <Sheet open={isMobile && mobileOpen} onOpenChange={setMobileOpen}>
            <LayoutPresence asChild presence={presence ?? false}>
              {styles.tooltip(
                <div
                  ref={providerRef}
                  dir={direction}
                  {...styles('sidebar.provider', 'ui-sidebar-provider', className, unstyled)}
                  data-sidebar-state={expansion.expanded ? 'expanded' : 'collapsed'}
                  data-sidebar-pinned={!collapsed}
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
                </div>,
                unstyled,
              )}
            </LayoutPresence>
          </Sheet>
        </StyleProvider>
      </SidebarContext.Provider>
    );
  },
);
SidebarProvider.displayName = 'SidebarProvider';

export interface SidebarProps
  extends React.HTMLAttributes<HTMLElement>, PlainStyleProps, LayoutPresenceProps {
  side?: 'start' | 'end';
  label?: string;
  variant?: 'sidebar' | 'inset' | 'floating';
}
export const Sidebar = /* @__PURE__ */ React.forwardRef<HTMLElement, SidebarProps>(
  (
    {
      side = 'start',
      label: labelProp,
      variant = 'sidebar',
      id,
      children,
      className,
      unstyled,
      dir,
      presence,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const { t } = useTranslation();
    const label = labelProp ?? t('navigation.label');
    const context = React.useContext(SidebarContext);
    if (!context) throw new Error('Sidebar must be used inside SidebarProvider.');
    const {
      isMobile,
      expanded,
      expansion,
      expansionMode,
      overlayBackdrop,
      contentId,
      setContentId,
      variables,
      collapsible,
    } = context;
    const direction = useDirection(dir as 'ltr' | 'rtl' | undefined);
    const setExpansionNode = expansion.setNode;
    const setNode = React.useCallback(
      (node: HTMLElement | null) => {
        setExpansionNode(node);
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref, setExpansionNode],
    );
    React.useEffect(() => {
      if (id) setContentId(id);
    }, [id, setContentId]);
    if (isMobile)
      return (
        <StyleProvider unstyled={unstyled}>
          <LayoutPresence asChild presence={presence ?? false}>
            {styles.tooltip(
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
                        width: 'var(--ui-sidebar-mobile-width, 288px)',
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
                  aria-label={t('navigation.close')}
                  title={t('navigation.close')}
                  {...styles('sidebar.close', 'ui-sidebar-close', undefined, unstyled)}
                >
                  <X
                    {...styles(
                      'sidebar.close-icon',
                      'ui-sidebar-trigger-icon',
                      undefined,
                      unstyled,
                    )}
                    aria-hidden="true"
                  />
                </SheetClose>
                {children}
              </SheetContent>,
              unstyled,
            )}
          </LayoutPresence>
        </StyleProvider>
      );
    const desktop = (
      <StyleProvider unstyled={unstyled}>
        <LayoutPresence asChild presence={presence ?? false}>
          {styles.tooltip(
            <aside
              ref={setNode}
              dir={direction}
              id={id ?? contentId}
              aria-label={label}
              {...styles('sidebar.root', 'ui-sidebar ui-sidebar-desktop', className, unstyled)}
              data-state={expanded ? 'expanded' : 'collapsed'}
              data-hover-expanded={expansion.hoverExpanded || undefined}
              data-expansion-mode={collapsible === 'none' ? 'inline' : expansionMode}
              data-side={side}
              data-variant={variant}
              data-collapsible={collapsible}
              inert={inertAttribute(!expanded && collapsible === 'offcanvas')}
              {...props}
              {...navigationExpansionEvents(props, expansion.events)}
            >
              {children}
            </aside>,
            unstyled,
          )}
        </LayoutPresence>
      </StyleProvider>
    );
    return expansionMode === 'overlay' && collapsible !== 'none' ? (
      <NavigationExpansionFrame
        kind="sidebar"
        dir={direction}
        side={side}
        variant={variant}
        expanded={expanded}
        backdrop={overlayBackdrop}
        node={expansion.node}
        dismiss={expansion.dismiss}
        unstyled={unstyled}
        style={{
          ...variables,
          ...Object.fromEntries(
            Object.entries(props.style ?? {}).filter(([key]) => key.startsWith('--ui-')),
          ),
        }}
        offcanvas={collapsible === 'offcanvas'}
      >
        {desktop}
      </NavigationExpansionFrame>
    ) : (
      desktop
    );
  },
);
Sidebar.displayName = 'Sidebar';

export const SidebarTrigger = /* @__PURE__ */ React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & PlainStyleProps
>(({ className, unstyled, onClick, children, ...props }, ref) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const {
    isMobile,
    mobileOpen,
    collapsed,
    expanded,
    hoverExpanded,
    contentId,
    toggle,
    collapsible,
  } = useSidebar();
  const desktopLabel = hoverExpanded
    ? t('navigation.pin')
    : t(collapsed ? 'navigation.expand' : 'navigation.collapse');
  const trigger = styles.tooltip(
    <button
      ref={ref}
      type="button"
      aria-label={isMobile ? t('navigation.open') : desktopLabel}
      title={isMobile ? t('navigation.open') : desktopLabel}
      aria-expanded={isMobile ? mobileOpen : expanded}
      aria-controls={contentId}
      hidden={!isMobile && collapsible === 'none'}
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
    </button>,
    unstyled,
  );
  return isMobile ? <SheetTrigger asChild>{trigger}</SheetTrigger> : trigger;
});
SidebarTrigger.displayName = 'SidebarTrigger';

export interface SidebarSectionProps
  extends React.HTMLAttributes<HTMLDivElement>, PlainStyleProps, LayoutPresenceProps {
  /** Alternate content for the desktop icon rail. Mobile retains children. */
  collapsedContent?: React.ReactNode;
}
export const SidebarHeader = /* @__PURE__ */ React.forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, unstyled, collapsedContent, children, presence, ...props }, ref) => {
    const styles = useStyles();
    const context = React.useContext(SidebarContext);
    const compact =
      context && !context.expanded && !context.isMobile && context.collapsible === 'icon';
    return (
      <LayoutPresence asChild presence={presence ?? false}>
        {styles.tooltip(
          <div
            ref={ref}
            {...styles('sidebar.header', 'ui-sidebar-header', className, unstyled)}
            {...props}
          >
            {collapsedContent === undefined ? (
              children
            ) : (
              <div className="ui-sidebar-section-swap">
                <div
                  data-expanded-content=""
                  aria-hidden={compact || undefined}
                  inert={inertAttribute(!!compact)}
                >
                  {children}
                </div>
                <div
                  data-collapsed-content=""
                  aria-hidden={!compact || undefined}
                  inert={inertAttribute(!compact)}
                >
                  {collapsedContent}
                </div>
              </div>
            )}
          </div>,
          unstyled,
        )}
      </LayoutPresence>
    );
  },
);
SidebarHeader.displayName = 'SidebarHeader';
export const SidebarFooter = /* @__PURE__ */ React.forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ className, unstyled, collapsedContent, children, presence, ...props }, ref) => {
    const styles = useStyles();
    const context = React.useContext(SidebarContext);
    const compact =
      context && !context.expanded && !context.isMobile && context.collapsible === 'icon';
    return (
      <LayoutPresence asChild presence={presence ?? false}>
        {styles.tooltip(
          <div
            ref={ref}
            {...styles('sidebar.footer', 'ui-sidebar-footer', className, unstyled)}
            {...props}
          >
            {collapsedContent === undefined ? (
              children
            ) : (
              <div className="ui-sidebar-section-swap">
                <div
                  data-expanded-content=""
                  aria-hidden={compact || undefined}
                  inert={inertAttribute(!!compact)}
                >
                  {children}
                </div>
                <div
                  data-collapsed-content=""
                  aria-hidden={!compact || undefined}
                  inert={inertAttribute(!compact)}
                >
                  {collapsedContent}
                </div>
              </div>
            )}
          </div>,
          unstyled,
        )}
      </LayoutPresence>
    );
  },
);
SidebarFooter.displayName = 'SidebarFooter';
export const SidebarContent = /* @__PURE__ */ React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & PlainStyleProps & LayoutPresenceProps
>(({ className, unstyled, presence, children, ...props }, ref) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const scope = useLayoutPresence(children, presence, ref);
  return styles.tooltip(
    <nav
      ref={scope.ref}
      children={scope.children}
      aria-label={t('navigation.sidebar')}
      {...styles('sidebar.content', 'ui-sidebar-content', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});
SidebarContent.displayName = 'SidebarContent';
export interface SidebarGroupProps
  extends React.HTMLAttributes<HTMLElement>, PlainStyleProps, LayoutPresenceProps {
  label?: string;
}
export const SidebarGroup = /* @__PURE__ */ React.forwardRef<HTMLElement, SidebarGroupProps>(
  ({ label, children, className, unstyled, presence, ...props }, ref) => {
    const styles = useStyles();

    const id = React.useId();
    return (
      <LayoutPresence asChild presence={presence ?? false}>
        {styles.tooltip(
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
          </section>,
          unstyled,
        )}
      </LayoutPresence>
    );
  },
);
SidebarGroup.displayName = 'SidebarGroup';
export const SidebarMenu = /* @__PURE__ */ React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement> & PlainStyleProps & LayoutPresenceProps
>(({ className, unstyled, presence, children, ...props }, ref) => {
  const styles = useStyles();
  const scope = useLayoutPresence(children, presence, ref);

  return styles.tooltip(
    <ul
      ref={scope.ref}
      children={scope.children}
      {...styles('sidebar.menu', 'ui-sidebar-menu', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});
SidebarMenu.displayName = 'SidebarMenu';
export const SidebarMenuItem = /* @__PURE__ */ React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <li
      ref={ref}
      {...styles('sidebar.menu-item', 'ui-sidebar-menu-item', className, unstyled)}
      {...props}
    />,
    unstyled,
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
    const fallbackIcon = !icon && accessibleLabel?.slice(0, 1).toLocaleUpperCase();
    return styles.tooltip(
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
                data-fallback={!icon || undefined}
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
      </Element>,
      unstyled,
    );
  },
);
SidebarItem.displayName = 'SidebarItem';
export const SidebarMenuButton = SidebarItem;
export const SidebarGroupLabel = /* @__PURE__ */ React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <h2
      ref={ref}
      {...styles('sidebar.group-label', 'ui-sidebar-group-label', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});
SidebarGroupLabel.displayName = 'SidebarGroupLabel';
export const SidebarGroupContent = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <div
      ref={ref}
      {...styles('sidebar.group-content', 'ui-sidebar-group-content', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});
SidebarGroupContent.displayName = 'SidebarGroupContent';
export const SidebarGroupAction = /* @__PURE__ */ React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & PlainStyleProps & { asChild?: boolean }
>(({ asChild, className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <Button
      ref={ref}
      asChild={asChild}
      size="icon"
      variant="ghost"
      {...styles('sidebar.group-action', 'ui-sidebar-group-action', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});
SidebarGroupAction.displayName = 'SidebarGroupAction';
export const SidebarMenuAction = /* @__PURE__ */ React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> &
    PlainStyleProps & { asChild?: boolean; showOnHover?: boolean }
>(({ asChild, showOnHover = false, className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <Button
      ref={ref}
      asChild={asChild}
      size="icon"
      variant="ghost"
      data-hover-only={showOnHover || undefined}
      {...styles('sidebar.menu-action', 'ui-sidebar-menu-action', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});
SidebarMenuAction.displayName = 'SidebarMenuAction';
export const SidebarMenuBadge = /* @__PURE__ */ React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <span
      ref={ref}
      {...styles('sidebar.menu-badge', 'ui-sidebar-menu-badge', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});
SidebarMenuBadge.displayName = 'SidebarMenuBadge';
export const SidebarMenuSub = /* @__PURE__ */ React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <ul
      ref={ref}
      {...styles('sidebar.menu-sub', 'ui-sidebar-menu-sub', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});
SidebarMenuSub.displayName = 'SidebarMenuSub';
export const SidebarMenuSubItem = SidebarMenuItem;
export const SidebarMenuSubButton = /* @__PURE__ */ React.forwardRef<
  HTMLButtonElement,
  SidebarItemProps
>(({ className, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <SidebarItem
      ref={ref}
      {...props}
      {...styles('sidebar.sub-button', 'ui-sidebar-sub-button', className, props.unstyled)}
    />,
  );
});
SidebarMenuSubButton.displayName = 'SidebarMenuSubButton';
export const SidebarInput = /* @__PURE__ */ React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  const sidebar = React.useContext(SidebarContext);
  const compact =
    !!sidebar && !sidebar.expanded && !sidebar.isMobile && sidebar.collapsible === 'icon';

  return styles.tooltip(
    <Input
      ref={ref}
      {...styles('sidebar.input', 'ui-sidebar-input', className, unstyled)}
      inert={inertAttribute(compact)}
      aria-hidden={compact || undefined}
      unstyled={unstyled}
      {...props}
    />,
    unstyled,
  );
});
SidebarInput.displayName = 'SidebarInput';
export const SidebarSeparator = /* @__PURE__ */ React.forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <hr
      ref={ref}
      {...styles('sidebar.separator', 'ui-sidebar-separator', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});
SidebarSeparator.displayName = 'SidebarSeparator';
export const SidebarRail = /* @__PURE__ */ React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & PlainStyleProps
>(({ className, unstyled, onClick, ...props }, ref) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { toggle, expanded, hoverExpanded, contentId, collapsible, isMobile } = useSidebar();
  const label = t(
    hoverExpanded ? 'navigation.pin' : expanded ? 'navigation.collapse' : 'navigation.expand',
  );
  return styles.tooltip(
    <button
      ref={ref}
      type="button"
      hidden={isMobile || collapsible === 'none'}
      aria-label={label}
      title={label}
      aria-controls={contentId}
      aria-expanded={expanded}
      {...styles('sidebar.rail', 'ui-sidebar-rail ui-edge-handle', className, unstyled)}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) toggle();
      }}
    />,
    unstyled,
  );
});
SidebarRail.displayName = 'SidebarRail';
export const SidebarInset = /* @__PURE__ */ React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & PlainStyleProps & LayoutPresenceProps & { asChild?: boolean }
>(({ className, unstyled, asChild, presence, children, ...props }, ref) => {
  const styles = useStyles();
  const scope = useLayoutPresence(children, presence, ref, asChild);

  const Element = asChild ? Slot.Root : 'main';
  return styles.tooltip(
    <Element
      ref={scope.ref}
      children={scope.children}
      {...styles('sidebar.inset', 'ui-sidebar-inset', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});
SidebarInset.displayName = 'SidebarInset';

export interface AppShellProps
  extends React.HTMLAttributes<HTMLDivElement>, PlainStyleProps, LayoutPresenceProps {
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
      skipLinkLabel: skipLinkLabelProp,
      children,
      className,
      unstyled,
      presence,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const scope = useLayoutPresence<HTMLElement>(children, presence);

    const id = React.useId();
    const mainId = contentId ?? `main-${id}`;
    const { t } = useTranslation();
    const skipLinkLabel = skipLinkLabelProp ?? t('navigation.skip');
    return (
      <StyleProvider unstyled={unstyled}>
        {styles.tooltip(
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
                ref={scope.ref}
                id={mainId}
                tabIndex={-1}
                {...styles('app-shell.main', 'ui-app-shell-main', undefined, unstyled)}
              >
                {scope.children}
              </main>
              {footer && (
                <footer {...styles('app-shell.footer', 'ui-app-shell-footer', undefined, unstyled)}>
                  {footer}
                </footer>
              )}
              {bottomNavigation}
            </div>
          </div>,
          unstyled,
        )}
      </StyleProvider>
    );
  },
);
AppShell.displayName = 'AppShell';

export interface NavigationRailProps
  extends React.HTMLAttributes<HTMLElement>, PlainStyleProps, NavigationExpansionProps {
  items: readonly BottomNavigationItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  side?: 'start' | 'end';
  variant?: 'attached' | 'inset' | 'floating';
  width?: React.CSSProperties['width'];
  hideOnMobile?: boolean;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  expandedWidth?: React.CSSProperties['width'];
}

/** A persistent app/workspace switcher; SidebarRail remains the collapse edge control. */
export const NavigationRail = /* @__PURE__ */ React.forwardRef<HTMLElement, NavigationRailProps>(
  (
    {
      items,
      value,
      defaultValue,
      onValueChange,
      header,
      footer,
      side = 'start',
      variant = 'attached',
      width,
      hideOnMobile = true,
      expanded: controlledExpanded,
      defaultExpanded = false,
      onExpandedChange,
      expandedWidth,
      expandOnHover = false,
      expansionMode = 'inline',
      hoverOpenDelay,
      hoverCloseDelay,
      overlayBackdrop = true,
      className,
      style,
      unstyled,
      dir,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const direction = useDirection(dir as 'ltr' | 'rtl' | undefined);
    const { t } = useTranslation();
    const [local, setLocal] = React.useState(
      defaultValue ?? items.find((item) => !item.disabled)?.value ?? '',
    );
    const current = value ?? local;
    const [localExpanded, updateExpanded] = React.useState(defaultExpanded);
    const setExpanded = React.useCallback(
      (next: boolean) => {
        if (controlledExpanded === undefined) updateExpanded(next);
        onExpandedChange?.(next);
      },
      [controlledExpanded, onExpandedChange],
    );
    const mobile = useMediaQuery(
      '(max-width: 767px)',
      expandOnHover || expansionMode === 'overlay',
    );
    const expansion = useNavigationExpansion({
      expanded: controlledExpanded ?? localExpanded,
      onExpandedChange: setExpanded,
      enabled: !mobile,
      expandOnHover,
      expansionMode,
      hoverOpenDelay,
      hoverCloseDelay,
    });
    const generatedId = React.useId();
    const setExpansionNode = expansion.setNode;
    const setNode = React.useCallback(
      (node: HTMLElement | null) => {
        setExpansionNode(node);
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref, setExpansionNode],
    );
    const variables = {
      ...(width !== undefined
        ? { '--ui-navigation-rail-width': typeof width === 'number' ? `${width}px` : width }
        : {}),
      ...(expandedWidth !== undefined
        ? {
            '--ui-navigation-rail-expanded-width':
              typeof expandedWidth === 'number' ? `${expandedWidth}px` : expandedWidth,
          }
        : {}),
      ...Object.fromEntries(Object.entries(style ?? {}).filter(([key]) => key.startsWith('--ui-'))),
    } as React.CSSProperties;
    const list = React.useRef<HTMLDivElement>(null);
    useSelectionIndicator(list, '[aria-current="page"]', !(unstyled ?? styles.unstyled));
    const rail = (
      <TooltipProvider delayDuration={300}>
        {styles.tooltip(
          <nav
            ref={setNode}
            dir={direction}
            id={props.id ?? `navigation-rail-${generatedId}`}
            aria-label={t('navigation.primary')}
            data-side={side}
            data-variant={variant}
            data-hide-on-mobile={hideOnMobile}
            data-state={expansion.expanded ? 'expanded' : 'collapsed'}
            data-hover-expanded={expansion.hoverExpanded || undefined}
            data-expansion-mode={expansionMode}
            {...styles('navigation-rail.root', 'ui-navigation-rail', className, unstyled)}
            style={{
              ...variables,
              ...((unstyled ?? styles.unstyled)
                ? { width: expansion.expanded ? (expandedWidth ?? width) : width }
                : {}),
              ...style,
            }}
            {...props}
            {...navigationExpansionEvents(props, expansion.events)}
          >
            {header && (
              <div
                {...styles(
                  'navigation-rail.header',
                  'ui-navigation-rail-header',
                  undefined,
                  unstyled,
                )}
              >
                {header}
              </div>
            )}
            <div
              ref={list}
              {...styles('navigation-rail.items', 'ui-navigation-rail-items', undefined, unstyled)}
            >
              {items.map((item) => {
                const Element = item.href ? 'a' : 'button';
                return (
                  <Tooltip key={item.value} open={expansion.expanded ? false : undefined}>
                    <TooltipTrigger asChild>
                      <Element
                        type={item.href ? undefined : 'button'}
                        href={item.disabled ? undefined : item.href}
                        disabled={item.href ? undefined : item.disabled}
                        tabIndex={item.disabled ? -1 : undefined}
                        aria-disabled={item.disabled || undefined}
                        aria-label={item.label}
                        aria-current={current === item.value ? 'page' : undefined}
                        {...styles(
                          'navigation-rail.item',
                          'ui-navigation-rail-item',
                          undefined,
                          unstyled,
                        )}
                        onClick={(event) => {
                          if (item.disabled) {
                            event.preventDefault();
                            return;
                          }
                          if (value === undefined) setLocal(item.value);
                          onValueChange?.(item.value);
                        }}
                      >
                        <span
                          {...styles(
                            'navigation-rail.icon',
                            'ui-navigation-rail-icon',
                            undefined,
                            unstyled,
                          )}
                          aria-hidden="true"
                        >
                          {item.renderIcon?.(current === item.value) ??
                            item.icon ??
                            item.label.slice(0, 1)}
                        </span>
                        <span
                          aria-hidden="true"
                          {...styles(
                            'navigation-rail.label',
                            'ui-navigation-rail-label',
                            undefined,
                            unstyled,
                          )}
                        >
                          {item.label}
                        </span>
                        {item.badge != null && (
                          <span
                            {...styles(
                              'navigation-rail.badge',
                              'ui-navigation-rail-badge',
                              undefined,
                              unstyled,
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Element>
                    </TooltipTrigger>
                    <TooltipContent
                      side={(side === 'start') === (direction === 'ltr') ? 'right' : 'left'}
                    >
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
              <span
                aria-hidden="true"
                {...styles(
                  'navigation-rail.indicator',
                  'ui-selection-indicator',
                  undefined,
                  unstyled,
                )}
              />
            </div>
            {footer && (
              <div
                {...styles(
                  'navigation-rail.footer',
                  'ui-navigation-rail-footer',
                  undefined,
                  unstyled,
                )}
              >
                {footer}
              </div>
            )}
          </nav>,
          unstyled,
        )}
      </TooltipProvider>
    );
    return expansionMode === 'overlay' ? (
      <NavigationExpansionFrame
        kind="navigation-rail"
        dir={direction}
        side={side}
        variant={variant}
        expanded={expansion.expanded && !(hideOnMobile && mobile)}
        backdrop={overlayBackdrop}
        node={expansion.node}
        dismiss={expansion.dismiss}
        unstyled={unstyled}
        style={variables}
        hideOnMobile={hideOnMobile}
      >
        {rail}
      </NavigationExpansionFrame>
    ) : (
      rail
    );
  },
);
NavigationRail.displayName = 'NavigationRail';

export interface BottomNavigationItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  renderIcon?: (active: boolean) => React.ReactNode;
  badge?: React.ReactNode;
  href?: string;
  disabled?: boolean;
}
export interface BottomNavigationProps extends React.HTMLAttributes<HTMLElement>, PlainStyleProps {
  items: readonly BottomNavigationItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  fixed?: boolean;
  itemLayout?: 'stacked' | 'inline';
  mode?: 'attached' | 'detached';
  showLabels?: boolean;
  indicator?: 'icon' | 'full';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'attached' | 'inset' | 'floating';
  maxWidth?: React.CSSProperties['maxWidth'];
  animated?: boolean;
}
export const BottomNavigation = /* @__PURE__ */ React.forwardRef<
  HTMLElement,
  BottomNavigationProps
>(
  (
    {
      items,
      value,
      defaultValue,
      onValueChange,
      fixed,
      itemLayout = 'stacked',
      mode = 'attached',
      showLabels = true,
      indicator = 'icon',
      size = 'md',
      variant,
      maxWidth,
      animated = true,
      className,
      style,
      unstyled,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const root = React.useRef<HTMLElement>(null);
    React.useImperativeHandle(ref, () => root.current!);
    useSelectionIndicator(
      root,
      indicator === 'icon'
        ? '[aria-current="page"] .ui-bottom-navigation-icon, [aria-current="page"]:not(:has(.ui-bottom-navigation-icon))'
        : '[aria-current="page"]',
      animated && !(unstyled ?? styles.unstyled),
    );
    const [local, setLocal] = React.useState(defaultValue ?? items[0]?.value ?? '');
    const current = value ?? local;
    const { t } = useTranslation();
    return styles.tooltip(
      <nav
        ref={root}
        aria-label={t('navigation.primary')}
        {...styles('bottom-navigation.root', 'ui-bottom-navigation', className, unstyled)}
        data-fixed={fixed || undefined}
        data-layout={itemLayout}
        data-mode={mode}
        data-variant={variant ?? (mode === 'detached' ? 'floating' : 'attached')}
        data-indicator={indicator}
        data-size={size}
        data-labels={showLabels}
        style={{ ...(maxWidth !== undefined ? { maxWidth } : {}), ...style }}
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
              aria-label={!showLabels ? item.label : undefined}
              title={!showLabels ? item.label : undefined}
              {...styles(
                'bottom-navigation.item',
                'ui-bottom-navigation-item',
                undefined,
                unstyled,
              )}
              onClick={(event) => {
                if (item.disabled) {
                  event.preventDefault();
                  return;
                }
                if (value === undefined) setLocal(item.value);
                onValueChange?.(item.value);
              }}
            >
              {(item.icon || item.renderIcon) && (
                <span
                  {...styles(
                    'bottom-navigation.icon',
                    'ui-bottom-navigation-icon',
                    undefined,
                    unstyled,
                  )}
                  aria-hidden="true"
                >
                  {item.renderIcon?.(current === item.value) ?? item.icon}
                  {item.badge != null && (
                    <span className="ui-bottom-navigation-badge">{item.badge}</span>
                  )}
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
        <span
          aria-hidden="true"
          {...styles('bottom-navigation.indicator', 'ui-selection-indicator', undefined, unstyled)}
        />
      </nav>,
      unstyled,
    );
  },
);
BottomNavigation.displayName = 'BottomNavigation';

export interface StepperStep {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  status?: 'complete' | 'error' | 'pending';
}
export type StepperStepState = 'complete' | 'current' | 'pending' | 'error';
export interface StepperProps extends React.HTMLAttributes<HTMLElement>, PlainStyleProps {
  steps: readonly StepperStep[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  linear?: boolean;
  renderContent?: (step: StepperStep, index: number) => React.ReactNode;
  variant?: 'default' | 'compact' | 'dots';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  showDescriptions?: boolean;
  labelPlacement?: 'bottom' | 'inline';
  keepMounted?: boolean;
  renderIndicator?: (step: StepperStep, index: number, state: StepperStepState) => React.ReactNode;
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
      renderContent,
      variant = 'default',
      size = 'md',
      showLabels = true,
      showDescriptions = true,
      labelPlacement = 'bottom',
      keepMounted = false,
      renderIndicator,
      className,
      unstyled,
      dir,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const { t, locale } = useTranslation();
    const direction = useDirection(dir as 'ltr' | 'rtl' | undefined);
    const [local, setLocal] = React.useState(defaultValue ?? steps[0]?.value ?? '');
    const current = value ?? local;
    const active = Math.max(
      0,
      steps.findIndex((step) => step.value === current),
    );
    return styles.tooltip(
      <nav
        ref={ref}
        dir={direction}
        aria-label={t('navigation.steps')}
        {...styles('stepper.root', 'ui-stepper', className, unstyled)}
        data-orientation={orientation}
        data-variant={variant}
        data-size={size}
        data-label-placement={labelPlacement}
        data-labels={showLabels}
        data-descriptions={showDescriptions}
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
            event.currentTarget.querySelectorAll<HTMLButtonElement>(
              ':scope > [data-slot="list"] > [data-slot="item"] > [data-slot="trigger"]:not(:disabled)',
            ),
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
          {steps.map((step, index) => {
            const state: StepperStepState =
              step.status ??
              (index < active ? 'complete' : index === active ? 'current' : 'pending');
            return (
              <li
                key={step.value}
                {...styles('stepper.item', 'ui-stepper-item', undefined, unstyled)}
                data-state={state}
              >
                <button
                  type="button"
                  disabled={step.disabled || (linear && index > active + 1)}
                  aria-current={index === active ? 'step' : undefined}
                  aria-label={!showLabels ? step.label : undefined}
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
                    {renderIndicator
                      ? renderIndicator(step, index, state)
                      : (step.icon ??
                        (state === 'complete' ? (
                          <Check size={16} />
                        ) : state === 'error' ? (
                          '!'
                        ) : (
                          numberFormatter(locale).format(index + 1)
                        )))}
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
            );
          })}
        </ol>
        {renderContent &&
          keepMounted &&
          steps.map((step, index) => (
            <div
              key={step.value}
              hidden={index !== active}
              data-state={index === active ? 'active' : 'inactive'}
              {...styles('stepper.content', 'ui-stepper-content', undefined, unstyled)}
            >
              {renderContent(step, index)}
            </div>
          ))}
        {renderContent && !keepMounted && steps[active] && (
          <div
            key={current}
            {...styles('stepper.content', 'ui-stepper-content', undefined, unstyled)}
          >
            {renderContent(steps[active], active)}
          </div>
        )}
      </nav>,
      unstyled,
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
    animated?: boolean;
  };
export const SegmentedControl = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  SegmentedControlProps
>(
  (
    { options, animated = true, className, unstyled, dir, orientation = 'horizontal', ...props },
    ref,
  ) => {
    const styles = useStyles();
    const { t } = useTranslation();
    const direction = useDirection(dir as 'ltr' | 'rtl' | undefined);
    const root = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => root.current!);
    useSelectionIndicator(
      root,
      '[role="radio"][data-state="checked"]',
      animated && !(unstyled ?? styles.unstyled),
    );
    return styles.tooltip(
      <RadioGroup.Root
        ref={root}
        dir={direction}
        orientation={orientation}
        aria-label={t('common.options')}
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
        <span
          aria-hidden="true"
          {...styles('segmented-control.indicator', 'ui-selection-indicator', undefined, unstyled)}
        />
      </RadioGroup.Root>,
      unstyled,
    );
  },
);
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
  expandOnClick?: boolean;
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
      expandOnClick = true,
      className,
      unstyled,
      dir,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const { t } = useTranslation();
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
                  if (expandOnClick) toggle(node);
                }
              }}
            >
              {hasChildren ? (
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={node.disabled}
                  aria-label={t(open ? 'common.collapse' : 'common.expand', { label: node.label })}
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
    return styles.tooltip(
      <ul
        ref={ref}
        role="tree"
        aria-label={t('navigation.files')}
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
            } else {
              select(node);
              if (expandOnClick) toggle(node);
            }
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
      </ul>,
      unstyled,
    );
  },
);
TreeView.displayName = 'TreeView';
