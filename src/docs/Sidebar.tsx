import { NavLink } from 'react-router-dom';
import { BookOpen, Blocks, ArrowUpRight, Sparkles, ChevronDown } from 'lucide-react';
import { components, categories, guideLinks } from './catalog';
import { Collapsible, CollapsibleTrigger, CollapsibleContent, Badge } from '../ui';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="sidebar-inner">
      <nav aria-label="Documentation">
        <div className="sidebar-top">
          <NavLink to="/" end onClick={onNavigate}>
            <BookOpen size={15} aria-hidden="true" />
            Overview
          </NavLink>
          <NavLink to="/components" end onClick={onNavigate}>
            <Blocks size={15} aria-hidden="true" />
            All components<span className="sidebar-count">{components.length}</span>
          </NavLink>
          <NavLink to="/examples" onClick={onNavigate}>
            <Sparkles size={15} aria-hidden="true" />
            Examples<Badge variant="outline">3</Badge>
          </NavLink>
        </div>
        <div className="sidebar-group">
          <h2>Getting started</h2>
          {guideLinks.map((guide) => (
            <NavLink key={guide.slug} to={`/docs/${guide.slug}`} onClick={onNavigate}>
              {guide.title}
            </NavLink>
          ))}
          <NavLink to="/docs/customization" onClick={onNavigate}>
            Customization<Badge variant="accent">New</Badge>
          </NavLink>
          <NavLink to="/docs/rtl" onClick={onNavigate}>
            Right to left
          </NavLink>
        </div>
        <div className="sidebar-component-label">
          <span>Components</span>
          <span>{components.length}</span>
        </div>
        {categories.map((category) => (
          <Collapsible key={category} defaultOpen className="sidebar-group sidebar-category">
            <CollapsibleTrigger className="sidebar-category-toggle">
              <span>{category}</span>
              <ChevronDown size={13} aria-hidden="true" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              {components
                .filter((component) => component.category === category)
                .map((component) => (
                  <NavLink
                    key={component.slug}
                    to={`/components/${component.slug}`}
                    onClick={onNavigate}
                  >
                    {component.name}
                  </NavLink>
                ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span className="sidebar-footer-symbol">p.</span>
        <span>
          A little less.
          <br />A lot more.
        </span>
        <ArrowUpRight size={15} aria-hidden="true" />
      </div>
    </div>
  );
}
