import * as React from 'react';
import { Button, Code, Field, QRCode, Textarea } from '@plain/ui';

export default function QRCodeExample() {
  const [value, setValue] = React.useState('https://github.com/ayhamDev/Plain');
  const [error, setError] = React.useState<Error | null>(null);
  const ref = React.useRef<SVGSVGElement>(null);
  const download = () => {
    const source = ref.current;
    if (!source || source.dataset.state !== 'ready') return;
    const clone = source.cloneNode(true) as SVGSVGElement;
    const originals = source.querySelectorAll<SVGElement>('[fill]');
    clone.querySelectorAll('[fill]').forEach((node, index) => {
      node.setAttribute('fill', getComputedStyle(originals[index]).fill);
    });
    const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'qr-code.svg';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div style={{ display: 'grid', gap: 24, width: '100%', maxWidth: 440, minWidth: 0 }}>
      <Field
        label="Content to encode"
        error={error ? 'This content is too large to encode. Try a shorter value.' : undefined}
      >
        <Textarea
          rows={2}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
        />
      </Field>
      <div style={{ display: 'grid', justifyItems: 'center', gap: 16, minWidth: 0 }}>
        <QRCode
          ref={ref}
          value={value}
          label="QR code for the entered content"
          onEncodingError={setError}
        />
        <Code
          dir="auto"
          style={{
            maxWidth: '100%',
            overflowWrap: 'anywhere',
            whiteSpace: 'pre-wrap',
            textAlign: 'center',
          }}
        >
          {value || 'Enter content above to create a code.'}
        </Code>
        <Button variant="outline" onClick={download} disabled={!value || !!error}>
          Download SVG
        </Button>
      </div>
    </div>
  );
}
