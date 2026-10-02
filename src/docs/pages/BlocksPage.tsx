import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Code2,
  Copy,
  Download,
  FileCode2,
  Monitor,
  PanelsTopLeft,
  RotateCcw,
  Search,
  Smartphone,
  Tablet,
  X,
} from 'lucide-react';
import { Badge, Button, EmptyState, Spinner } from '../../ui/primitives';
import { Input, ToggleGroup, ToggleGroupItem } from '../../ui/forms';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui/overlays';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/navigation';
import { blockRegistry } from '../compositions/registry';
import { blockCategories } from '../compositions/types';
import { downloadText } from '../compositions/helpers';
import { loadCompositionSource } from '../compositions/source';
import {
  compositionImage,
  compositionLabels,
  compositionShape,
  filterCompositions,
  previewWidths,
  type CompositionItem,
  type PreviewWidth,
} from '../compositions';

function Tool({
  label,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" variant="ghost" aria-label={label} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
function MetadataArt({ item }: { item: CompositionItem }) {
  const image = compositionImage(item);
  return (
    <div className="composition-art" data-shape={compositionShape(item)} aria-hidden="true">
      {image ? (
        <img src={image} alt="" loading="lazy" />
      ) : (
        <>
          <span className="composition-art-rail" />
          <div className="composition-art-body">
            <i />
            <div>
              {Array.from(
                {
                  length:
                    'family' in item.config && item.config.family === 'charts'
                      ? Math.min(7, item.config.series.length)
                      : 4,
                },
                (_, index) => (
                  <span
                    key={index}
                    style={
                      {
                        '--art-value': `${[42, 68, 51, 84, 62, 76, 55][index]}%`,
                      } as React.CSSProperties
                    }
                  />
                ),
              )}
            </div>
            <i />
          </div>
        </>
      )}
    </div>
  );
}
function SourceCode({ item, full = false }: { item: CompositionItem; full?: boolean }) {
  const [source, setSource] = React.useState<string>();
  const [failed, setFailed] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);
  React.useEffect(() => {
    let current = true;
    loadCompositionSource(item.sourceURL).then(
      (value) => current && setSource(value),
      () => current && setFailed(true),
    );
    return () => {
      current = false;
    };
  }, [item.sourceURL, attempt]);
  if (failed)
    return (
      <div role="alert">
        <p>Source could not load.</p>
        <Button
          variant="outline"
          onClick={() => {
            setFailed(false);
            setAttempt(attempt + 1);
          }}
        >
          Retry
        </Button>
      </div>
    );
  if (source === undefined) return <Spinner label="Loading source" />;
  return (
    <pre
      className="composition-source"
      tabIndex={0}
      aria-label={`${item.name} ${full ? 'full source' : 'source'}`}
    >
      <code>{source}</code>
    </pre>
  );
}
class PreviewBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <EmptyState
        title="Preview could not load"
        action={
          <Button variant="outline" onClick={() => this.setState({ failed: false })}>
            <RotateCcw aria-hidden="true" />
            Retry
          </Button>
        }
      />
    ) : (
      this.props.children
    );
  }
}
export function CompositionBrowser({
  kind,
  items,
  categories,
}: {
  kind: 'blocks' | 'templates';
  items: readonly CompositionItem[];
  categories: readonly string[];
}) {
  const [params, setParams] = useSearchParams();
  const [sourceId, setSourceId] = React.useState<string | undefined>();
  const [reset, setReset] = React.useState(0);
  const [copied, setCopied] = React.useState('');
  const [feedback, setFeedback] = React.useState('');
  const [sort, setSort] = React.useState('curated');
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sourceTitle = React.useRef<HTMLHeadingElement>(null);
  const sourceReturnFocus = React.useRef<HTMLElement | null>(null);
  const query = params.get('q') ?? '';
  const category = categories.includes(params.get('category') ?? '')
    ? params.get('category')!
    : 'all';
  const width = Object.hasOwn(previewWidths, params.get('width') ?? '')
    ? (params.get('width') as PreviewWidth)
    : kind === 'templates' && category === 'mobile-apps'
      ? 'mobile'
      : 'desktop';
  const tab = params.get('tab') === 'code' ? 'code' : 'preview';
  const filtered = React.useMemo(() => {
    const result = filterCompositions(items, query, category);
    return sort === 'alphabetical' ? result.sort((a, b) => a.name.localeCompare(b.name)) : result;
  }, [items, query, category, sort]);
  const selectedIndex = filtered.findIndex((item) => item.id === params.get('item'));
  const totalPages = Math.max(1, Math.ceil(filtered.length / 12));
  const requestedPage =
    Number(params.get('page')) || (selectedIndex >= 0 ? Math.floor(selectedIndex / 12) + 1 : 1);
  const page = Math.min(totalPages, Math.max(1, Math.floor(requestedPage)));
  const pageItems = filtered.slice((page - 1) * 12, page * 12);
  const selected = filtered[selectedIndex] ?? pageItems[0];
  const sourceItem = items.find((item) => item.id === sourceId);
  const title = kind === 'blocks' ? 'Blocks' : 'Templates';
  React.useEffect(() => {
    document.title = `${title} - P.UI`;
    return () => clearTimeout(timer.current);
  }, [title]);
  const update = (changes: Record<string, string | undefined>, replace = false) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, value);
    }
    setParams(next, { replace });
    setFeedback('');
  };
  const select = (item: CompositionItem) => {
    update({ item: item.id });
    setReset(0);
  };
  const openSource = (item: CompositionItem, trigger?: HTMLElement) => {
    if (!sourceId)
      sourceReturnFocus.current =
        trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setSourceId(item.id);
  };
  const copySource = async (item: CompositionItem) => {
    try {
      await navigator.clipboard.writeText(await loadCompositionSource(item.sourceURL));
      setCopied(item.id);
      setFeedback(`${item.name} source copied`);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(''), 1800);
    } catch {
      openSource(item);
      setFeedback('Clipboard unavailable');
    }
  };
  const downloadSource = async (item: CompositionItem) => {
    try {
      downloadText(
        `${item.id}.tsx`,
        await loadCompositionSource(item.sourceURL),
        'text/plain;charset=utf-8',
      );
      setFeedback(`${item.id}.tsx downloaded`);
    } catch {
      openSource(item);
      setFeedback('Download unavailable');
    }
  };
  const sourceTools = (item: CompositionItem) => (
    <>
      <Tool
        label={copied === item.id ? 'Source copied' : 'Copy source'}
        onClick={() => void copySource(item)}
      >
        {copied === item.id ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      </Tool>
      <Tool label="Download source" onClick={() => void downloadSource(item)}>
        <Download aria-hidden="true" />
      </Tool>
    </>
  );
  const movePage = (next: number) =>
    update({ page: String(next), item: filtered[(next - 1) * 12]?.id });
  const Preview = selected?.component;
  return (
    <TooltipProvider delayDuration={250}>
      <div className="composition-page" data-kind={kind}>
        <header className="composition-page-heading">
          <div>
            <span className="composition-eyebrow">@plain/ui</span>
            <h1>
              {title}
              <Badge variant="outline">{items.length}</Badge>
            </h1>
          </div>
          <Badge variant="outline">0.2</Badge>
        </header>
        <div className="composition-filters">
          <div className="composition-search">
            <Search size={17} aria-hidden="true" />
            <Input
              aria-label={`Search ${kind}`}
              placeholder={`Search ${kind}...`}
              value={query}
              onChange={(event) =>
                update({ q: event.target.value, page: undefined, item: undefined }, true)
              }
            />
            {query && (
              <Tool
                label="Clear search"
                onClick={() => update({ q: undefined, page: undefined, item: undefined }, true)}
              >
                <X aria-hidden="true" />
              </Tool>
            )}
          </div>
          <select
            className="composition-select"
            aria-label={`${title} category`}
            value={category}
            onChange={(event) =>
              update({
                category: event.target.value === 'all' ? undefined : event.target.value,
                page: undefined,
                item: undefined,
                width: event.target.value === 'mobile-apps' ? 'mobile' : undefined,
              })
            }
          >
            <option value="all">All categories</option>
            {categories.map((value) => (
              <option value={value} key={value}>
                {compositionLabels[value]} ({items.filter((item) => item.category === value).length}
                )
              </option>
            ))}
          </select>
          <select
            className="composition-select composition-sort"
            aria-label={`Sort ${kind}`}
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              update({ page: undefined, item: undefined });
            }}
          >
            <option value="curated">Curated order</option>
            <option value="alphabetical">Name A-Z</option>
          </select>
        </div>
        <nav className="composition-categories" aria-label={`${title} categories`}>
          <button
            type="button"
            aria-pressed={category === 'all'}
            onClick={() => update({ category: undefined, page: undefined, item: undefined })}
          >
            All <span>{items.length}</span>
          </button>
          {categories.map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={category === value}
              onClick={() =>
                update({
                  category: value,
                  page: undefined,
                  item: undefined,
                  width: value === 'mobile-apps' ? 'mobile' : undefined,
                })
              }
            >
              {compositionLabels[value]}
              <span>{items.filter((item) => item.category === value).length}</span>
            </button>
          ))}
        </nav>
        {selected && Preview ? (
          <section
            className="composition-detail"
            aria-label={`Selected ${kind === 'blocks' ? 'block' : 'template'}: ${selected.name}`}
          >
            <header className="composition-detail-heading">
              <div>
                <div className="composition-detail-context">
                  <Badge variant="outline">{compositionLabels[selected.category]}</Badge>
                  <span>{selected.id}</span>
                </div>
                <h2>{selected.name}</h2>
                <p>{selected.description}</p>
                <div className="composition-tags">
                  {selected.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
              <div className="composition-source-actions">
                <Tool
                  label="Open source"
                  onClick={(event) => openSource(selected, event.currentTarget)}
                >
                  <FileCode2 aria-hidden="true" />
                </Tool>
                {sourceTools(selected)}
              </div>
            </header>
            <Tabs
              value={tab}
              onValueChange={(value) =>
                update({ tab: value === 'preview' ? undefined : value }, true)
              }
            >
              <div className="composition-preview-toolbar">
                <TabsList variant="underline" aria-label="Composition view">
                  <TabsTrigger value="preview">
                    <PanelsTopLeft aria-hidden="true" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="code">
                    <Code2 aria-hidden="true" />
                    Code
                  </TabsTrigger>
                </TabsList>
                <div className="composition-preview-controls">
                  <ToggleGroup
                    type="single"
                    value={width}
                    onValueChange={(value) => value && update({ width: value }, true)}
                    aria-label="Preview width"
                  >
                    {(['desktop', 'tablet', 'mobile'] as const).map((value) => {
                      const Icon =
                        value === 'desktop' ? Monitor : value === 'tablet' ? Tablet : Smartphone;
                      return (
                        <ToggleGroupItem
                          value={value}
                          key={value}
                          aria-label={`${value[0].toUpperCase()}${value.slice(1)} preview`}
                          title={`${value} · ${previewWidths[value]}px`}
                        >
                          <Icon aria-hidden="true" />
                        </ToggleGroupItem>
                      );
                    })}
                  </ToggleGroup>
                  <span className="composition-preview-size">{previewWidths[width]}px</span>
                  <Tool
                    label="Reset preview"
                    onClick={() => {
                      setReset(reset + 1);
                      setFeedback('Preview reset');
                    }}
                  >
                    <RotateCcw aria-hidden="true" />
                  </Tool>
                </div>
              </div>
              <TabsContent value="preview" className="composition-preview-content">
                <div className="composition-preview-viewport">
                  <div className="composition-preview-stage">
                    <div
                      className="composition-preview"
                      data-width={width}
                      style={
                        {
                          '--composition-width': `${previewWidths[width]}px`,
                        } as React.CSSProperties
                      }
                    >
                      <PreviewBoundary key={`${selected.id}-${reset}`}>
                        <React.Suspense
                          fallback={
                            <div className="composition-loading">
                              <Spinner label="Loading preview" />
                            </div>
                          }
                        >
                          <Preview key={`${selected.id}-${reset}`} />
                        </React.Suspense>
                      </PreviewBoundary>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="code" className="composition-code-content">
                <div className="composition-code-heading">
                  <FileCode2 size={15} aria-hidden="true" />
                  <span>{selected.id}.tsx</span>
                  <div>{sourceTools(selected)}</div>
                </div>
                <SourceCode key={selected.id} item={selected} />
              </TabsContent>
            </Tabs>
          </section>
        ) : (
          <EmptyState
            title={`No ${kind} found`}
            action={
              <Button
                variant="outline"
                onClick={() =>
                  update({ q: undefined, category: undefined, item: undefined, page: undefined })
                }
              >
                <X aria-hidden="true" />
                Clear filters
              </Button>
            }
          />
        )}
        <p className="composition-feedback" role="status" aria-live="polite">
          {feedback}
        </p>
        <div className="composition-results-heading">
          <h2>{category === 'all' ? `All ${kind}` : compositionLabels[category]}</h2>
          <span>
            {filtered.length} results
            {filtered.length > 12
              ? ` · ${(page - 1) * 12 + 1}-${Math.min(page * 12, filtered.length)}`
              : ''}
          </span>
        </div>
        <div className="composition-gallery" aria-label={`${title} results`}>
          {pageItems.map((item) => (
            <article
              className="composition-item"
              key={item.id}
              data-selected={selected?.id === item.id}
            >
              <button
                type="button"
                className="composition-item-select"
                aria-pressed={selected?.id === item.id}
                aria-label={`Preview ${item.name}`}
                onClick={() => select(item)}
              >
                <MetadataArt item={item} />
                <div className="composition-item-info">
                  <span>{compositionLabels[item.category]}</span>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                </div>
              </button>
              <footer>
                <span>
                  {'family' in item.config
                    ? item.config.variant
                    : `${item.config.routes.length} screens · ${item.config.layout}`}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  title={`Open ${item.name} source`}
                  aria-label={`Open ${item.name} source`}
                  onClick={(event) => openSource(item, event.currentTarget)}
                >
                  <FileCode2 aria-hidden="true" />
                </Button>
              </footer>
            </article>
          ))}
        </div>
        {filtered.length > 12 && (
          <nav className="composition-pagination" aria-label={`${title} result pages`}>
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => movePage(page - 1)}
            >
              <ArrowLeft aria-hidden="true" />
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => movePage(page + 1)}
            >
              Next
              <ArrowRight aria-hidden="true" />
            </Button>
          </nav>
        )}
        <Dialog open={!!sourceItem} onOpenChange={(open) => !open && setSourceId(undefined)}>
          <DialogContent
            className="composition-source-dialog"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              sourceTitle.current?.focus();
            }}
            onCloseAutoFocus={(event) => {
              if (sourceReturnFocus.current?.isConnected) {
                event.preventDefault();
                sourceReturnFocus.current.focus();
              }
            }}
          >
            <DialogTitle ref={sourceTitle} tabIndex={-1}>
              {sourceItem?.name}
            </DialogTitle>
            <DialogDescription>{sourceItem?.id}.tsx</DialogDescription>
            {sourceItem && (
              <>
                <div className="composition-code-heading">
                  <span>{sourceItem.id}.tsx</span>
                  <div>{sourceTools(sourceItem)}</div>
                </div>
                <SourceCode key={sourceItem.id} item={sourceItem} full />
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
export default function BlocksPage() {
  return <CompositionBrowser kind="blocks" items={blockRegistry} categories={blockCategories} />;
}
