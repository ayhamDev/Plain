import * as React from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowUpRight, X, Box } from 'lucide-react';
import { Input, Badge, ToggleGroup, ToggleGroupItem, EmptyState, Button } from '../../ui';
import { components, categories, type Category } from '../catalog';
import { ComponentExample } from '../demos';

export default function ComponentsPage() {
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState<Category | 'All'>('All');
  const matching = components.filter(
    (component) =>
      (category === 'All' || component.category === category) &&
      `${component.name} ${component.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  React.useEffect(() => {
    document.title = 'Components - PlainUI';
  }, []);
  return (
    <div className="components-page">
      <div className="page-eyebrow">
        The collection<Badge variant="outline">{components.length} components</Badge>
      </div>
      <h1>
        Small pieces.
        <br />
        <span className="muted-heading">Made to work together.</span>
      </h1>
      <p className="page-lead">Everything you need to turn a small idea into something real.</p>
      <div className="catalog-controls">
        <ToggleGroup
          type="single"
          value={category}
          onValueChange={(value) => value && setCategory(value as Category | 'All')}
          aria-label="Component category"
          className="catalog-categories"
        >
          {['All', ...categories].map((name) => (
            <ToggleGroupItem key={name} value={name} size="sm">
              {name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="catalog-search">
          <Search size={15} aria-hidden="true" />
          <Input
            placeholder="Find a component..."
            aria-label="Find a component"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuery('')}
              aria-label="Clear component search"
            >
              <X size={14} aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
      <div className="catalog-result-label" role="status">
        {matching.length} component{matching.length !== 1 ? 's' : ''}
        {category !== 'All' && ` in ${category.toLowerCase()}`}
      </div>
      {matching.length ? (
        <div className="component-catalog">
          {matching.map((component) => (
            <div className="component-tile" key={component.slug}>
              <div className="component-thumbnail" aria-hidden="true" inert>
                <div className="mini-preview">
                  <ComponentExample slug={component.slug} />
                </div>
              </div>
              <div className="component-tile-title">
                <h2>
                  <Link className="component-tile-link" to={`/components/${component.slug}`}>
                    {component.name}
                  </Link>
                </h2>
                <ArrowUpRight size={15} aria-hidden="true" />
              </div>
              <p>{component.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Box aria-hidden="true" />}
          title="Nothing here just yet"
          description="Try another name or explore the whole collection."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery('');
                setCategory('All');
              }}
            >
              Clear filters
            </Button>
          }
        />
      )}
    </div>
  );
}
