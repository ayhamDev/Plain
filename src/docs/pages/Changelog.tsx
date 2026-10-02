import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { Badge } from '../../ui';
import { components } from '../catalog';

export default function Changelog() {
  React.useEffect(() => {
    document.title = 'Changelog - P.UI';
  }, []);
  return (
    <article className="guide-page">
      <div className="page-eyebrow">Always considered</div>
      <h1>Changelog</h1>
      <p className="page-lead">Small improvements. A better starting point.</p>
      <section className="release-entry" id="unreleased">
        <div className="release-meta">
          <Badge variant="outline">Unreleased</Badge>
          <span>Working checkout</span>
        </div>
        <h2>Documentation that follows your release</h2>
        <p>
          Complete documentation snapshots replace changelog-only version switching. Live prop
          playgrounds include Select positioning, chart configuration and layout/calendar states.
          Chart tooltip values now use paired surface colors; dialogs have gentler entry and exit
          timing, with reduced-motion support.
        </p>
        <Link to="/docs/versions" className="text-link">
          Documentation versions
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </section>
      <section className="release-entry" id="release-0-2">
        <div className="release-meta">
          <Badge variant="solid">v0.2.0</Badge>
          <span>October 1, 2026</span>
          <Badge variant="outline">Local release</Badge>
        </div>
        <h2>A foundation that grows with you</h2>
        <p>
          The package is now <code>@plain/ui</code>. Neutral by default, with layered theming and
          optional tools for larger applications.
        </p>
        <ul className="release-list">
          {[
            `${components.length} documented component families with live examples and typed APIs.`,
            'Original neutral defaults, opt-in seed-generated palettes and independent component overrides.',
            'Semantic typography: H1-H6, P, A, code, quotes and lists with native props and refs.',
            'Border, density, radius, contrast and motion policies; reusable component extensions.',
            'Vaul sheets and drawers, centered dialog transitions and inverse notifications.',
            'Range and date-time controls, full scheduling, responsive sidebars and virtualized layouts.',
            'Optional Recharts visualizations with keyboard navigation and data tables.',
            '120 copy/paste blocks and 60 copy/paste templates, with their own code and styles.',
            'A repository design skill for agents and Changesets for future releases.',
          ].map((item) => (
            <li key={item}>
              <Check size={15} aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
        <p>
          This package is available locally. Registry publication, hosting, application security and
          domain-specific backend integrations are separate release steps.
        </p>
        <Link to="/docs/installation" className="text-link">
          Get the build
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </section>
      <section className="release-entry" id="release-0-1">
        <div className="release-meta">
          <Badge variant="solid">v0.1.0</Badge>
          <span>October 1, 2026</span>
          <Badge variant="outline">Initial local release</Badge>
        </div>
        <h2>A plain beginning</h2>
        <p>
          The first version of PlainUI brings the essentials together in a neutral, composable React
          design system.
        </p>
        <ul className="release-list">
          {[
            '44 documented components with live examples.',
            'React and TypeScript with modular ESM exports and typed declarations.',
            'Tailwind CSS v4, static styles, and an opt-in stylesheet.',
            'Light, dark, and system themes with adjustable radius and density.',
            'Native props, named styling slots, scoped tokens, and unstyled mode.',
            'Direction-aware controls and logical layout for right-to-left interfaces.',
            'Dashboard, settings, and authentication examples.',
          ].map((item) => (
            <li key={item}>
              <Check size={15} aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
        <p>
          This build is available as a local package. Registry publication and hosted deployment are
          separate release steps.
        </p>
        <a href="/v/0.1.0/docs/installation" className="text-link">
          Original 0.1 documentation
          <ArrowRight size={14} aria-hidden="true" />
        </a>
      </section>
    </article>
  );
}
