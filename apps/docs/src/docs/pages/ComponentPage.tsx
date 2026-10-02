import * as React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Code2, ExternalLink, ShieldCheck, Check } from 'lucide-react';
import {
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  styleSlots,
} from '@plain/ui';
import { components, getComponent, componentCode } from '../catalog';
import { CodeBlock } from '../shared';
import { ComponentExample } from '../demos';
import { PropPlayground, propPreviews } from '../previews';

export default function ComponentPage() {
  const { slug = '' } = useParams();
  const component = getComponent(slug);
  React.useEffect(() => {
    document.title = `${component?.name ?? 'Not found'} - PlainUI`;
  }, [component]);
  if (slug === 'split-pane') return <Navigate to="/components/resizable" replace />;
  if (!component)
    return (
      <div className="not-found">
        <h1>Component not found</h1>
        <Link to="/components">Explore all components</Link>
      </div>
    );
  const index = components.indexOf(component);
  const prev = components[index - 1];
  const next = components[index + 1];
  const family = slug === 'field' ? 'field' : slug;
  const slots = styleSlots.filter((slot) => slot.startsWith(`${family}.`));
  const styledPart =
    (
      {
        field: 'Field',
        kbd: 'Kbd',
        select: 'SelectTrigger',
        accordion: 'AccordionItem',
        dialog: 'DialogContent',
        'alert-dialog': 'AlertDialogContent',
        sheet: 'SheetContent',
        drawer: 'DrawerContent',
        popover: 'PopoverContent',
        tooltip: 'TooltipContent',
        'dropdown-menu': 'DropdownMenuContent',
        toast: 'Toaster',
        collapsible: 'CollapsibleTrigger',
      } as Record<string, string>
    )[slug] ??
    component.name
      .split(' ')
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join('');
  const primarySlot = slots.find((slot) => /\.(root|content|trigger)$/.test(slot)) ?? slots[0];
  return (
    <div className="documentation-layout">
      <article className="documentation-page" key={slug}>
        <div className="doc-breadcrumb">
          <Link to="/components">Components</Link>
          <span>/</span>
          <span>{component.category}</span>
        </div>
        <div className="doc-title-row">
          <h1>{component.name}</h1>
          <Badge variant="outline">
            <Check size={11} aria-hidden="true" />
            Ready to compose
          </Badge>
        </div>
        <p className="doc-lead">{component.description}</p>
        <div className="doc-meta">
          <span>React & TypeScript</span>
          <span>Light & dark</span>
          <Link to="/docs/rtl">
            RTL supported
            <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </div>
        <section id="preview">
          {propPreviews[slug] ? (
            <PropPlayground
              key={slug}
              slug={slug}
              code={componentCode(component)}
              title={`${component.name.replaceAll(' ', '')}.tsx`}
            >
              <ComponentExample slug={slug} />
            </PropPlayground>
          ) : (
            <Tabs defaultValue="preview">
              <div className="example-toolbar">
                <TabsList variant="underline" aria-label="Example view">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="code">
                    <Code2 aria-hidden="true" />
                    Code
                  </TabsTrigger>
                </TabsList>
                <Link to="/docs/customization" className="quiet-link">
                  Customize
                  <ExternalLink size={13} aria-hidden="true" />
                </Link>
              </div>
              <TabsContent value="preview" className="component-preview">
                <ComponentExample slug={slug} />
              </TabsContent>
              <TabsContent value="code">
                <CodeBlock
                  code={componentCode(component)}
                  title={`${component.name.replaceAll(' ', '')}.tsx`}
                />
              </TabsContent>
            </Tabs>
          )}
        </section>
        <section id="usage" className="doc-section">
          <h2>Usage</h2>
          <CodeBlock
            code={`import { ${component.imports.join(', ')} } from '${component.entry ?? '@plain/ui'}';${component.stylesheet ? `\nimport '${component.stylesheet}';` : ''}`}
            compact
          />
          {component.usage && <p>{component.usage}</p>}
          <CodeBlock code={component.code} title="Example" />
        </section>
        <section id="api" className="doc-section">
          <h2>API reference</h2>
          <p>
            Common properties are listed below. Native element props and the underlying primitive's
            props pass through.
          </p>
          <div className="api-table">
            <Table aria-label={`${component.name} properties`}>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Type / default</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {component.props.map((prop) => (
                  <TableRow key={prop.name}>
                    <TableCell>
                      <code>{prop.name}</code>
                    </TableCell>
                    <TableCell>
                      <code className="prop-type">{prop.type}</code>
                      {prop.defaultValue && (
                        <span className="prop-default">{prop.defaultValue}</span>
                      )}
                    </TableCell>
                    <TableCell>{prop.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
        <section id="styling" className="doc-section">
          <h2>Make it yours</h2>
          <p>
            Use <code>className</code> and <code>style</code> just as you would on a native element.
            Use <code>unstyled</code> to remove PlainUI's classes from a styled part, or configure
            named parts through <code>PlainProvider</code>.
          </p>
          <CodeBlock
            compact
            code={
              primarySlot
                ? `// On a styled part, alongside its other props\n<${styledPart} {...props} className="rounded-xl" />\n\n// Or style every instance of a named part\n<PlainProvider styles={{\n  '${primarySlot}': 'rounded-xl',\n}}>\n  <App />\n</PlainProvider>`
                : `<${styledPart} {...props} className="my-component" />`
            }
          />
          {slots.length > 0 && (
            <details className="slot-details">
              <summary>
                Styling slots <Badge variant="outline">{slots.length}</Badge>
              </summary>
              <div className="slot-list">
                {slots.map((slot) => (
                  <code key={slot}>{slot}</code>
                ))}
              </div>
              <p>
                Each part exposes <code>data-ui</code> and <code>data-slot</code> attributes for
                plain CSS selectors.
              </p>
            </details>
          )}
          <Link to="/docs/customization" className="text-link">
            Explore the customization API
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </section>
        <section id="accessibility" className="doc-section">
          <h2>
            <ShieldCheck size={19} aria-hidden="true" />
            Accessibility
          </h2>
          <p>{component.accessibility}</p>
          <Link to="/docs/accessibility" className="text-link">
            Accessibility guidelines
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </section>
        <div className="doc-pagination">
          {prev ? (
            <Link to={`/components/${prev.slug}`}>
              <ArrowLeft size={16} aria-hidden="true" />
              <div>
                <span>Previous</span>
                <strong>{prev.name}</strong>
              </div>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link to={`/components/${next.slug}`}>
              <div>
                <span>Next</span>
                <strong>{next.name}</strong>
              </div>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </div>
      </article>
      <aside className="on-this-page">
        <span>On this page</span>
        {[
          ['preview', 'Preview'],
          ['usage', 'Usage'],
          ['api', 'API reference'],
          ['styling', 'Customization'],
          ['accessibility', 'Accessibility'],
        ].map(([id, title]) => (
          <a key={id} href={`#${id}`}>
            {title}
          </a>
        ))}
        <div className="doc-side-note">
          A good foundation.
          <br />
          Your own expression.
        </div>
      </aside>
    </div>
  );
}
