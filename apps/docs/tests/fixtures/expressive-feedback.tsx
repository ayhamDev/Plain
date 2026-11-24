import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { PlainProvider, ThemeScope, Button } from '@plain/ui';
import { Progress } from '@plain/ui/progress';
import { CircularProgress } from '@plain/ui/circular-progress';
import { LoadingIndicator } from '@plain/ui/loading-indicator';
import {
  Shape,
  ShapedButton,
  ShapedContainer,
  ShapedImage,
  ShapedBadge,
  shapeNames,
  type ShapeName,
} from '@plain/ui/shape';
import '@plain/ui/styles.css';

const params = new URLSearchParams(location.search);
const rtl = params.get('dir') === 'rtl';
const label = rtl
  ? 'رفع ملفات المشروع ومزامنة مساحة العمل المشتركة'
  : 'Upload project files and sync the shared workspace';
const image =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#c1cac4"/><circle cx="70" cy="25" r="12" fill="#7a8e81"/><path d="M0 100L40 25L100 100Z" fill="#52685b"/></svg>',
  );
function Gallery() {
  const [value, setValue] = React.useState(64);
  const [shape, setShape] = React.useState<ShapeName>('softBurst');
  const [playing, setPlaying] = React.useState(true);
  const [count, setCount] = React.useState(0);
  return (
    <main
      style={{
        width: '100%',
        maxWidth: 960,
        margin: '0 auto',
        padding: 24,
        boxSizing: 'border-box',
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>
        {rtl ? 'التقدم والأشكال' : 'Progress and shapes'}
      </h1>
      <nav
        aria-label="Preview controls"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}
      >
        <Button onClick={() => setValue(0)}>Empty</Button>
        <Button onClick={() => setValue(64)}>Working</Button>
        <Button onClick={() => setValue(100)}>Complete</Button>
        <Button
          onClick={() => setShape((current) => (current === 'softBurst' ? 'flower' : 'softBurst'))}
        >
          Change shape
        </Button>
        <Button onClick={() => setPlaying((current) => !current)}>
          {playing ? 'Pause' : 'Resume'}
        </Button>
      </nav>
      <section
        aria-label="Linear indicators"
        style={{ display: 'grid', gap: 24, marginBottom: 40 }}
      >
        <h2 style={{ fontSize: 18 }}>{label}</h2>
        <Progress
          data-testid="linear-standard"
          value={value}
          gap={6}
          size="md"
          aria-label={label}
        />
        <Progress
          data-testid="linear-wavy"
          value={value}
          variant="wavy"
          amplitude={3}
          wavelength={24}
          gap={6}
          aria-label={label}
        />
        <Progress data-testid="linear-ongoing" value={null} aria-label="Connecting" />
        <Progress data-testid="wave-ongoing" value={null} variant="wavy" aria-label="Processing" />
        <Progress
          aria-label="Storage"
          segments={[
            { id: 'a', label: rtl ? 'الصور' : 'Images', value: 24 },
            { id: 'b', label: rtl ? 'المستندات' : 'Documents', value: 32 },
          ]}
        />
      </section>
      <section
        aria-label="Circular indicators"
        style={{
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 40,
        }}
      >
        <CircularProgress
          data-testid="ring-standard"
          value={value}
          size="lg"
          gap={6}
          aria-label={label}
        />
        <CircularProgress
          data-testid="ring-wavy"
          variant="wavy"
          value={value}
          size="xl"
          aria-label={label}
        >
          {new Intl.NumberFormat(rtl ? 'ar-EG' : 'en', { style: 'percent' }).format(value / 100)}
        </CircularProgress>
        <CircularProgress value={null} variant="wavy" size="lg" aria-label="Connecting" />
      </section>
      <section
        aria-label="Loading indicators"
        style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 40 }}
      >
        <LoadingIndicator data-testid="loader" playing={playing} />
        <LoadingIndicator variant="contained" size="lg" playing={playing} label={label} />
        <ThemeScope
          tokens={{
            'progress.indicator': '#315a86',
            'progress.track': '#dee8f3',
            'loading-indicator.color': '#315a86',
          }}
        >
          <LoadingIndicator data-testid="scoped-loader" playing={playing} label="Scoped loading" />
          <CircularProgress data-testid="scoped-ring" value={value} aria-label="Scoped progress" />
        </ThemeScope>
      </section>
      <section
        aria-label="Shaped components"
        style={{
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 40,
        }}
      >
        <Shape data-testid="shape" shape={shape} size={96} aria-label="Featured" />
        <ShapedContainer data-testid="container" shape={shape} size={96}>
          P.
        </ShapedContainer>
        <ShapedImage
          data-testid="image"
          shape={shape}
          src={image}
          alt={rtl ? 'رسم منظر طبيعي' : 'Landscape illustration'}
          size={96}
        />
        <ShapedButton
          data-testid="shaped-button"
          shape={shape}
          aria-label={label}
          tooltip={label}
          onClick={() => setCount((current) => current + 1)}
        >
          +
        </ShapedButton>
        <ShapedBadge shape={shape} variant="accent">
          {count}
        </ShapedBadge>
        <output aria-label="Project count">{count}</output>
      </section>
      <section
        aria-label="Shape catalog"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))',
          gap: 24,
        }}
      >
        {shapeNames.map((name) => (
          <div key={name} style={{ display: 'grid', justifyItems: 'center', gap: 8 }}>
            <Shape shape={name} size={40} />
            <span style={{ fontSize: 12, overflowWrap: 'anywhere' }}>{name}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PlainProvider
      persist={false}
      locale={rtl ? 'ar-EG' : 'en'}
      dir={rtl ? 'rtl' : 'ltr'}
      messages={{ 'common.loading': rtl ? 'نجهز مساحة العمل' : 'Preparing workspace' }}
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
      <Gallery />
    </PlainProvider>
  </React.StrictMode>,
);
