import { Link } from 'react-router-dom';
import { CodeBlock } from '../shared';

export function UpgradeGuide() {
  return (
    <>
      <section>
        <h2>Install the third release</h2>
        <p>
          0.3.0 follows 0.2.0. It keeps the @plain/ui package name, neutral defaults, root imports,
          grouped entries, tokens, native form behavior and React 18.3/19 support. The downloadable
          archive is the distribution for this local release; registry publication is a separate
          step.
        </p>
        <CodeBlock code="npm install ./plain-ui-0.3.0.tgz" language="bash" />
        <p>
          The <a href="/v/0.2.0/">0.2 documentation</a> is built from a pinned checkout. The
          <a href="/v/0.1.0/"> original 0.1 documentation</a> retains @plainui/react examples.
        </p>
      </section>
      <section>
        <h2>Choose component imports and styles</h2>
        <CodeBlock
          title="App.tsx"
          code={`import { PlainProvider } from '@plain/ui/provider';
import { Button } from '@plain/ui/button';
import { Field } from '@plain/ui/field';
import { PhoneInput } from '@plain/ui/phone-input';
import '@plain/ui/core.css';
import '@plain/ui/inputs.css';

export function Contact() {
  return <PlainProvider>
    <form onSubmit={event => event.preventDefault()}>
    <Field label="Phone number">
      <PhoneInput name="phone" defaultCountry="EG" />
    </Field>
    <Button type="submit">Save</Button>
    </form>
  </PlainProvider>;
}`}
        />
        <p>
          The complete styles.css remains the convenient default. The optional core.css plus feature
          styles let an application omit unused component CSS. Components are split internally, so a
          root Input import also avoids Select, Slider and RadioGroup engines. Chart entries retain
          their own chart engine, and time-only controls avoid the month-calendar renderer.
        </p>
        <p>
          <Link to="/docs/performance">Production imports, CSS groups and rendering guidance</Link>
        </p>
      </section>
      <section>
        <h2>Mobile choices and scheduling</h2>
        <p>
          PhoneInput uses a virtualized country list with localized names, full-list search and
          keyboard navigation. Its default auto presentation opens the original Sheet on mobile.
          Select, Combobox and MultiSelect retain popover defaults; opt into presentation="auto" or
          force "sheet". Select keeps its selection and form engine inside the animated library
          Sheet.
        </p>
        <p>
          Date pickers use month and year Select controls and mobile date sheets. Date-time controls
          separate date and time steps on mobile. Time pickers support 12/24-hour formatting and
          one-minute steps by default. Range selection stays open for review. Sheets and drawers
          share motion, drag arbitration, overscroll continuation and full-viewport behavior.
        </p>
      </section>
      <section>
        <h2>Compose page controls and feedback</h2>
        <p>
          DataTable controls can live outside the table using the same table instance. Search,
          filters, sorting, columns, pagination and selection controls can be independently hidden
          or placed on the page. List has explicit selection and ordinary modes; Item supplies
          reusable row interactions. Cards and empty states expose composition and styling slots.
        </p>
        <p>
          Add files with Dropzone, share values with QRCode, divide storage with segmented Progress,
          and show activity in HeatmapChart. QRCode uses its draw reveal and supports circular dot
          fields. Charts have shape-aware skeletons, tonal theme colors and accessible data
          alternatives. createColorPalette and generateColors provide deterministic
          theme-coordinated colors.
        </p>
      </section>
      <section>
        <h2>Review application integration</h2>
        <p>
          PlainProvider and LanguageProvider supply locale, messages, direction and time zone.
          ThemeScope supports local overrides and scoped portals. All field appearances, tooltip
          props and reduced-motion policy continue to apply. Test long translations, RTL, touch
          scrolling, software-keyboard height and focus return in the consuming application.
          Internal CSS class strings are not a styling contract; use documented slots and tokens.
        </p>
        <p>
          <Link to="/docs/localization">Localization</Link>
          {' · '}
          <Link to="/docs/data-tables">Data table composition</Link>
          {' · '}
          <Link to="/docs/customization">Scoped customization</Link>
        </p>
      </section>
    </>
  );
}
