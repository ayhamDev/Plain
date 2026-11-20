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
} from '@plain/ui';
import '@plain/ui/styles.css';

const params = new URLSearchParams(location.search);
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
        level={(params.get('level') ?? 'M') as QRCodeErrorCorrectionLevel}
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
    theme={{ mode: params.get('theme') === 'dark' ? 'dark' : 'light', motion: 'none' }}
  >
    <Fixture />
  </PlainProvider>,
);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
