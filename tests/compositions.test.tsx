import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ts from 'typescript';
import { blockRegistry, getBlock } from '../src/docs/compositions/registry';
import { templateRegistry, getTemplate } from '../src/docs/compositions/template-registry';
import {
  blockCategories,
  templateCategories,
  type AuthenticationConfig,
  type BlockConfig,
  type ChartConfig,
  type CollaborationConfig,
  type CommerceConfig,
  type FinanceConfig,
  type FormConfig,
  type MobileConfig,
  type NavigationConfig,
  type OverviewConfig,
  type ScheduleConfig,
  type SettingsConfig,
  type TableConfig,
} from '../src/docs/compositions/types';
import { AuthenticationBlock } from '../src/docs/compositions/families/AuthenticationBlock';
import { FormBlock } from '../src/docs/compositions/families/FormBlock';
import { OverviewBlock } from '../src/docs/compositions/families/OverviewBlock';
import { TableBlock } from '../src/docs/compositions/families/TableBlock';
import { CollaborationBlock } from '../src/docs/compositions/families/CollaborationBlock';
import { CommerceBlock } from '../src/docs/compositions/families/CommerceBlock';
import { FinanceBlock } from '../src/docs/compositions/families/FinanceBlock';
import { SettingsBlock } from '../src/docs/compositions/families/SettingsBlock';
import { MobileBlock } from '../src/docs/compositions/families/MobileBlock';
import { SchedulingBlock } from '../src/docs/compositions/families/SchedulingBlock';
import { NavigationBlock } from '../src/docs/compositions/families/NavigationBlock';
import { ChartBlock } from '../src/docs/compositions/families/ChartBlock';
import { TemplateRenderer } from '../src/docs/compositions/TemplateRenderer';
import { csvCell } from '../src/docs/compositions/helpers';
import * as compositionHelpers from '../src/docs/compositions/helpers';
import BlocksPage from '../src/docs/pages/BlocksPage';
import TemplatesPage from '../src/docs/pages/TemplatesPage';
import { filterCompositions } from '../src/docs/compositions';

function config<T extends BlockConfig>(id: string): T {
  return getBlock(id)!.config as T;
}
function sourceFor(item: { sourceURL: string }) {
  return readFileSync(resolve(`public${item.sourceURL}`), 'utf8');
}
beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const path = String(input);
    if (!/^\/compositions\/(blocks|templates)\/[a-z0-9-]+\.tsx$/.test(path))
      throw new Error(`Unexpected fetch ${path}`);
    return new Response(sourceFor({ sourceURL: path }), { status: 200 });
  });
});
function readLiteral(node: ts.Expression): unknown {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken)
    return -Number(readLiteral(node.operand));
  if (ts.isArrayLiteralExpression(node))
    return node.elements.map((element) => readLiteral(element as ts.Expression));
  if (ts.isObjectLiteralExpression(node))
    return Object.fromEntries(
      node.properties.map((property) => {
        if (
          !ts.isPropertyAssignment(property) ||
          !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
        )
          throw new Error('Expected a literal property');
        return [property.name.text, readLiteral(property.initializer)];
      }),
    );
  throw new Error(`Expected literal data, got ${ts.SyntaxKind[node.kind]}`);
}
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('composition registry and source contracts', () => {
  it('provides exactly 120 distinct blocks with ten workflow variants in every category', () => {
    expect(blockRegistry).toHaveLength(120);
    expect(new Set(blockRegistry.map((item) => item.id)).size).toBe(120);
    for (const category of blockCategories) {
      const items = blockRegistry.filter((item) => item.category === category);
      expect(items, category).toHaveLength(10);
      expect(new Set(items.map((item) => item.config.variant)).size, category).toBe(10);
      expect(
        items.every(
          (item) =>
            item.config.family === category &&
            item.tags.length >= 2 &&
            item.description.length > 40,
        ),
      ).toBe(true);
    }
  });
  it('provides 60 distinct usable templates with valid routes and local creation forms', () => {
    expect(templateRegistry).toHaveLength(60);
    expect(new Set(templateRegistry.map((item) => item.id)).size).toBe(60);
    const signatures = templateRegistry.map(
      (item) =>
        `${item.config.layout}:${item.config.routes.map((route) => `${route.blockIds.join(',')}:${route.layout}`).join('|')}`,
    );
    expect(new Set(signatures).size).toBe(60);
    for (const category of templateCategories)
      expect(templateRegistry.filter((item) => item.category === category)).toHaveLength(12);
    for (const item of templateRegistry) {
      expect(item.config.routes.length).toBeGreaterThanOrEqual(3);
      expect(new Set(item.config.routes.map((route) => route.id)).size).toBe(
        item.config.routes.length,
      );
      expect(item.config.createFields.some((field) => field.required)).toBe(true);
      for (const route of item.config.routes) {
        expect(route.blockIds.length).toBeGreaterThan(0);
        expect(route.blockIds.length).toBeLessThanOrEqual(3);
        for (const id of route.blockIds) expect(getBlock(id), `${item.id}: ${id}`).toBeDefined();
        for (const id of Object.keys(route.blockOverrides ?? {}))
          expect(route.blockIds).toContain(id);
      }
    }
  });
  it('provides independent copy/paste source and preserves the actual item configuration', () => {
    for (const item of [...blockRegistry, ...templateRegistry]) {
      const source = sourceFor(item);
      expect(source).not.toContain('@plain/ui/blocks');
      expect(source).toContain("import '@plain/ui/styles.css'");
      expect(source).toContain('const exampleStyles');
      expect(source).toContain('export default function');
      const sourceFile = ts.createSourceFile(
        `${item.id}.tsx`,
        source,
        ts.ScriptTarget.ES2022,
        true,
        ts.ScriptKind.TSX,
      );
      const statement = sourceFile.statements.find(
        (statement) =>
          ts.isVariableStatement(statement) &&
          statement.declarationList.declarations.some(
            (declaration) =>
              ts.isIdentifier(declaration.name) && declaration.name.text === 'config',
          ),
      );
      expect(statement && ts.isVariableStatement(statement)).toBe(true);
      const declaration = (statement as ts.VariableStatement).declarationList.declarations[0];
      expect(readLiteral(declaration.initializer!)).toEqual(item.config);
      expect(item.sourceURL).toContain(`${item.id}.tsx`);
      expect(item.component).toBeTypeOf('function');
      expect(React.isValidElement(item.render())).toBe(true);
    }
  });
  it('typechecks all 180 exported TSX modules against the actual public entry', () => {
    const root = process.cwd().replaceAll('\\', '/');
    const virtualRoot = `${root}/public/compositions/__source_contract__/`;
    const sources = new Map(
      [...blockRegistry, ...templateRegistry].map((item) => [
        `${virtualRoot}${item.id}.tsx`,
        sourceFor(item),
      ]),
    );
    sources.set(`${virtualRoot}styles.d.ts`, "declare module '@plain/ui/styles.css';");
    const options: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      strict: true,
      skipLibCheck: true,
      noEmit: true,
      esModuleInterop: true,
    };
    const host = ts.createCompilerHost(options);
    const readFile = host.readFile.bind(host);
    const fileExists = host.fileExists.bind(host);
    const getSourceFile = host.getSourceFile.bind(host);
    const canonical = (path: string) => path.replaceAll('\\', '/');
    host.readFile = (path) => sources.get(canonical(path)) ?? readFile(path);
    host.fileExists = (path) => sources.has(canonical(path)) || fileExists(path);
    host.getSourceFile = (path, languageVersion, onError, shouldCreateNewSourceFile) =>
      sources.has(canonical(path))
        ? ts.createSourceFile(path, sources.get(canonical(path))!, languageVersion, true)
        : getSourceFile(path, languageVersion, onError, shouldCreateNewSourceFile);
    host.resolveModuleNames = (names, containingFile) =>
      names.map((name) =>
        name === '@plain/ui'
          ? { resolvedFileName: `${root}/src/ui/index.ts`, extension: ts.Extension.Ts }
          : ts.resolveModuleName(name, containingFile, options, host).resolvedModule,
      );
    const program = ts.createProgram([...sources.keys()], options, host);
    const errors = ts
      .getPreEmitDiagnostics(program)
      .filter(
        (diagnostic) =>
          diagnostic.category === ts.DiagnosticCategory.Error &&
          diagnostic.file &&
          canonical(diagnostic.file.fileName).startsWith(virtualRoot),
      );
    expect(
      errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
    ).toEqual([]);
  }, 120000);
  it('searches metadata with combined terms and protects spreadsheet exports', () => {
    expect(
      filterCompositions(blockRegistry, 'invoice tax', 'all').map((item) => item.id),
    ).toContain('finance-invoice');
    expect(
      filterCompositions(templateRegistry, 'reconciliation', 'desktop-apps').map((item) => item.id),
    ).toEqual(['desktop-apps-bookkeeper']);
    expect(csvCell('=HYPERLINK("bad")')).toBe('"\'=HYPERLINK(""bad"")"');
    expect(csvCell('A, B')).toBe('"A, B"');
    expect(csvCell('  =SUM(A1:A2)')).toBe('"\'  =SUM(A1:A2)"');
    expect(csvCell(-18)).toBe('"-18"');
  });
});

describe('local block workflows', () => {
  it('validates sign-in, exposes password visibility, and resets the local session', async () => {
    const user = userEvent.setup();
    render(<AuthenticationBlock config={config<AuthenticationConfig>('auth-password')} />);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByText('Enter a valid email address.')).toBeVisible();
    expect(screen.getByText('Use at least 8 characters.')).toBeVisible();
    await user.type(screen.getByRole('textbox', { name: 'Email address' }), 'avery@example.com');
    await user.type(screen.getByLabelText(/^Password/, { selector: 'input' }), 'clear-password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByLabelText(/^Password/, { selector: 'input' })).toHaveAttribute(
      'type',
      'text',
    );
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByRole('heading', { name: 'Your account' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(screen.getByLabelText(/^Password/, { selector: 'input' })).toHaveValue('');
  });
  it('rejects mismatching replacement passwords', async () => {
    const user = userEvent.setup();
    render(<AuthenticationBlock config={config<AuthenticationConfig>('auth-reset')} />);
    await user.type(screen.getByLabelText(/^New password/, { selector: 'input' }), 'new-password');
    await user.type(
      screen.getByLabelText(/^Confirm password/, { selector: 'input' }),
      'different-password',
    );
    await user.click(screen.getByRole('button', { name: 'Update password' }));
    expect(screen.getByText('Passwords must match.')).toBeVisible();
  });
  it('completes recovery with the correct password-updated result', async () => {
    const user = userEvent.setup();
    render(<AuthenticationBlock config={config<AuthenticationConfig>('auth-recovery')} />);
    await user.type(screen.getByRole('textbox', { name: 'Email address' }), 'avery@example.com');
    await user.click(screen.getByRole('button', { name: 'Create reset request' }));
    await user.click(screen.getByRole('button', { name: 'Choose new password' }));
    await user.type(
      screen.getByLabelText(/^New password/, { selector: 'input' }),
      'replacement-password',
    );
    await user.type(
      screen.getByLabelText(/^Confirm password/, { selector: 'input' }),
      'replacement-password',
    );
    await user.click(screen.getByRole('button', { name: 'Update password' }));
    expect(screen.getByRole('heading', { name: 'Password updated' })).toBeVisible();
  });
  it('creates and selects a workspace, with searchable empty and restored states', async () => {
    const user = userEvent.setup();
    render(<NavigationBlock config={config<NavigationConfig>('nav-workspace')} />);
    await user.click(screen.getByRole('button', { name: 'New workspace' }));
    await user.type(screen.getByRole('textbox', { name: 'Workspace name' }), 'October Studio');
    await user.type(screen.getByRole('textbox', { name: 'Purpose' }), 'Release planning');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Create' }));
    expect(screen.getByRole('button', { name: /October Studio/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const search = screen.getByRole('textbox', { name: 'Search workspaces' });
    await user.type(search, 'unfindable');
    expect(screen.getByRole('heading', { name: 'No workspaces found' })).toBeVisible();
    await user.clear(search);
    await user.click(screen.getByRole('button', { name: /Research Lab/ }));
    expect(screen.getByRole('button', { name: /Research Lab/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /October Studio/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
  it('expands the tool rail and preserves accessible destination names', async () => {
    const user = userEvent.setup();
    const { container } = render(<NavigationBlock config={config<NavigationConfig>('nav-rail')} />);
    expect(container.querySelector('.pb-navigation-shell')).toHaveClass('pb-navigation-collapsed');
    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    expect(container.querySelector('.pb-navigation-shell')).not.toHaveClass(
      'pb-navigation-collapsed',
    );
    const navigation = screen.getByRole('navigation', { name: 'Canvas' });
    expect(within(navigation).getByRole('button', { name: 'Layers' })).toHaveAttribute(
      'aria-label',
      'Layers',
    );
    await user.click(within(navigation).getByRole('button', { name: 'Assets' }));
    expect(within(navigation).getByRole('button', { name: 'Assets' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
  it('exposes readable chart data and applies the selected comparison period', async () => {
    const user = userEvent.setup();
    const chartConfig = config<ChartConfig>('charts-revenue');
    render(<ChartBlock config={chartConfig} />);
    await user.click(screen.getByRole('checkbox', { name: 'Costs' }));
    expect(screen.getByRole('checkbox', { name: 'Costs' })).not.toBeChecked();
    await user.click(screen.getByRole('tab', { name: 'Data' }));
    const table = screen.getByRole('table', { name: 'Revenue & costs data' });
    expect(
      within(table).getByText(compositionHelpers.money(chartConfig.series[0].primary)),
    ).toBeVisible();
    await user.click(screen.getByRole('combobox', { name: 'Chart period' }));
    await user.click(screen.getByRole('option', { name: 'Previous period' }));
    expect(
      within(table).getByText(
        compositionHelpers.money(Math.round(chartConfig.series[0].primary * 0.78 * 100) / 100),
      ),
    ).toBeVisible();
    expect(
      within(table).queryByText(compositionHelpers.money(chartConfig.series[0].primary)),
    ).toBeNull();
  });
  it('exports the current invoice quantities, rates, and tax', async () => {
    const user = userEvent.setup();
    const exported = vi.spyOn(compositionHelpers, 'exportCsv').mockImplementation(() => {});
    render(<FinanceBlock config={config<FinanceConfig>('finance-invoice')} />);
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Product design quantity' }), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Product design rate' }), {
      target: { value: '100' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Tax rate (%)' }), {
      target: { value: '5' },
    });
    await user.click(screen.getByRole('button', { name: 'Export CSV' }));
    expect(exported).toHaveBeenCalledWith(
      'INV-1048.csv',
      ['Item', 'Quantity', 'Rate', 'Amount'],
      expect.arrayContaining([['Product design', 3, 100, 300]]),
    );
    const rows = exported.mock.calls[0][2];
    expect(rows.find((row) => row[0] === 'Tax')?.[2]).toBe('5%');
    const subtotal = rows
      .filter((row) => row[0] !== 'Tax' && row[0] !== 'Total')
      .reduce((sum, row) => sum + Number(row[3]), 0);
    expect(rows.find((row) => row[0] === 'Total')?.[3]).toBe(subtotal * 1.05);
  });
  it('changes plan pricing with a labeled billing mode and records the selected plan', async () => {
    const user = userEvent.setup();
    const plans = config<CommerceConfig>('commerce-plans');
    const { container } = render(<CommerceBlock config={plans} />);
    await user.click(screen.getByRole('radio', { name: 'Annual' }));
    expect(screen.getByRole('radio', { name: 'Annual' })).toBeChecked();
    expect(screen.getByText(compositionHelpers.money(plans.products[0].price * 0.8))).toBeVisible();
    await user.click(screen.getAllByRole('button', { name: 'Choose plan' })[0]);
    expect(container.querySelector('.pb-plans article')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('annual billing');
  });
  it('validates each profile field and discards invalid unsaved edits', async () => {
    const user = userEvent.setup();
    render(<SettingsBlock config={config<SettingsConfig>('settings-profile')} />);
    await user.clear(screen.getByRole('textbox', { name: 'Full name' }));
    await user.clear(screen.getByRole('textbox', { name: 'Email' }));
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'invalid');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByRole('textbox', { name: 'Full name' })).toHaveAccessibleDescription(
      'Public display name A name is required.',
    );
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription(
      'Account contact address Enter a valid email address.',
    );
    await user.click(screen.getByRole('button', { name: 'Discard' }));
    expect(screen.getByRole('textbox', { name: 'Full name' })).toHaveValue('Avery Morgan');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });
  it('switches the appearance sample between real tab panels', async () => {
    const user = userEvent.setup();
    render(<SettingsBlock config={config<SettingsConfig>('settings-appearance')} />);
    expect(screen.getByRole('tabpanel', { name: 'Activity' })).toHaveTextContent('Keyboard audit');
    await user.click(screen.getByRole('tab', { name: 'Files' }));
    expect(screen.getByRole('tabpanel', { name: 'Files' })).toHaveTextContent(
      'Navigation specification',
    );
    expect(screen.queryByText('Keyboard audit')).toBeNull();
  });
  it('restarts a finished reading session and cleans up its timer', () => {
    vi.useFakeTimers();
    const readingConfig = config<MobileConfig>('mobile-player');
    const { unmount } = render(
      <MobileBlock
        config={{
          ...readingConfig,
          items: readingConfig.items.map((item) => ({ ...item, value: 2 })),
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Start reading' }));
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText('00:02')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Start reading' }));
    expect(screen.getByText('00:00')).toBeVisible();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText('00:01')).toBeVisible();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('validates each wizard step and retains editable submitted details', async () => {
    const user = userEvent.setup();
    render(<FormBlock config={config<FormConfig>('forms-onboarding')} />);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('Team name is required.')).toBeVisible();
    await user.type(screen.getByRole('textbox', { name: 'Team name' }), 'Research Lab');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Team size' }), '6–20 people');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Primary goal' }),
      'Share knowledge',
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.type(screen.getByRole('textbox', { name: 'Work email' }), 'team@example.com');
    await user.click(screen.getByRole('checkbox', { name: 'I agree to the workspace terms' }));
    await user.click(screen.getByRole('button', { name: 'Finish setup' }));
    expect(screen.getByRole('heading', { name: 'Details saved' })).toBeVisible();
    expect(screen.getByText('Research Lab')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Edit details' }));
    expect(screen.getByRole('textbox', { name: 'Work email' })).toHaveValue('team@example.com');
  });
  it('updates checklist progress without mutating registry data', async () => {
    const user = userEvent.setup();
    const original = config<OverviewConfig>('overview-checklist');
    render(<OverviewBlock config={original} />);
    expect(screen.getByText('2 of 5 complete')).toBeVisible();
    await user.click(screen.getByRole('checkbox', { name: 'Complete Set shipping zones' }));
    expect(screen.getByText('3 of 5 complete')).toBeVisible();
    expect(original.items[2].status).toBe('Pending');
  });
  it('filters invoice records and applies a selected batch action', async () => {
    const user = userEvent.setup();
    render(<TableBlock config={config<TableConfig>('tables-invoices')} />);
    await user.type(screen.getByRole('textbox', { name: 'Search invoices' }), 'Daylight');
    expect(screen.getByRole('button', { name: 'Daylight' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Meridian' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Select Daylight' }));
    await user.click(screen.getByRole('button', { name: 'Mark paid' }));
    expect(screen.getByText('Paid')).toBeVisible();
    expect(screen.getByText('1 record updated')).toBeVisible();
  });
  it('moves a kanban task to a different column', async () => {
    const user = userEvent.setup();
    render(<CollaborationBlock config={config<CollaborationConfig>('collaboration-board')} />);
    await user.click(screen.getByRole('combobox', { name: 'Move Checkout flow' }));
    await user.click(screen.getByRole('option', { name: 'Done' }));
    const doneColumn = screen.getByRole('heading', { name: 'Done' }).closest('section')!;
    expect(within(doneColumn).getByText('Checkout flow')).toBeVisible();
  });
  it('records one vote and replaces it when the user changes their choice', async () => {
    const user = userEvent.setup();
    render(<CollaborationBlock config={config<CollaborationConfig>('collaboration-poll')} />);
    await user.click(screen.getByRole('radio', { name: /Monday morning/ }));
    await user.click(screen.getByRole('button', { name: 'Vote' }));
    expect(
      screen.getByRole('progressbar', { name: 'Monday morning: 4 votes' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /Thursday morning/ }));
    await user.click(screen.getByRole('button', { name: 'Change vote' }));
    expect(
      screen.getByRole('progressbar', { name: 'Monday morning: 3 votes' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Thursday morning: 2 votes' }),
    ).toBeInTheDocument();
  });
  it('recalculates a cart when quantity changes and produces an order receipt', async () => {
    const user = userEvent.setup();
    render(<CommerceBlock config={config<CommerceConfig>('commerce-cart')} />);
    await user.click(screen.getByRole('button', { name: 'Increase Studio headphones quantity' }));
    expect(screen.getAllByText('$316.00').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Review order' }));
    expect(screen.getByRole('heading', { name: 'Order recorded' })).toBeVisible();
    expect(screen.getByText('Studio headphones (2), Pocket notebook (1)')).toBeVisible();
  });
  it('rejects an overdrawn transfer, then updates both local balances', async () => {
    const user = userEvent.setup();
    render(<FinanceBlock config={config<FinanceConfig>('finance-transfer')} />);
    await user.type(screen.getByRole('spinbutton', { name: 'Amount (USD)' }), '9000');
    await user.click(screen.getByRole('button', { name: 'Review transfer' }));
    expect(screen.getByText('Amount exceeds the available balance.')).toBeVisible();
    await user.clear(screen.getByRole('spinbutton', { name: 'Amount (USD)' }));
    await user.type(screen.getByRole('spinbutton', { name: 'Amount (USD)' }), '100');
    await user.click(screen.getByRole('button', { name: 'Review transfer' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirm' }));
    expect(screen.getByRole('combobox', { name: 'From account' })).toHaveTextContent('$8,300.00');
    expect(screen.getByRole('status')).toHaveTextContent('Transfer recorded');
    await user.click(screen.getByRole('combobox', { name: 'From account' }));
    expect(screen.getByRole('option', { name: 'Reserve account · $12,700.00' })).toBeVisible();
  });
  it('enables reconciliation only after all entries have been matched', async () => {
    const user = userEvent.setup();
    render(<FinanceBlock config={config<FinanceConfig>('finance-reconcile')} />);
    const complete = screen.getByRole('button', { name: 'Complete reconciliation' });
    expect(complete).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: 'Match Client payment r1' }));
    await user.click(screen.getByRole('checkbox', { name: 'Match Office supplies r3' }));
    expect(complete).toBeEnabled();
    await user.click(complete);
    expect(screen.getByRole('status')).toHaveTextContent('Statement reconciled');
  });
  it('tracks notification dirty state and discards unsaved changes', async () => {
    const user = userEvent.setup();
    render(<SettingsBlock config={config<SettingsConfig>('settings-notifications')} />);
    const toggle = screen.getByRole('switch', { name: 'Mentions email' });
    expect(toggle).toBeChecked();
    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Discard' }));
    expect(toggle).toBeChecked();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });
  it('requires a matching workspace name before changing the lifecycle state', async () => {
    const user = userEvent.setup();
    render(<SettingsBlock config={config<SettingsConfig>('settings-danger')} />);
    expect(screen.getByRole('button', { name: 'Delete workspace' })).toBeDisabled();
    await user.type(screen.getByLabelText('Workspace name'), 'Northstar Studio');
    await user.click(screen.getByRole('button', { name: 'Delete workspace' }));
    expect(screen.getByRole('heading', { name: 'Workspace deleted' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Restore workspace' }));
    expect(screen.getByLabelText('Workspace name')).toHaveValue('');
  });
  it('creates a searchable capture through a validated dialog', async () => {
    const user = userEvent.setup();
    render(<MobileBlock config={config<MobileConfig>('mobile-capture')} />);
    await user.click(screen.getByRole('button', { name: 'Add item' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Create' }));
    expect(screen.getByText('Title is required.')).toBeVisible();
    await user.type(screen.getByRole('textbox', { name: 'Title' }), 'October research');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Create' }));
    await user.type(screen.getByRole('textbox', { name: 'Search captures' }), 'October');
    expect(screen.getByRole('button', { name: /October research/ })).toBeVisible();
    expect(screen.queryByText('Workshop idea')).not.toBeInTheDocument();
  });
  it('runs, pauses, and cleans up the reading-session timer', () => {
    vi.useFakeTimers();
    const { unmount } = render(<MobileBlock config={config<MobileConfig>('mobile-player')} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start reading' }));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('00:02')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Pause reading' }));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('00:02')).toBeVisible();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('navigates to an empty agenda day and schedules an event on that day', async () => {
    const user = userEvent.setup();
    render(<SchedulingBlock config={config<ScheduleConfig>('scheduling-agenda')} />);
    await user.click(screen.getByRole('button', { name: 'Next day' }));
    expect(screen.getByRole('heading', { name: 'No events scheduled' })).toBeVisible();
    await user.click(screen.getAllByRole('button', { name: 'Add event' })[0]);
    await user.type(screen.getByRole('textbox', { name: 'Event title' }), 'Prototype review');
    fireEvent.change(screen.getByLabelText(/^Start time/), { target: { value: '11:00' } });
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Add event' }));
    expect(screen.getByText('Prototype review')).toBeVisible();
    expect(screen.getByText('11:00')).toBeVisible();
  });
});

describe('documentation and template workflows', () => {
  it('pages metadata and mounts only the selected block, then presents a clear empty result', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter>
        <BlocksPage />
      </MemoryRouter>,
    );
    await screen.findByRole('textbox', { name: 'Email address' }, { timeout: 10000 });
    expect(screen.getAllByRole('button', { name: /^Preview / })).toHaveLength(12);
    expect(container.querySelectorAll('[data-block]')).toHaveLength(1);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Blocks category' }), 'forms');
    await screen.findByRole('heading', { name: 'Contact the team' }, { timeout: 10000 });
    expect(container.querySelectorAll('[data-block]')).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /^Preview / })).toHaveLength(10);
    await user.type(screen.getByRole('textbox', { name: 'Search blocks' }), 'unfindable-workflow');
    expect(screen.getByRole('heading', { name: 'No blocks found' })).toBeVisible();
    expect(container.querySelectorAll('[data-block]')).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await screen.findByRole('textbox', { name: 'Email address' }, { timeout: 10000 });
  });
  it('honors a deep link, switches width, and exposes complete code without retaining the preview tree', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter initialEntries={['/blocks?category=finance&item=finance-invoice&width=mobile']}>
        <BlocksPage />
      </MemoryRouter>,
    );
    await screen.findByRole('spinbutton', { name: 'Product design quantity' });
    expect(screen.getByLabelText('Mobile preview')).toHaveAttribute('data-state', 'on');
    expect(container.querySelector('.composition-preview')).toHaveAttribute('data-width', 'mobile');
    await user.click(screen.getByLabelText('Tablet preview'));
    expect(container.querySelector('.composition-preview')).toHaveAttribute('data-width', 'tablet');
    await user.click(screen.getByRole('tab', { name: 'Code' }));
    expect(await screen.findByLabelText('Invoice builder source')).toHaveTextContent(
      "import '@plain/ui/styles.css'",
    );
    expect(container.querySelectorAll('[data-block]')).toHaveLength(0);
  });
  it('opens, copies, and downloads the actual selected source', async () => {
    const user = userEvent.setup();
    const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const createUrl = vi.fn(() => 'blob:composition-source');
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
    const downloaded: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloaded.push(this.download);
    });
    render(
      <MemoryRouter>
        <BlocksPage />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: 'Open source' }));
    const dialog = screen.getByRole('dialog');
    expect(await within(dialog).findByLabelText('Password sign-in full source')).toHaveTextContent(
      'export const config: AuthenticationConfig',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Copy source' }));
    await waitFor(() => expect(write).toHaveBeenCalledWith(sourceFor(getBlock('auth-password')!)));
    await user.click(within(dialog).getByRole('button', { name: 'Download source' }));
    expect(createUrl).toHaveBeenCalledWith(expect.any(Blob));
    expect(downloaded).toEqual(['auth-password.tsx']);
  });
  it('renders only a template’s active route and retains created records across navigation', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TemplateRenderer config={getTemplate('web-apps-project-space')!.config} />,
    );
    await screen.findByRole('heading', { name: 'Atlas board' });
    expect(container.querySelectorAll('[data-block]')).toHaveLength(3);
    expect(container.querySelector('main')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'New project' }));
    await user.type(screen.getByRole('textbox', { name: 'Project name' }), 'October launch');
    await user.type(screen.getByRole('textbox', { name: 'Owner' }), 'Avery');
    fireEvent.change(screen.getByLabelText(/^Target date/), { target: { value: '2026-10-15' } });
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Create' }));
    expect(screen.getByRole('button', { name: /October launch/ })).toBeVisible();
    const navigation = screen.getByRole('navigation', { name: 'Atlas destinations' });
    await user.click(within(navigation).getByRole('button', { name: 'Files' }));
    await screen.findByRole('heading', { name: 'Recent documents' });
    await waitFor(() => expect(container.querySelectorAll('[data-block]')).toHaveLength(2));
    await user.click(within(navigation).getByRole('button', { name: 'Board' }));
    expect(screen.getByRole('button', { name: /October launch/ })).toBeVisible();
  });
  it('shows twelve mobile templates with one selected application and navigable destinations', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter initialEntries={['/templates?category=mobile-apps']}>
        <TemplatesPage />
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { name: 'Small steps' });
    expect(screen.getAllByRole('button', { name: /^Preview / })).toHaveLength(12);
    expect(container.querySelectorAll('[data-template]')).toHaveLength(1);
    const navigations = screen.getAllByRole('navigation', { name: 'Daylight destinations' });
    await user.click(
      within(navigations[navigations.length - 1]).getByRole('button', {
        name: 'Activity',
      }),
    );
    await screen.findByRole('heading', { name: 'Today’s activity' });
    expect(container.querySelectorAll('[data-block]')).toHaveLength(1);
  });
});
