import * as React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import {
  Sun,
  Moon,
  SlidersHorizontal,
  Search,
  Menu,
  MoveHorizontal,
  ArrowUpRight,
  Code2,
} from 'lucide-react';
import {
  PlainProvider,
  TooltipProvider,
  Toaster,
  Kbd,
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  Spinner,
  useTheme,
  type TextDirection,
  tokenNames,
  type ThemeTokens,
} from './ui';
import { Sidebar } from './docs/Sidebar';
import { IconButton } from './docs/shared';
import { SearchDialog } from './docs/SearchDialog';
import { ThemeEditor } from './docs/ThemeEditor';
import { AppPreferences } from './docs/preferences';
import Overview from './docs/pages/Overview';
import { BrandLogo } from './docs/BrandLogo';
import { VersionSwitcher } from './docs/VersionSwitcher';
const ComponentPage = React.lazy(() => import('./docs/pages/ComponentPage'));
const ComponentsPage = React.lazy(() => import('./docs/pages/ComponentsPage'));
const GuidePage = React.lazy(() => import('./docs/pages/GuidePage'));
const ExamplesPage = React.lazy(() => import('./docs/pages/ExamplesPage'));
const Changelog = React.lazy(() => import('./docs/pages/Changelog'));
const BlocksPage = React.lazy(() => import('./docs/pages/BlocksPage'));
const TemplatesPage = React.lazy(() => import('./docs/pages/TemplatesPage'));
const AppShellPreview = React.lazy(() =>
  import('./docs/ExtendedExamples').then((module) => ({ default: module.AppShellPreview })),
);

function RouteEffects() {
  const location = useLocation();
  React.useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0 });
    else
      requestAnimationFrame(() =>
        document.getElementById(location.hash.slice(1))?.scrollIntoView(),
      );
  }, [location.pathname, location.hash]);
  return null;
}
function Shell() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [themeOpen, setThemeOpen] = React.useState(false);
  const [tokens, updateTokens] = React.useState<ThemeTokens>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('plainui-token-overrides') ?? '{}');
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
      return Object.fromEntries(
        Object.entries(saved).filter(
          ([key, value]) =>
            tokenNames.includes(key as keyof ThemeTokens) &&
            typeof value === 'string' &&
            value.length < 400,
        ),
      );
    } catch {
      return {};
    }
  });
  const setTokens = React.useCallback((next: ThemeTokens) => {
    updateTokens(next);
    try {
      localStorage.setItem('plainui-token-overrides', JSON.stringify(next));
    } catch {
      /* Live overrides still work when persistence is unavailable. */
    }
  }, []);
  const [direction, updateDirection] = React.useState<TextDirection>(() => {
    try {
      return localStorage.getItem('plainui-direction') === 'rtl' ? 'rtl' : 'ltr';
    } catch {
      return 'ltr';
    }
  });
  const setDirection = React.useCallback((value: TextDirection) => {
    updateDirection(value);
    try {
      localStorage.setItem('plainui-direction', value);
    } catch {
      /* Direction still updates when storage is unavailable. */
    }
  }, []);
  const preferences = React.useMemo(
    () => ({ direction, setDirection, tokens, setTokens, customize: () => setThemeOpen(true) }),
    [direction, setDirection, tokens, setTokens],
  );
  return (
    <PlainProvider dir={direction} tokens={tokens}>
      <TooltipProvider delayDuration={350}>
        <AppPreferences.Provider value={preferences}>
          <SiteHeader
            onMenu={() => setMobileOpen(true)}
            onSearch={() => setSearchOpen(true)}
            onCustomize={() => setThemeOpen(true)}
            direction={direction}
            onDirection={() => setDirection(direction === 'ltr' ? 'rtl' : 'ltr')}
          />
          <div className="app-layout">
            <aside className="desktop-sidebar">
              <Sidebar />
            </aside>
            <main id="main-content" className="main-content" tabIndex={-1}>
              <React.Suspense
                fallback={
                  <div className="route-loading">
                    <Spinner label="Loading documentation" />
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<Overview />} />
                  <Route path="/components" element={<ComponentsPage />} />
                  <Route path="/components/:slug" element={<ComponentPage />} />
                  <Route path="/docs/:slug" element={<GuidePage />} />
                  <Route path="/examples" element={<ExamplesPage />} />
                  <Route path="/changelog" element={<Changelog />} />
                  <Route path="/blocks" element={<BlocksPage />} />
                  <Route path="/blocks/:id" element={<BlocksPage />} />
                  <Route path="/templates" element={<TemplatesPage />} />
                  <Route path="/templates/:id" element={<TemplatesPage />} />
                  <Route
                    path="*"
                    element={
                      <div className="not-found">
                        <span>404</span>
                        <h1>A little off the beaten path.</h1>
                        <p>This page could not be found.</p>
                        <Link to="/">Back to PlainUI</Link>
                      </div>
                    }
                  />
                </Routes>
              </React.Suspense>
              <footer className="site-footer">
                <Link to="/" className="footer-brand">
                  <BrandLogo />
                </Link>
                <span>Less noise. More room for ideas.</span>
                <div>
                  <Link to="/docs/installation">Documentation</Link>
                  <a href="/LICENSE" download>
                    MIT License
                    <ArrowUpRight size={12} aria-hidden="true" />
                  </a>
                  <span>2026</span>
                </div>
              </footer>
            </main>
          </div>
          <Sheet side="start" open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="start" className="mobile-sidebar">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription className="sr-only">
                Explore PlainUI documentation and components.
              </SheetDescription>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
          <ThemeEditor open={themeOpen} onOpenChange={setThemeOpen} />
          <Toaster />
          <RouteEffects />
        </AppPreferences.Provider>
      </TooltipProvider>
    </PlainProvider>
  );
}

function SiteHeader({
  onMenu,
  onSearch,
  onCustomize,
  direction,
  onDirection,
}: {
  onMenu: () => void;
  onSearch: () => void;
  onCustomize: () => void;
  direction: TextDirection;
  onDirection: () => void;
}) {
  const theme = useTheme();
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-brand-area">
          <div className="mobile-menu-button">
            <IconButton label="Open navigation" onClick={onMenu}>
              <Menu aria-hidden="true" />
            </IconButton>
          </div>
          <Link to="/" className="brand" aria-label="P.UI home">
            <BrandLogo />
          </Link>
          <VersionSwitcher />
        </div>
        <div className="header-main">
          <nav aria-label="Main navigation" className="header-nav">
            <NavLink to="/" end>
              Overview
            </NavLink>
            <NavLink to="/components">Components</NavLink>
            <NavLink to="/examples">Examples</NavLink>
            <NavLink to="/blocks">Blocks</NavLink>
            <NavLink to="/templates">Templates</NavLink>
            <NavLink to="/changelog">Changelog</NavLink>
          </nav>
          <div className="header-actions">
            <button className="header-search" onClick={onSearch} aria-label="Search documentation">
              <Search size={14} aria-hidden="true" />
              <span>Search documentation...</span>
              <Kbd>Ctrl K</Kbd>
            </button>
            <span className="mobile-search-button">
              <IconButton label="Search documentation" onClick={onSearch}>
                <Search aria-hidden="true" />
              </IconButton>
            </span>
            <span className="header-rule" />
            <IconButton
              label={theme.resolvedMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() =>
                theme.setTheme({ mode: theme.resolvedMode === 'dark' ? 'light' : 'dark' })
              }
            >
              {theme.resolvedMode === 'dark' ? (
                <Sun aria-hidden="true" />
              ) : (
                <Moon aria-hidden="true" />
              )}
            </IconButton>
            <span className="header-direction">
              <IconButton
                label={direction === 'ltr' ? 'Switch to right-to-left' : 'Switch to left-to-right'}
                onClick={onDirection}
              >
                <MoveHorizontal aria-hidden="true" />
              </IconButton>
            </span>
            <IconButton label="Customize theme" onClick={onCustomize}>
              <SlidersHorizontal aria-hidden="true" />
            </IconButton>
            <span className="header-source">
              <IconButton label="Library customization API" asChild>
                <Link to="/docs/customization">
                  <Code2 aria-hidden="true" />
                </Link>
              </IconButton>
            </span>
          </div>
        </div>
      </header>
    </>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/preview/app-shell"
          element={
            <React.Suspense fallback={<Spinner />}>
              <AppShellPreview />
            </React.Suspense>
          }
        />
        <Route path="*" element={<Shell />} />
      </Routes>
    </BrowserRouter>
  );
}
