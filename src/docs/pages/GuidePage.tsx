import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  MoveHorizontal,
  Accessibility,
  Blocks,
  Paintbrush,
  Package,
  ArrowUpRight,
} from 'lucide-react';
import {
  Alert,
  AlertTitle,
  AlertDescription,
  Badge,
  Button,
  Field,
  Input,
  ThemeScope,
  Switch,
  Label,
  DirectionProvider,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../../ui';
import { components } from '../catalog';
import { CodeBlock, PackageDownload } from '../shared';
import { useAppPreferences } from '../preferences';

const guideInfo: Record<string, { title: string; description: string }> = {
  introduction: {
    title: 'A considered beginning.',
    description:
      'PlainUI is a neutral foundation for prototypes, MVPs, and the products they become.',
  },
  installation: {
    title: 'Your next idea starts here.',
    description:
      'Add PlainUI to your React app. One stylesheet, a few imports, and room to create.',
  },
  theming: {
    title: 'One foundation. Your feeling.',
    description:
      'Control color, corners, density, and appearance through a small set of shared tokens.',
  },
  tokens: {
    title: 'The small things add up.',
    description:
      'A coherent set of colors, typography, spacing, and motion connects every component.',
  },
  accessibility: {
    title: 'Consider everyone.',
    description:
      'Accessible primitives are a starting point. Your content and composition complete the experience.',
  },
  customization: {
    title: 'Plain, until it is yours.',
    description:
      'Start with a finished default. Shape every part as your product finds its identity.',
  },
  rtl: {
    title: 'Every direction.',
    description:
      'Direction-aware behavior and logical layout for interfaces that read from right to left.',
  },
  performance: {
    title: 'Only what you need.',
    description:
      'Static CSS, modular exports, and careful composition keep your application focused.',
  },
};
const themesCode = `import { PlainProvider } from '@plainui/react';\nimport '@plainui/react/styles.css';\n\nexport function Root() {\n  return (\n    <PlainProvider\n      theme={{ mode: 'system', accent: 'neutral', radius: 6 }}\n      dir="ltr"\n    >\n      <App />\n    </PlainProvider>\n  );\n}`;

function Introduction() {
  return (
    <>
      <section className="doc-section">
        <h2>From first idea to your own identity</h2>
        <p>
          PlainUI brings {components.length} common components together with a quiet default
          appearance. Start with a prototype that already feels complete. Keep the same components
          when you add your brand, your layouts, and your product's behavior.
        </p>
        <div className="guide-feature-grid">
          {[
            {
              icon: Blocks,
              title: 'Compose',
              copy: 'Small, predictable parts instead of rigid templates.',
            },
            {
              icon: Paintbrush,
              title: 'Customize',
              copy: 'Native props, tokens, named slots, and unstyled parts.',
            },
            {
              icon: Accessibility,
              title: 'Include',
              copy: 'Focus management and keyboard behavior built on Radix.',
            },
            {
              icon: MoveHorizontal,
              title: 'Adapt',
              copy: 'Responsive layouts and right-to-left interaction.',
            },
          ].map(({ icon: Icon, title, copy }) => (
            <div key={title}>
              <Icon size={20} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="doc-section">
        <h2>A familiar way to build</h2>
        <CodeBlock
          code={`import { Button, Field, Input } from '@plainui/react';\n\nexport function NewProject() {\n  return (\n    <form onSubmit={handleCreate}>\n      <Field label="Project name">\n        <Input name="name" required />\n      </Field>\n      <Button type="submit">Create project</Button>\n    </form>\n  );\n}`}
        />
        <p>
          Components forward native props and refs. Form controls work with native HTML validation
          and form libraries. Interactive parts support controlled and uncontrolled state.
        </p>
      </section>
      <section className="doc-section">
        <h2>Choose your starting point</h2>
        <div className="guide-link-list">
          <Link to="/docs/installation">
            <Package size={18} aria-hidden="true" />
            <div>
              <strong>Install the library</strong>
              <span>Add the local build to your React project.</span>
            </div>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <Link to="/components">
            <Blocks size={18} aria-hidden="true" />
            <div>
              <strong>Explore the collection</strong>
              <span>Live examples and API references for every component.</span>
            </div>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <Link to="/examples">
            <Paintbrush size={18} aria-hidden="true" />
            <div>
              <strong>Bring the pieces together</strong>
              <span>Dashboard, settings, and authentication examples.</span>
            </div>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <Alert>
        <AlertTitle>Made for the web</AlertTitle>
        <AlertDescription>
          PlainUI targets React DOM, including responsive mobile web apps and PWAs. It does not
          provide React Native components.
        </AlertDescription>
      </Alert>
    </>
  );
}
function Installation() {
  return (
    <>
      <section className="doc-section">
        <h2>1. Get this build</h2>
        <p>
          This version is available as a local package. Download the archive, then install it in
          your React project.
        </p>
        <PackageDownload />
        <CodeBlock language="sh" code="npm install ./plainui-react-0.1.0.tgz" />
        <p>
          React and React DOM are peer dependencies. The library supports React 18.3 and 19. Use
          Node 22.12 or newer for the local build tools.
        </p>
        <Alert>
          <AlertTitle>Registry publication</AlertTitle>
          <AlertDescription>
            The @plainui/react name is used by this local package. This project has not been
            published to npm by this setup.
          </AlertDescription>
        </Alert>
      </section>
      <section className="doc-section">
        <h2>2. Add the stylesheet and provider</h2>
        <p>
          Import the stylesheet once at your application entry point. PlainProvider connects theme
          preferences, styling slots, and direction without adding a layout wrapper.
        </p>
        <CodeBlock code={themesCode} title="Root.tsx" />
        <p>
          The provider defaults to a neutral accent, system appearance, a 6px radius, and 40px
          controls. Set <code>persist={'{false}'}</code> to keep preferences within the current
          session.
        </p>
      </section>
      <section className="doc-section">
        <h2>3. Start composing</h2>
        <CodeBlock
          code={`import { Button, Card, CardHeader, CardTitle, CardContent } from '@plainui/react';\n\nexport function FirstProject() {\n  return (\n    <Card>\n      <CardHeader><CardTitle>Your next idea</CardTitle></CardHeader>\n      <CardContent>\n        <Button onClick={() => console.log('Start')}>Create project</Button>\n      </CardContent>\n    </Card>\n  );\n}`}
        />
      </section>
      <section className="doc-section">
        <h2>Using Tailwind CSS v4</h2>
        <p>
          The provided CSS is precompiled, so a consuming application does not need Tailwind to
          render the defaults. When your app uses Tailwind, its normal source scan picks up your
          custom classes.
        </p>
        <CodeBlock
          language="css"
          code={`@import 'tailwindcss';\n\n/* Needed only if you compile the library source yourself */\n@source '../node_modules/@plainui/react/dist';`}
        />
        <p>
          CSS is opt-in. For a fully unstyled application, omit the stylesheet and supply your own
          CSS. You can import <code>@plainui/react/tokens.css</code> independently.
        </p>
      </section>
      <section className="doc-section">
        <h2>Building from this workspace</h2>
        <CodeBlock language="sh" code={`npm install\nnpm run dev\nnpm run build\nnpm pack`} />
        <p>
          The library is built into <code>dist/</code>. The documentation site is built into{' '}
          <code>site-dist/</code>. The package includes ESM modules, type declarations, source maps,
          and CSS.
        </p>
        <p>
          In Next.js App Router, import the stylesheet in your root layout and place PlainProvider
          in a client component. Include initial <code>dir</code> and theme attributes on the
          server-rendered HTML to avoid a direction or appearance flash.
        </p>
      </section>
    </>
  );
}
function Theming() {
  const { customize } = useAppPreferences();
  return (
    <>
      <section className="doc-section">
        <h2>Small choices, everywhere</h2>
        <p>
          Use the live theme editor to explore the defaults. The same settings apply to every
          component, including portaled menus and dialogs.
        </p>
        <Button variant="outline" onClick={customize}>
          <Paintbrush aria-hidden="true" />
          Open theme editor
        </Button>
        <CodeBlock code={themesCode} />
      </section>
      <section className="doc-section">
        <h2>Change themes in your app</h2>
        <CodeBlock
          code={`import { Button, useTheme } from '@plainui/react';\n\nexport function ThemeToggle() {\n  const { resolvedMode, setTheme } = useTheme();\n  return (\n    <Button onClick={() => setTheme({\n      mode: resolvedMode === 'dark' ? 'light' : 'dark',\n    })}>\n      Change appearance\n    </Button>\n  );\n}`}
        />
        <p>
          <code>useTheme()</code> exposes mode, resolvedMode, accent, radius, density, setTheme, and
          resetTheme. System mode follows the operating system. Preferences are stored locally and
          synchronize between browser tabs.
        </p>
      </section>
      <section className="doc-section">
        <h2>Your colors, your tokens</h2>
        <p>
          Theme tokens are CSS custom properties. Supply token overrides through PlainProvider or
          author your own stylesheet.
        </p>
        <CodeBlock
          code={`<PlainProvider tokens={{\n  accent: '#1d4ed8',\n  'accent-foreground': '#ffffff',\n  'accent-soft': '#eff6ff',\n  font: "'Your font', sans-serif",\n}}>\n  <App />\n</PlainProvider>`}
        />
        <CodeBlock
          language="css"
          code={`:root {\n  --ui-accent: #1d4ed8;\n  --ui-accent-foreground: #ffffff;\n  --ui-accent-soft: #eff6ff;\n}\n\n[data-theme='dark'] {\n  --ui-accent: #93c5fd;\n  --ui-accent-foreground: #172554;\n  --ui-accent-soft: #172554;\n}`}
        />
        <p>
          When you change colors, check text and control contrast in both light and dark mode. Token
          overrides are explicit; PlainUI does not generate a contrast-safe palette from an
          arbitrary brand color.
        </p>
      </section>
      <section className="doc-section">
        <h2>Local themes</h2>
        <p>
          ThemeScope applies tokens, styling slots, and direction to a section of your application.
        </p>
        <CodeBlock
          code={`<ThemeScope tokens={{\n  accent: '#1d4ed8',\n  'accent-foreground': '#fff',\n  'accent-soft': '#eff6ff',\n  radius: '12px',\n}}>\n  <Button variant="accent">A different feeling</Button>\n</ThemeScope>`}
        />
      </section>
    </>
  );
}
function Tokens() {
  return (
    <>
      <section className="doc-section" id="colors">
        <h2>Color</h2>
        <p>
          Semantic tokens make the default neutral and your eventual brand consistent. Surface,
          text, and border roles stay separate.
        </p>
        <div className="token-colors">
          {[
            { name: 'Background', token: 'background' },
            { name: 'Foreground', token: 'foreground' },
            { name: 'Surface', token: 'surface' },
            { name: 'Muted', token: 'muted' },
            { name: 'Accent', token: 'accent' },
            { name: 'Border', token: 'border' },
          ].map(({ name, token }) => (
            <div key={token}>
              <span style={{ background: `var(--ui-${token})` }} />
              <strong>{name}</strong>
              <code>--ui-{token}</code>
            </div>
          ))}
        </div>
        <CodeBlock
          language="css"
          compact
          code={`--ui-background: #ffffff;\n--ui-foreground: #202321;\n--ui-muted: #f5f6f5;\n--ui-muted-foreground: #666b68;\n--ui-border: #e5e7e6;\n--ui-input-border: #b5bbb7;\n--ui-accent: #252826;\n--ui-accent-foreground: #ffffff;\n--ui-accent-soft: #f2f3f2;`}
        />
      </section>
      <section className="doc-section" id="typography">
        <h2>Typography</h2>
        <p>
          One sans-serif family, a restrained scale, and clear weight changes. The documentation
          uses Inter Variable, loaded locally. The library itself uses your system font unless Inter
          is available.
        </p>
        <div className="typography-specimen">
          <div>
            <span>Display / 48px / 600</span>
            <strong style={{ fontSize: 48 }}>Aa. Plain & simple.</strong>
          </div>
          <div>
            <span>Heading / 24px / 600</span>
            <strong style={{ fontSize: 24 }}>A little room for your ideas.</strong>
          </div>
          <div>
            <span>Body / 16px / 400</span>
            <p>A considered foundation for whatever comes next.</p>
          </div>
          <div>
            <span>Label / 14px / 500</span>
            <Label>Project name</Label>
          </div>
        </div>
      </section>
      <section className="doc-section" id="spacing">
        <h2>Spacing</h2>
        <p>
          Use an 8px layout grid: 8, 16, 24, 32, 48, and 64px. Small internal gaps and icon
          alignment use 4px subdivisions.
        </p>
        <div className="spacing-scale">
          {[8, 16, 24, 32, 48, 64].map((space) => (
            <div key={space}>
              <span>{space}px</span>
              <div style={{ width: space }} />
            </div>
          ))}
        </div>
        <CodeBlock
          language="tsx"
          compact
          code={`<div className="grid grid-cols-12 gap-6">\n  <aside className="col-span-12 md:col-span-3" />\n  <main className="col-span-12 md:col-span-9" />\n</div>`}
        />
      </section>
      <section className="doc-section" id="shape">
        <h2>Shape & density</h2>
        <p>
          <code>--ui-radius</code> defaults to 6px. <code>--ui-control-height</code> defaults to
          40px. Density changes standard controls to 32px, 40px, or 48px; explicit component sizes
          stay predictable.
        </p>
        <div className="shape-specimen">
          {[0, 4, 8, 16].map((radius) => (
            <div key={radius}>
              <span style={{ borderRadius: radius }} />
              <code>{radius}px</code>
            </div>
          ))}
        </div>
      </section>
      <section className="doc-section" id="motion">
        <h2>Motion</h2>
        <p>
          Color transitions are brief. Popovers enter in 150ms, dialogs in 180ms, and sheets in
          200ms. Components respect <code>prefers-reduced-motion</code>; focus and state changes
          remain visible without motion.
        </p>
      </section>
    </>
  );
}
function Customization() {
  const [active, setActive] = React.useState('default');
  return (
    <>
      <section className="doc-section">
        <h2>Keep the components. Find your identity.</h2>
        <p>
          Start with the defaults, then customize at the level your product needs. There is no
          required styling runtime and no special prop language to learn.
        </p>
        <div className="customization-comparison">
          <Tabs value={active} onValueChange={setActive}>
            <TabsList aria-label="Brand comparison">
              <TabsTrigger value="default">Plain</TabsTrigger>
              <TabsTrigger value="branded">Your identity</TabsTrigger>
              <TabsTrigger value="unstyled">Unstyled</TabsTrigger>
            </TabsList>
            <TabsContent value="default">
              <div className="brand-preview">
                <Field label="Project name">
                  <Input placeholder="Your next idea" />
                </Field>
                <Button>Make a start</Button>
              </div>
            </TabsContent>
            <TabsContent value="branded">
              <ThemeScope
                tokens={{
                  accent: '#1d4ed8',
                  'accent-foreground': '#ffffff',
                  'accent-soft': '#eff6ff',
                  radius: '16px',
                }}
                componentStyles={{ 'button.root': 'rounded-full px-6' }}
              >
                <div className="brand-preview">
                  <Field label="Project name">
                    <Input placeholder="Something distinctly yours" />
                  </Field>
                  <Button variant="accent">
                    Make a start
                    <ArrowRight aria-hidden="true" />
                  </Button>
                </div>
              </ThemeScope>
            </TabsContent>
            <TabsContent value="unstyled">
              <ThemeScope unstyled>
                <div className="brand-preview unstyled-preview">
                  <Field label="Project name">
                    <Input className="raw-input" placeholder="Your own CSS, your own feeling" />
                  </Field>
                  <Button className="raw-button">Make a start</Button>
                </div>
              </ThemeScope>
            </TabsContent>
          </Tabs>
        </div>
      </section>
      <section className="doc-section">
        <h2>1. Style it like HTML</h2>
        <p>
          Every styled part accepts <code>className</code>, <code>style</code>, native event
          handlers, and ARIA attributes. Classes merge using tailwind-merge, so a conflicting
          utility can replace a default.
        </p>
        <CodeBlock
          code={`<Button\n  className="rounded-full px-6"\n  style={{ fontWeight: 600 }}\n  onClick={handleCreate}\n>\n  Create project\n</Button>`}
        />
        <p>
          For stylesheet rules, target the stable part attributes instead of implementation classes.
        </p>
        <CodeBlock
          language="css"
          code={`[data-ui='button'][data-slot='root'] {\n  border-radius: 999px;\n}\n\n[data-ui='input'][data-slot='root']:focus-visible {\n  outline-width: 3px;\n}`}
        />
      </section>
      <section className="doc-section">
        <h2>2. Set shared tokens</h2>
        <p>
          Change the shared foundation once, then let the system carry those choices through forms,
          menus, dialogs, and feedback.
        </p>
        <CodeBlock
          code={`<PlainProvider\n  theme={{ radius: 12, density: 'spacious' }}\n  tokens={{\n    accent: '#1d4ed8',\n    'accent-foreground': '#ffffff',\n    'accent-soft': '#eff6ff',\n  }}\n>\n  <App />\n</PlainProvider>`}
        />
      </section>
      <section className="doc-section">
        <h2>3. Style named parts</h2>
        <p>
          The typed <code>styles</code> map applies classes to a named part everywhere in the
          provider. Every component page lists its available slots.
        </p>
        <CodeBlock
          code={`<PlainProvider styles={{\n  'button.root': 'rounded-full font-semibold',\n  'input.root': 'rounded-lg',\n  'dialog.content': 'max-w-xl p-8',\n  'dialog.title': 'text-xl',\n  'select.trigger': 'rounded-lg',\n}}>\n  <App />\n</PlainProvider>`}
        />
        <p>
          Use StyleProvider for a local override without changing your theme. Local component
          classes have the final say.
        </p>
        <CodeBlock
          code={`<StyleProvider styles={{ 'button.root': 'rounded-none' }}>\n  <Button>Local treatment</Button>\n</StyleProvider>`}
        />
      </section>
      <section className="doc-section">
        <h2>4. Go unstyled</h2>
        <p>
          Use the behavior with your own styling. Individual styled parts support{' '}
          <code>unstyled</code>, and StyleProvider can remove defaults for a whole subtree.
        </p>
        <CodeBlock
          code={`<Button unstyled className="my-button">Create project</Button>\n\n<StyleProvider unstyled>\n  <Dialog>\n    <DialogTrigger className="my-button">Open</DialogTrigger>\n    <DialogContent className="my-dialog">\n      <DialogTitle className="my-title">Your design</DialogTitle>\n      <DialogDescription>Your accessible dialog.</DialogDescription>\n    </DialogContent>\n  </Dialog>\n</StyleProvider>`}
        />
        <p>
          The styled parts keep their semantics and interaction. Without default CSS, you are
          responsible for positioning overlays, styling focus, and providing usable touch targets.
          Calendar also accepts DayPicker's classNames and components for deeper rendering control.
          Toast accepts Sonner's toastOptions.
        </p>
      </section>
      <section className="doc-section">
        <h2>5. Compose your own elements</h2>
        <p>
          Use <code>asChild</code> on Button and primitive triggers to keep one semantic element.
          Compound components expose their individual parts.
        </p>
        <CodeBlock
          code={`<Button asChild variant="outline">\n  <a href="/projects">Your projects</a>\n</Button>\n\n<Card className="rounded-xl">\n  <CardHeader><CardTitle>Your own layout</CardTitle></CardHeader>\n  <CardContent className="grid gap-6">{children}</CardContent>\n</Card>`}
        />
      </section>
    </>
  );
}
function RTL() {
  const { direction, setDirection } = useAppPreferences();
  const id = React.useId();
  return (
    <>
      <section className="doc-section">
        <h2>Direction is behavior, too</h2>
        <p>
          PlainProvider connects the HTML direction and Radix's direction context. Layout uses
          logical spacing; arrows, selection controls, and calendar navigation respond to the
          reading direction.
        </p>
        <Button variant="outline" onClick={() => setDirection(direction === 'rtl' ? 'ltr' : 'rtl')}>
          <MoveHorizontal aria-hidden="true" />
          {direction === 'rtl' ? 'Use left-to-right layout' : 'Try right-to-left layout'}
        </Button>
        <CodeBlock code={`<PlainProvider dir="rtl">\n  <App />\n</PlainProvider>`} />
      </section>
      <section className="doc-section">
        <h2>Mix directions locally</h2>
        <p>
          ThemeScope adds a direction attribute to its DOM scope and provides direction context for
          portaled primitives. Use DirectionProvider when you already own the element; set{' '}
          <code>dir</code> on that element as well.
        </p>
        <div className="rtl-preview">
          <ThemeScope dir="rtl" lang="ar">
            <Field label={'\u0627\u0633\u0645 \u0627\u0644\u0645\u0634\u0631\u0648\u0639'}>
              <Input
                placeholder={
                  '\u0641\u0643\u0631\u062a\u0643 \u0627\u0644\u062a\u0627\u0644\u064a\u0629'
                }
              />
            </Field>
            <div className="rtl-switch-row">
              <Label htmlFor={id}>
                {'\u0625\u0634\u0639\u0627\u0631\u0627\u062a \u0627\u0644\u0628\u0631\u064a\u062f'}
              </Label>
              <Switch id={id} defaultChecked />
            </div>
            <Button>
              {'\u0625\u0646\u0634\u0627\u0621 \u0645\u0634\u0631\u0648\u0639'}
              <ArrowRight className="rtl-arrow" aria-hidden="true" />
            </Button>
          </ThemeScope>
        </div>
        <CodeBlock
          code={`<ThemeScope dir="rtl" lang="ar">\n  <Field label="Project name">\n    <Input name="project" />\n  </Field>\n  <Button>Create project</Button>\n</ThemeScope>`}
        />
      </section>
      <section className="doc-section">
        <h2>Use logical layout</h2>
        <CodeBlock
          code={`// Logical spacing works in either direction\n<div className="ps-6 pe-4 text-start">\n  <span className="ms-auto">Aligned to the end</span>\n</div>\n\n// The end edge changes with the reading direction\n<SheetContent side="end">...</SheetContent>`}
        />
        <p>
          Sheet supports <code>start</code>, <code>end</code>, and <code>bottom</code>. Physical{' '}
          <code>left</code> and <code>right</code> remain available when a layout specifically
          requires them.
        </p>
        <p>
          Keep code, email addresses, and URLs in explicit LTR spans where appropriate. Direction
          does not translate text; supply localized labels and DayPicker locale data separately.
        </p>
      </section>
      <section className="doc-section">
        <h2>Keyboard behavior</h2>
        <ul className="guide-check-list">
          {[
            'Tabs and radio groups follow direction-aware arrow-key navigation.',
            'Horizontal sliders increase and decrease along the intended reading direction.',
            'Select and dropdown menus maintain focus and support typeahead.',
            'Breadcrumb and pagination arrows point in the reading direction.',
            'Calendar month navigation and day navigation honor direction.',
          ].map((text) => (
            <li key={text}>
              <Check size={15} aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
      </section>
      <DirectionProvider dir="ltr">
        <span />
      </DirectionProvider>
    </>
  );
}
function AccessibilityGuide() {
  return (
    <>
      <section className="doc-section">
        <h2>Built on accessible primitives</h2>
        <p>
          Radix handles focus management, keyboard patterns, and ARIA relationships for interactive
          components. Native elements carry semantics for buttons, forms, and tables. React
          DayPicker, cmdk, and Sonner provide their domain interactions.
        </p>
        <p>
          <a
            className="text-link"
            href="https://www.radix-ui.com/primitives/docs/overview/accessibility"
            target="_blank"
            rel="noreferrer"
          >
            Radix accessibility documentation
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </p>
      </section>
      <section className="doc-section">
        <h2>Labels and validation</h2>
        <CodeBlock
          code={`<Field\n  label="Email address"\n  description="We will only send important updates."\n  error={errors.email}\n  required\n>\n  <Input type="email" required name="email" />\n</Field>`}
        />
        <p>
          Field connects labels and messages automatically. Required markers use aria-required;
          native validation still needs <code>required</code> on the input. Icon-only buttons need
          an accessible name.
        </p>
      </section>
      <section className="doc-section">
        <h2>Focus and keyboard</h2>
        <p>
          Focus rings remain visible on keyboard navigation. Dialogs and sheets trap focus and
          return it to the trigger. Dropdown menus, selects, tabs, and radio groups implement the
          corresponding keyboard pattern.
        </p>
        <ul className="guide-check-list">
          {[
            'Reach every action with Tab and Shift+Tab.',
            'Open and close overlays with keyboard controls.',
            'Retain meaningful focus after saving, removing, or navigating.',
            'Use an appropriate heading order and named landmarks.',
            'Keep interactive targets large enough for touch input.',
          ].map((item) => (
            <li key={item}>
              <Check size={15} aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </section>
      <section className="doc-section">
        <h2>Color, motion, and zoom</h2>
        <p>
          Default text and controls use contrast-aware colors. Status is always expressed in text.
          Reduced-motion preferences remove nonessential transitions and animations. Layouts must
          remain usable with enlarged text and narrow viewports.
        </p>
        <p>
          Compact and icon controls are designed for dense desktop interfaces. Use spacious density
          or additional target padding when building a touch-first app.
        </p>
      </section>
      <section className="doc-section">
        <h2>Check the whole experience</h2>
        <p>
          Automated checks find many issues, but they do not establish complete WCAG compliance.
          Test your application's actual content with a keyboard and a screen reader, including
          loading, empty, validation, and error states. Recheck contrast and focus when you
          customize the design.
        </p>
        <a
          href="https://www.w3.org/WAI/WCAG22/quickref/"
          className="text-link"
          target="_blank"
          rel="noreferrer"
        >
          WCAG 2.2 quick reference
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </section>
    </>
  );
}
function Performance() {
  return (
    <>
      <section className="doc-section">
        <h2>Modular by default</h2>
        <p>
          The library ships ESM modules with external dependencies and side effects limited to CSS.
          A bundler can remove unused exports. Import only the components you use, and import the
          stylesheet once.
        </p>
        <CodeBlock
          code={`import { Button, Input } from '@plainui/react';\nimport '@plainui/react/styles.css';`}
        />
      </section>
      <section className="doc-section">
        <h2>No styling runtime</h2>
        <p>
          Tailwind generates static CSS. Theme changes update CSS custom properties and data
          attributes. Class merging occurs when components render; there is no runtime stylesheet
          generation.
        </p>
      </section>
      <section className="doc-section">
        <h2>Keep expensive views focused</h2>
        <p>
          Memoize table data and column definitions. Paginate larger collections and use
          virtualization or server data operations when needed. Lazy-load calendar, data-heavy
          views, and secondary routes in your app.
        </p>
        <CodeBlock
          code={`const Reports = lazy(() => import('./Reports'));\n\n<Suspense fallback={<Spinner label="Loading reports" />}>\n  <Reports />\n</Suspense>`}
        />
        <p>
          PlainUI's DataTable uses client-side search, sorting, and pagination. It is appropriate
          for small collections; use TanStack Table directly for server data operations.
        </p>
      </section>
    </>
  );
}
export default function GuidePage() {
  const { slug = 'introduction' } = useParams();
  const info = guideInfo[slug];
  React.useEffect(() => {
    document.title = `${info ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Not found'} - PlainUI`;
  }, [slug, info]);
  if (!info)
    return (
      <div className="not-found">
        <h1>Page not found</h1>
        <Link to="/docs/introduction">Back to documentation</Link>
      </div>
    );
  const body: Record<string, React.ReactNode> = {
    introduction: <Introduction />,
    installation: <Installation />,
    theming: <Theming />,
    tokens: <Tokens />,
    accessibility: <AccessibilityGuide />,
    customization: <Customization />,
    rtl: <RTL />,
    performance: <Performance />,
  };
  return (
    <article className="guide-page" key={slug}>
      <div className="doc-breadcrumb">
        <Link to="/docs/introduction">Documentation</Link>
        <span>/</span>
        <span>
          {slug === 'rtl' ? 'Right to left' : slug.charAt(0).toUpperCase() + slug.slice(1)}
        </span>
      </div>
      <h1>{info.title}</h1>
      <p className="page-lead">{info.description}</p>
      {body[slug]}
      <div className="guide-bottom-link">
        <Link className="text-link" to="/components">
          Explore the components
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
        <Badge variant="outline">v0.1.0</Badge>
      </div>
    </article>
  );
}
