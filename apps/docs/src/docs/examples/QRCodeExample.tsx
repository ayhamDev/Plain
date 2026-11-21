import * as React from 'react';
import {
  Button,
  Code,
  ColorPicker,
  Field,
  Label,
  QRCode,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from '@plain/ui';

const demoLogo =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="#111827"/><path d="M14 36V12h12a8 8 0 0 1 0 16h-6v8zm6-14h6a2 2 0 0 0 0-4h-6z" fill="white"/></svg>',
  );

export default function QRCodeExample() {
  const [value, setValue] = React.useState('https://github.com/ayhamDev/Plain');
  const [error, setError] = React.useState<Error | null>(null);
  const ref = React.useRef<SVGSVGElement>(null);
  const [preset, setPreset] = React.useState('classic');
  const [ink, setInk] = React.useState('#000000');
  const [withLogo, setWithLogo] = React.useState(false);
  const [withGradient, setWithGradient] = React.useState(false);
  const [animate, setAnimate] = React.useState(true);
  const [motion, setMotion] = React.useState<'assemble' | 'scan' | 'fade'>('assemble');
  const [replay, setReplay] = React.useState(0);
  const styleId = React.useId();
  const motionId = React.useId();
  const download = () => {
    const source = ref.current;
    if (!source || source.dataset.state !== 'ready') return;
    const clone = source.cloneNode(true) as SVGSVGElement;
    const originals = source.querySelectorAll<SVGElement>('[fill]');
    clone.querySelectorAll('[fill]').forEach((node, index) => {
      if (!node.getAttribute('fill')?.startsWith('url('))
        node.setAttribute('fill', getComputedStyle(originals[index]).fill);
    });
    const stops = source.querySelectorAll<SVGElement>('stop');
    clone
      .querySelectorAll('stop')
      .forEach((node, index) =>
        node.setAttribute('stop-color', getComputedStyle(stops[index]).stopColor),
      );
    clone.setAttribute('data-animation', 'none');
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
    <div style={{ display: 'grid', gap: 24, width: '100%', maxWidth: 560, minWidth: 0 }}>
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,160px),1fr))',
          gap: 16,
          minWidth: 0,
        }}
      >
        <div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
          <Label htmlFor={styleId}>QR style</Label>
          <Select value={preset} onValueChange={setPreset}>
            <SelectTrigger id={styleId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                ['classic', 'Classic'],
                ['rounded', 'Rounded'],
                ['dots', 'Dotted'],
                ['circle', 'Circular'],
              ].map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Field label="Ink color">
          <ColorPicker
            value={ink}
            onValueChange={setInk}
            swatches={['#000000', '#111827', '#1e3a8a', '#064e3b', '#7f1d1d']}
          />
        </Field>
        <Field label="Center logo">
          <Switch checked={withLogo} onCheckedChange={setWithLogo} />
        </Field>
        <Field label="Gradient">
          <Switch checked={withGradient} onCheckedChange={setWithGradient} />
        </Field>
        <Field label="Animation">
          <Switch checked={animate} onCheckedChange={setAnimate} />
        </Field>
        <div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
          <Label htmlFor={motionId}>Animation style</Label>
          <Select
            value={motion}
            onValueChange={(value) => setMotion(value as typeof motion)}
            disabled={!animate}
          >
            <SelectTrigger id={motionId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="assemble">Assemble</SelectItem>
              <SelectItem value="scan">Soft scan</SelectItem>
              <SelectItem value="fade">Fade</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div style={{ display: 'grid', justifyItems: 'center', gap: 16, minWidth: 0 }}>
        <QRCode
          key={replay}
          ref={ref}
          value={value}
          label="QR code for the entered content"
          size={preset === 'circle' ? 256 : 192}
          shape={preset === 'circle' ? 'circle' : 'square'}
          moduleShape={preset === 'rounded' ? 'rounded' : preset === 'dots' ? 'dots' : undefined}
          finderShape={preset === 'rounded' || preset === 'dots' ? 'rounded' : undefined}
          foreground={ink}
          gradient={
            withGradient
              ? {
                  rotation: 45,
                  stops: [
                    { offset: 0, color: ink },
                    { offset: 1, color: '#3730a3' },
                  ],
                }
              : undefined
          }
          logo={withLogo ? { src: demoLogo } : undefined}
          animation={animate ? { preset: motion } : false}
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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="outline"
            onClick={() => setReplay((value) => value + 1)}
            disabled={!value || !!error || !animate}
          >
            Replay animation
          </Button>
          <Button variant="outline" onClick={download} disabled={!value || !!error}>
            Download SVG
          </Button>
        </div>
      </div>
    </div>
  );
}
