import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ts from 'typescript';
import { components } from '../src/docs/catalog';
import { PropPlayground, propPreviews, previewSource } from '../src/docs/previews';
import {
  documentationPath,
  documentationVersion,
  parseDocsVersions,
  versionDestination,
  type DocsVersionManifest,
} from '../src/docs/versioning';

const manifest: DocsVersionManifest = {
  current: '0.2.0',
  versions: [
    {
      version: '0.2.0',
      status: 'current',
      base: '/v/0.2.0/',
      routes: ['/', '/components', '/components/select', '/blocks', '/templates'],
    },
    {
      version: '0.1.0',
      status: 'archived',
      base: '/v/0.1.0/',
      ref: 'a'.repeat(40),
      routes: ['/', '/components', '/components/select', '/docs/rtl'],
    },
  ],
};

describe('documentation version contract', () => {
  it('validates an isolated same-origin manifest', () => {
    expect(parseDocsVersions(manifest)).toEqual(manifest);
    expect(() => parseDocsVersions({ ...manifest, current: '9.0.0' })).toThrow();
    expect(() =>
      parseDocsVersions({ ...manifest, versions: [...manifest.versions, manifest.versions[0]] }),
    ).toThrow();
    for (const override of [
      { base: 'https://example.com/' },
      { base: '//example.com/' },
      { routes: ['/', '//example.com'] },
      { routes: ['/', '/components/../'] },
      { routes: [] },
      { status: 'unknown' },
      { version: 'latest' },
      { version: '0.1.0', status: 'archived', ref: 'main' },
    ])
      expect(() =>
        parseDocsVersions({
          ...manifest,
          versions: [{ ...manifest.versions[0], ...override }, manifest.versions[1]],
        }),
      ).toThrow();
  });

  it('preserves existing deep links and does not invent pages in older releases', () => {
    const archive = manifest.versions[1];
    expect(documentationVersion('/v/0.1.0/components/select')).toBe('0.1.0');
    expect(documentationVersion('/components/select')).toBe('0.2.0');
    expect(documentationPath('/v/0.1.0')).toBe('/');
    expect(
      versionDestination(archive, '/v/0.2.0/components/select/', '?example=position', '#api'),
    ).toBe('/v/0.1.0/components/select?example=position#api');
    expect(versionDestination(archive, '/components/bar-chart', '?example=axes', '#api')).toBe(
      '/v/0.1.0/components',
    );
    expect(versionDestination(archive, '/blocks/auth-password')).toBe('/v/0.1.0/');
    expect(versionDestination(archive, '/docs/rtl')).toBe('/v/0.1.0/docs/rtl');
    expect(versionDestination(manifest.versions[0], '/templates/not-available')).toBe(
      '/v/0.2.0/templates',
    );
  });

  it('retries a failed manifest fetch instead of keeping a rejected cache', async () => {
    vi.resetModules();
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce(new Response(JSON.stringify(manifest)));
    const { loadDocsVersions } = await import('../src/docs/versioning');
    await expect(loadDocsVersions()).rejects.toThrow('Offline');
    await expect(loadDocsVersions()).resolves.toEqual(manifest);
    await expect(loadDocsVersions()).resolves.toEqual(manifest);
    expect(fetch).toHaveBeenCalledTimes(2);
    fetch.mockRestore();
  });
});

describe('typed prop playgrounds', () => {
  it('covers documented controls with real prop values and valid defaults', () => {
    expect(Object.keys(propPreviews).length).toBeGreaterThanOrEqual(50);
    for (const [slug, preview] of Object.entries(propPreviews)) {
      expect(
        components.some((component) => component.slug === slug),
        slug,
      ).toBe(true);
      expect(new Set(preview.controls.map((control) => control.name)).size).toBe(
        preview.controls.length,
      );
      for (const control of preview.controls) {
        expect(preview.defaults[control.name], `${slug}.${control.name}`).not.toBeUndefined();
        if (control.options)
          expect(control.options).toContain(String(preview.defaults[control.name]));
        else if (control.min !== undefined) {
          expect(preview.defaults[control.name]).toBeGreaterThanOrEqual(control.min);
          expect(preview.defaults[control.name]).toBeLessThanOrEqual(control.max!);
        } else expect(typeof preview.defaults[control.name]).toBe('boolean');
      }
    }
  });

  it('shows both Select strategies, their applicability, matching source and reset', async () => {
    const user = userEvent.setup();
    render(<PropPlayground slug="select" />);
    await user.click(screen.getByRole('button', { name: 'Preview properties' }));
    const position = screen.getByRole('combobox', { name: 'position' });
    await user.click(position);
    await user.click(screen.getByRole('option', { name: 'item-aligned' }));
    expect(position).toHaveTextContent('item-aligned');
    expect(screen.getByRole('combobox', { name: 'side' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'align' })).toBeDisabled();
    expect(screen.getByRole('spinbutton', { name: 'sideOffset' })).toBeDisabled();
    await user.click(screen.getByRole('tab', { name: 'Code' }));
    expect(screen.getByLabelText('select.tsx code')).toHaveTextContent('position="item-aligned"');
    await user.click(screen.getByRole('button', { name: 'Reset preview props' }));
    expect(position).toHaveTextContent('popper');
    expect(screen.getByRole('combobox', { name: 'side' })).not.toBeDisabled();
    expect(screen.getByLabelText('select.tsx code')).toHaveTextContent('position="popper"');
  });

  it('typechecks every default, enum option, boolean toggle and numeric boundary as complete copyable TSX', () => {
    const root = process.cwd().replaceAll('\\', '/');
    const virtualRoot = `${root}/tests/__preview_source_contract__/`;
    const sources = new Map<string, string>();
    for (const [slug, preview] of Object.entries(propPreviews)) {
      sources.set(`${virtualRoot}${slug}-default.tsx`, previewSource(preview, preview.defaults));
      for (const control of preview.controls) {
        const values =
          control.options ??
          (control.min === undefined ? [true, false] : [control.min, control.max!]);
        for (const [index, value] of values.entries())
          sources.set(
            `${virtualRoot}${slug}-${control.name}-${index}.tsx`,
            previewSource(preview, { ...preview.defaults, [control.name]: value }),
          );
      }
    }
    sources.set(
      `${virtualRoot}styles.d.ts`,
      "declare module '@plain/ui/styles.css';\ndeclare module '@plain/ui/charts.css';",
    );
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
          : name === '@plain/ui/charts'
            ? { resolvedFileName: `${root}/src/ui/charts.tsx`, extension: ts.Extension.Tsx }
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
      errors.map(
        (diagnostic) =>
          `${diagnostic.file!.fileName.slice(virtualRoot.length)}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`,
      ),
    ).toEqual([]);
  }, 120000);
});
