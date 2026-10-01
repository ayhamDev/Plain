import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { Badge } from '../../ui';
import { components } from '../catalog';

export default function Changelog() {
  React.useEffect(() => {
    document.title = 'Changelog - PlainUI';
  }, []);
  return (
    <article className="guide-page">
      <div className="page-eyebrow">Always considered</div>
      <h1>Changelog</h1>
      <p className="page-lead">Small improvements. A better starting point.</p>
      <section className="release-entry">
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
            `${components.length} documented components with live examples.`,
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
        <Link to="/docs/installation" className="text-link">
          Get the build
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </section>
    </article>
  );
}
