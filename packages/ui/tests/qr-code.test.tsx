import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { QRCode } from '../src/ui/qr-code';
import { StyleProvider } from '../src/ui/styling';
import { tokensToStyle } from '../src/ui/token-contract';
import { LanguageProvider } from '../src/ui/i18n';
import { MotionPolicyProvider } from '../src/ui/motion-policy';

describe('QRCode', () => {
  it('animates by default, accepts timing overrides and can disable animation', () => {
    const { rerender } = render(<QRCode value="Motion" />);
    expect(screen.getByRole('img')).toHaveAttribute('data-animation', 'draw');
    rerender(<QRCode value="Motion" animation={{ preset: 'draw', duration: 700, delay: 80 }} />);
    expect(screen.getByRole('img')).toHaveAttribute('data-animation', 'draw');
    expect(
      (screen.getByRole('img') as unknown as SVGElement).style.getPropertyValue(
        '--ui-qr-code-duration',
      ),
    ).toBe('700ms');
    for (const preset of ['assemble', 'scan', 'reveal', 'fade'] as const) {
      rerender(<QRCode value="Motion" animation={{ preset }} />);
      expect(screen.getByRole('img')).toHaveAttribute('data-animation', 'draw');
    }
    rerender(<QRCode value="Motion" animation={{ duration: 0 }} />);
    expect(screen.getByRole('img')).toHaveAttribute('data-animation', 'none');
    rerender(<QRCode value="Motion" animation={false} />);
    expect(screen.getByRole('img')).toHaveAttribute('data-animation', 'none');
  });
  it.each(['none', 'reduced'] as const)('honors provider motion policy %s', (policy) => {
    render(
      <MotionPolicyProvider policy={policy}>
        <QRCode value="Motion" />
      </MotionPolicyProvider>,
    );
    expect(screen.getByRole('img')).toHaveAttribute('data-animation', 'none');
    expect(screen.getByRole('img').querySelector('mask')).toBeNull();
  });
  it('integrates the circular dot field without changing the encoded matrix', () => {
    const { rerender } = render(<QRCode value="Round code" moduleShape="dots" moduleScale={0.9} />);
    const matrix = screen
      .getByRole('img')
      .querySelector('[data-slot="foreground"]')!
      .getAttribute('d');
    const functions = screen
      .getByRole('img')
      .querySelector('[data-slot="function"]')!
      .getAttribute('d');
    rerender(<QRCode value="Round code" shape="circle" />);
    const code = screen.getByRole('img');
    expect(code).toHaveAttribute('data-circle-pattern', 'integrated');
    expect(code).toHaveAttribute('data-finder-shape', 'dots');
    expect(code.querySelector('[data-slot="foreground"]')).toHaveAttribute('d', matrix);
    expect(code.querySelector('[data-slot="function"]')).toHaveAttribute('d', functions);
    expect(code.querySelectorAll('[data-slot="pattern"] path').length).toBeLessThan(20);
    const pattern = code.querySelector('[data-slot="circle"]')!.getAttribute('d');
    rerender(<QRCode value="Round code" shape="circle" size={320} />);
    expect(code.querySelector('[data-slot="circle"]')).toHaveAttribute('d', pattern);
  });
  it.each(['separated', false] as const)(
    'preserves a square quiet zone with pattern %s',
    (circlePattern) => {
      render(<QRCode value="Round code" shape="circle" circlePattern={circlePattern} />);
      const code = screen.getByRole('img');
      expect(code).toHaveAttribute('data-shape', 'circle');
      expect(code).toHaveAttribute('data-module-shape', 'dots');
      const paper = code.querySelector('[data-slot="background"]')!;
      expect(paper.tagName).toBe('circle');
      const origin = Number(
        code
          .querySelector('[data-slot="foreground"]')!
          .getAttribute('transform')!
          .match(/\d+(\.\d+)?/)![0],
      );
      const extent = Number(code.getAttribute('viewBox')!.split(' ')[2]);
      const matrix = extent - origin * 2;
      expect((matrix + 8) * Math.SQRT2).toBeLessThanOrEqual(extent);
      if (circlePattern)
        expect(code.querySelector('[data-slot="circle"]')).toHaveAttribute(
          'd',
          expect.stringContaining('M'),
        );
      else expect(code.querySelector('[data-slot="circle"]')).toBeNull();
    },
  );
  it('supports dotted finders independently and retains explicit circular styling overrides', () => {
    const { rerender } = render(
      <QRCode value="Round code" finderShape="dots" finderColor="#123456" />,
    );
    const code = screen.getByRole('img');
    expect(code).toHaveAttribute('data-finder-shape', 'dots');
    expect(code.querySelector('[data-slot="finder-frame"]')).toHaveAttribute('fill', '#123456');
    rerender(
      <QRCode
        value="Round code"
        shape="circle"
        finderShape="rounded"
        moduleScale={1}
        circlePattern="separated"
      />,
    );
    expect(code).toHaveAttribute('data-finder-shape', 'rounded');
    expect(code).toHaveAttribute('data-circle-pattern', 'separated');
  });
  it('supports independent finder styling, gradients and logo cutouts with strong default correction', () => {
    render(
      <QRCode
        value="Brand"
        finderShape="rounded"
        finderCenterShape="circle"
        finderColor="#123456"
        finderCenterColor="#234567"
        gradient={{
          stops: [
            { offset: 0, color: '#111111' },
            { offset: 1, color: '#333333' },
          ],
        }}
        logo={{ src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>' }}
      />,
    );
    const code = screen.getByRole('img');
    expect(code).toHaveAttribute('data-level', 'H');
    expect(code.querySelectorAll('[data-slot="finder"]')).toHaveLength(3);
    expect(code.querySelector('[data-slot="finder-frame"]')).toHaveAttribute('fill', '#123456');
    expect(code.querySelector('[data-slot="finder-center"]')).toHaveAttribute('fill', '#234567');
    expect(code.querySelector('linearGradient')?.querySelectorAll('stop')).toHaveLength(2);
    expect(code.querySelector('[data-slot="logo"]')).toHaveAttribute('mask');
    expect(code.querySelector('[data-slot="logo-image"]')).toHaveAttribute('clip-path');
  });
  it('keeps multiple SVG definition IDs unique and preserves the native SVG version attribute', () => {
    render(
      <>
        <QRCode
          value="First"
          version="1.1"
          qrVersion={7}
          gradient={{ stops: [{ offset: 0, color: 'black' }] }}
        />
        <QRCode value="Second" gradient={{ stops: [{ offset: 0, color: 'black' }] }} />
      </>,
    );
    const [first, second] = screen.getAllByRole('img');
    expect(first).toHaveAttribute('viewBox', '0 0 53 53');
    expect(first).toHaveAttribute('version', '1.1');
    expect(first.querySelector('linearGradient')!.id).not.toBe(
      second.querySelector('linearGradient')!.id,
    );
    expect(first).not.toHaveAttribute('qrVersion');
  });
  it('supports advanced module/finder rendering without one DOM node per module by default', () => {
    const module = vi.fn((_module, element) => element),
      finder = vi.fn((_finder, element) => element);
    const { rerender } = render(<QRCode value="Custom" />);
    expect(
      screen.getByRole('img').querySelectorAll('[data-slot="pattern"] path').length,
    ).toBeLessThan(20);
    rerender(<QRCode value="Custom" renderModule={module} renderFinder={finder} />);
    expect(module).toHaveBeenCalledWith(
      expect.objectContaining({ x: expect.any(Number), isFunction: expect.any(Boolean) }),
      expect.anything(),
    );
    expect(finder).toHaveBeenCalledTimes(3);
    expect(screen.getByRole('img').querySelector('clipPath')).not.toBeNull();
  });

  it('normalizes invalid geometry options and reports a version too small for the content', () => {
    const error = vi.fn();
    const { rerender } = render(
      <QRCode
        value="https://github.com/ayhamDev/Plain"
        size={NaN}
        margin={Infinity}
        moduleScale={-1}
        qrVersion={99}
        maskPattern={9}
        circlePattern={false}
      />,
    );
    expect(screen.getByRole('img')).toHaveAttribute('width', '192');
    expect(screen.getByRole('img')).toHaveAttribute('data-state', 'ready');
    expect(screen.getByRole('img').querySelector('[data-slot="circle"]')).toBeNull();
    rerender(
      <QRCode
        value="https://github.com/ayhamDev/Plain"
        qrVersion={1}
        level="H"
        onEncodingError={error}
      />,
    );
    expect(screen.getByRole('img')).toHaveAttribute('data-state', 'error');
    expect(error).toHaveBeenCalledOnce();
    rerender(<QRCode value="https://github.com/ayhamDev/Plain" qrVersion={7} level="H" />);
    expect(screen.getByRole('img')).toHaveAttribute('data-state', 'ready');
  });
  it('keeps SVG refs, native props, ARIA and handlers on the generated image', () => {
    const ref = React.createRef<SVGSVGElement>();
    const click = vi.fn();
    render(
      <>
        <p id="hint">Open the project documentation.</p>
        <QRCode
          ref={ref}
          id="project-code"
          value="https://github.com/ayhamDev/Plain"
          label="Project code"
          aria-label="Scan project link"
          aria-describedby="hint"
          onClick={click}
          className="consumer-code"
          style={{ opacity: 0.95 }}
        />
      </>,
    );
    const image = screen.getByRole('img', { name: 'Scan project link' });
    expect(ref.current).toBe(image);
    expect(image).toHaveAttribute('id', 'project-code');
    expect(image).toHaveClass('consumer-code');
    expect(image).toHaveStyle({ opacity: '0.95' });
    expect(image).toHaveAccessibleDescription(/Open the project documentation/);
    expect(image).toHaveAccessibleDescription(/Scan this QR code/);
    expect(image).toHaveAttribute('data-state', 'ready');
    fireEvent.click(image);
    expect(click).toHaveBeenCalledOnce();
    expect(image.querySelector('path')).toHaveAttribute('d', expect.stringContaining('M'));
    expect(image).not.toHaveAttribute('value');
  });

  it.each(['L', 'M', 'Q', 'H'] as const)(
    'encodes Unicode with error correction %s and preserves a four-module margin',
    (level) => {
      render(<QRCode value="مرحبا بكم في P.UI 👋" level={level} margin={0} size={240} />);
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('data-state', 'ready');
      expect(image).toHaveAttribute('data-level', level);
      expect(image).toHaveAttribute('width', '240');
      expect(image.querySelector('[data-slot="foreground"]')).toHaveAttribute(
        'transform',
        'translate(4 4)',
      );
      const extent = Number(image.getAttribute('viewBox')!.split(' ')[2]);
      expect((extent - 8 - 21) % 4).toBe(0);
    },
  );

  it('updates the pattern when the value changes and allows a larger quiet zone', () => {
    const { rerender } = render(<QRCode value="first value" />);
    const first = screen
      .getByRole('img')
      .querySelector('[data-slot="foreground"]')!
      .getAttribute('d');
    rerender(<QRCode value="second value" margin={8.9} />);
    expect(
      screen.getByRole('img').querySelector('[data-slot="foreground"]')!.getAttribute('d'),
    ).not.toBe(first);
    expect(screen.getByRole('img').querySelector('[data-slot="foreground"]')).toHaveAttribute(
      'transform',
      'translate(8 8)',
    );
  });

  it('represents empty content without a misleading code or error callback', () => {
    const error = vi.fn();
    render(<QRCode value="" onEncodingError={error} />);
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('data-state', 'empty');
    expect(image.querySelector('path')).toBeNull();
    expect(image).toHaveTextContent('No content');
    expect(image).toHaveAccessibleDescription('Enter a value to generate a QR code.');
    expect(error).not.toHaveBeenCalled();
  });

  it('reports capacity errors, retains error descriptions and recovers after correction', async () => {
    const error = vi.fn();
    const oversized = 'content'.repeat(1000);
    const { rerender } = render(
      <QRCode value={oversized} description="Project details." onEncodingError={error} />,
    );
    await waitFor(() => expect(error).toHaveBeenCalledOnce());
    expect(error).toHaveBeenCalledWith(expect.any(Error));
    expect(screen.getByRole('img')).toHaveAttribute('data-state', 'error');
    expect(screen.getByRole('img').querySelector('path')).toBeNull();
    expect(screen.getByRole('img')).toHaveAccessibleDescription(
      /Project details.*could not be encoded/,
    );
    rerender(<QRCode value={oversized} size={240} onEncodingError={error} />);
    expect(error).toHaveBeenCalledOnce();
    rerender(<QRCode value="corrected" onEncodingError={error} />);
    expect(screen.getByRole('img')).toHaveAttribute('data-state', 'ready');
    expect(screen.getByRole('img').querySelector('path')).not.toBeNull();
  });

  it('does not repeat an encoding error when an inline callback updates parent state', () => {
    function Consumer() {
      const [errors, setErrors] = React.useState(0);
      const [size, setSize] = React.useState(192);
      return (
        <>
          <QRCode
            value={'content'.repeat(1000)}
            size={size}
            onEncodingError={() => setErrors((count) => count + 1)}
          />
          <output aria-label="Encoding errors">{errors}</output>
          <button onClick={() => setSize(240)}>Resize code</button>
        </>
      );
    }
    render(<Consumer />);
    expect(screen.getByLabelText('Encoding errors')).toHaveTextContent('1');
    fireEvent.click(screen.getByRole('button', { name: 'Resize code' }));
    expect(screen.getByLabelText('Encoding errors')).toHaveTextContent('1');
    expect(screen.getByRole('img')).toHaveAttribute('width', '240');
  });

  it('supports color props, local tokens, typed slots and unstyled geometry', () => {
    const { rerender } = render(
      <StyleProvider styles={{ 'qr-code.foreground': 'brand-ink' }}>
        <QRCode
          value="Local"
          foreground="#123456"
          background="#ffffff"
          style={tokensToStyle({ 'qr-code.background': '#ffffee' })}
        />
      </StyleProvider>,
    );
    expect(screen.getByRole('img').querySelector('.brand-ink')).toHaveAttribute('fill', '#123456');
    expect(screen.getByRole('img').querySelector('rect')).toHaveAttribute('fill', '#ffffff');
    expect(
      (screen.getByRole('img') as unknown as SVGElement).style.getPropertyValue(
        '--ui-qr-code-background',
      ),
    ).toBe('#ffffee');
    rerender(<QRCode value="Local" unstyled />);
    expect(screen.getByRole('img').classList).toHaveLength(0);
    expect(screen.getByRole('img').querySelector('path')).toHaveAttribute(
      'transform',
      'translate(4 4)',
    );
  });

  it('localizes status text and supports SSR without a DOM image or remote service', () => {
    render(
      <LanguageProvider locale="ar">
        <QRCode value="" />
      </LanguageProvider>,
    );
    expect(screen.getByRole('img', { name: 'رمز QR' })).toHaveTextContent('لا يوجد محتوى');
    const markup = renderToString(<QRCode value="https://github.com/ayhamDev/Plain" />);
    expect(markup).toContain('<svg');
    expect(markup).toContain('<path');
    expect(markup).not.toContain('<image');
    expect(markup).not.toContain('<canvas');
  });
});
