import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  SlidersHorizontal,
  Atom,
  FileCode2,
  Wind,
  Accessibility,
  Feather,
  MoveHorizontal,
  Braces,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Button, Badge } from '../../ui';
import { useAppPreferences } from '../preferences';
import { CopyButton } from '../shared';
import { components } from '../catalog';
import {
  LoginDemo,
  ProjectDemo,
  TeamDemo,
  ButtonsDemo,
  PreferencesDemo,
  CalendarDemo,
  BillingDemo,
  SmallFeedbackDemo,
} from '../showcase';

export default function Overview() {
  const { customize } = useAppPreferences();
  useEffect(() => {
    document.title = 'PlainUI - A little less. A lot more.';
  }, []);
  return (
    <div className="overview-page">
      <section className="overview-hero">
        <div className="hero-eyebrow">
          <span className="eyebrow-line" />A considered starting point
          <Badge variant="outline">v0.1.0</Badge>
        </div>
        <h1>
          PlainUI<span>.</span>
        </h1>
        <p className="hero-description">
          A little less UI. <br />A lot more possibility.
        </p>
        <p className="hero-support">
          Thoughtfully minimal components for your next idea. <br className="desktop-break" />
          Beautiful out of the box. Ready to become your own.
        </p>
        <div className="hero-actions">
          <Button asChild>
            <Link to="/docs/installation">
              Start building
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/components">
              Explore components
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="hero-stack">
          <span>
            <Atom aria-hidden="true" />
            React
          </span>
          <span>
            <FileCode2 aria-hidden="true" />
            TypeScript
          </span>
          <span>
            <Wind aria-hidden="true" />
            Tailwind CSS v4
          </span>
          <span className="hero-license">
            MIT licensed
            <ExternalLink size={12} aria-hidden="true" />
          </span>
        </div>
        <div className="hero-code">
          <code>
            import {'{ Button }'} from <span>'@plainui/react'</span>
          </code>
          <CopyButton text="import { Button } from '@plainui/react';" label="Copy import" />
        </div>
      </section>
      <section className="showcase-section" aria-label="Live component examples">
        <div className="showcase-toolbar">
          <div className="showcase-heading">
            <span className="showcase-status" />
            <h2>Small pieces. Endless possibilities.</h2>
          </div>
          <button className="customize-link" onClick={customize}>
            <SlidersHorizontal size={14} aria-hidden="true" />
            Customize
          </button>
        </div>
        <div className="showcase-grid">
          <div className="showcase-column">
            <div className="showcase-item">
              <LoginDemo />
              <div className="specimen-caption">
                <span>Authentication</span>
                <Link to="/examples?view=authentication" aria-label="View authentication example">
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="showcase-item">
              <ProjectDemo />
              <div className="specimen-caption">
                <span>Card & progress</span>
                <Link to="/components/card" aria-label="View card documentation">
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
          <div className="showcase-column">
            <div className="showcase-item">
              <ButtonsDemo />
              <div className="specimen-caption">
                <span>Buttons & actions</span>
                <Link to="/components/button" aria-label="View button documentation">
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="showcase-item">
              <PreferencesDemo />
              <div className="specimen-caption">
                <span>Switches & preferences</span>
                <Link to="/components/switch" aria-label="View switch documentation">
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="showcase-item">
              <SmallFeedbackDemo />
              <div className="specimen-caption">
                <span>Feedback & status</span>
                <Link to="/components/badge" aria-label="View badge documentation">
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="showcase-item">
              <BillingDemo />
              <div className="specimen-caption">
                <span>Tabs & pricing</span>
                <Link to="/components/tabs" aria-label="View tabs documentation">
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
          <div className="showcase-column">
            <div className="showcase-item">
              <TeamDemo />
              <div className="specimen-caption">
                <span>Avatars & collaboration</span>
                <Link to="/components/avatar" aria-label="View avatar documentation">
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="showcase-item">
              <CalendarDemo />
              <div className="specimen-caption">
                <span>Calendar & date selection</span>
                <Link to="/components/calendar" aria-label="View calendar documentation">
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="principles-section">
        <div className="principles-intro">
          <span className="section-eyebrow">Less, but considered</span>
          <h2>
            A foundation.
            <br />
            Not a fingerprint.
          </h2>
          <p>Start plain. Add your personality as your product grows.</p>
        </div>
        <div className="principle-list">
          {[
            {
              icon: Accessibility,
              title: 'Considered interactions',
              copy: 'Keyboard navigation, focus management, and semantic markup.',
            },
            {
              icon: Feather,
              title: 'Only what you use',
              copy: 'Modular ESM exports, static CSS, and no styling runtime.',
            },
            {
              icon: Braces,
              title: 'Your design, your rules',
              copy: 'Native props, shared tokens, named slots, and unstyled mode.',
            },
            {
              icon: MoveHorizontal,
              title: 'Every direction',
              copy: 'Logical spacing and direction-aware primitives for RTL layouts.',
            },
          ].map(({ icon: Icon, title, copy }) => (
            <div className="principle" key={title}>
              <Icon size={20} aria-hidden="true" />
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
              <Check size={14} aria-hidden="true" />
            </div>
          ))}
        </div>
      </section>
      <section className="closing-section">
        <div>
          <span className="section-eyebrow">Your next idea starts here</span>
          <h2>
            Make something.
            <br />
            Make it yours.
          </h2>
        </div>
        <div>
          <p>
            {components.length} components. One consistent foundation.
            <br />
            From a first sketch to the thing you ship.
          </p>
          <Button asChild>
            <Link to="/docs/installation">
              Get started
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
