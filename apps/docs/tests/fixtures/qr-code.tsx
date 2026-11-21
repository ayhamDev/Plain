import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
  Field,
  H1,
  PlainProvider,
  QRCode,
  Textarea,
  tokensToStyle,
  type QRCodeErrorCorrectionLevel,
  type QRCodeModuleShape,
  type QRCodeFinderShape,
} from '@plain/ui';
import '@plain/ui/styles.css';

const params = new URLSearchParams(location.search);
const logo =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="#111827"/><path d="M14 36V12h12a8 8 0 0 1 0 16h-6v8zm6-14h6a2 2 0 0 0 0-4h-6z" fill="white"/></svg>',
  );
function Fixture() {
  const [value, setValue] = React.useState(
    params.get('value') ?? 'https://github.com/ayhamDev/Plain',
  );
  const [errors, setErrors] = React.useState(0);
  const error = React.useCallback(() => setErrors((count) => count + 1), []);
  return (
    <main style={{ padding: 24, maxWidth: 640, display: 'grid', gap: 24, minWidth: 0 }}>
      <H1 size="xl">QR code states</H1>
      <Field label="Encoded content">
        <Textarea rows={2} value={value} onChange={(event) => setValue(event.target.value)} />
      </Field>
      <QRCode
        value={value}
        label="Project QR code"
        size={Number(params.get('size') ?? 240)}
        level={(params.get('level') ?? undefined) as QRCodeErrorCorrectionLevel | undefined}
        shape={params.get('shape') === 'circle' ? 'circle' : 'square'}
        moduleShape={(params.get('modules') ?? undefined) as QRCodeModuleShape | undefined}
        moduleScale={params.has('scale') ? Number(params.get('scale')) : undefined}
        finderShape={(params.get('finders') ?? undefined) as QRCodeFinderShape | undefined}
        finderCenterShape={(params.get('centers') ?? undefined) as QRCodeFinderShape | undefined}
        finderColor={params.get('finderColor') ?? undefined}
        circlePattern={!params.has('noPattern')}
        gradient={
          params.has('gradient')
            ? {
                type: params.get('gradient') === 'radial' ? 'radial' : 'linear',
                rotation: 45,
                stops: [
                  { offset: 0, color: '#111827' },
                  { offset: 1, color: '#3730a3' },
                ],
              }
            : undefined
        }
        logo={
          params.has('logo')
            ? {
                src: logo,
                size: params.has('logoSize') ? Number(params.get('logoSize')) : undefined,
              }
            : undefined
        }
        qrVersion={params.has('version') ? Number(params.get('version')) : undefined}
        maskPattern={params.has('mask') ? Number(params.get('mask')) : undefined}
        renderModule={params.has('customRender') ? (_module, element) => element : undefined}
        renderFinder={params.has('customRender') ? (_finder, element) => element : undefined}
        animation={
          params.has('static')
            ? false
            : {
                preset: params.get('animation') === 'fade' ? 'fade' : 'reveal',
                duration: Number(params.get('duration') ?? 400),
                delay: Number(params.get('delay') ?? 0),
              }
        }
        margin={Number(params.get('margin') ?? 4)}
        unstyled={params.has('unstyled')}
        style={
          params.has('custom')
            ? tokensToStyle({ 'qr-code.foreground': '#123456', 'qr-code.background': '#ffffff' })
            : undefined
        }
        onEncodingError={error}
      />
      <output aria-label="Encoding errors">{errors}</output>
    </main>
  );
}
const root = createRoot(document.getElementById('root')!);
root.render(
  <PlainProvider
    persist={false}
    dir={params.get('dir') === 'rtl' ? 'rtl' : 'ltr'}
    theme={{
      mode: params.get('theme') === 'dark' ? 'dark' : 'light',
      motion:
        params.get('motion') === 'none'
          ? 'none'
          : params.get('motion') === 'reduced'
            ? 'reduced'
            : 'system',
    }}
  >
    <Fixture />
  </PlainProvider>,
);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
