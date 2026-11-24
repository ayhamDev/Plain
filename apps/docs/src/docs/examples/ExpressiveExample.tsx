import * as React from 'react';
import { Plus, Check, Heart } from 'lucide-react';
import {
  Progress,
  CircularProgress,
  LoadingIndicator,
  Shape,
  shapeNames,
  ShapedContainer,
  ShapedImage,
  ShapedButton,
  ShapedBadge,
  type ShapeName,
  P,
  Stack,
  Inline,
  Button,
  Slider,
  useTranslation,
} from '@plain/ui';

type State = Record<string, string | number | boolean>;
const illustration =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#e1e4e2"/><circle cx="140" cy="60" r="28" fill="#b5bcb7"/><path d="M-20 200L65 65L150 200M75 200L160 90L230 200" fill="#69796f"/></svg>',
  );

export default function ExpressiveExample({ slug, state = {} }: { slug: string; state?: State }) {
  const [amount, setAmount] = React.useState([64]);
  const [favorite, setFavorite] = React.useState(false);
  const [playing, setPlaying] = React.useState(true);
  const { locale } = useTranslation();
  const value = Number(state.value ?? amount[0]);
  const activePlaying = state.playing === undefined ? playing : !!state.playing;
  const variant = state.variant === 'wavy' ? 'wavy' : 'standard';
  const size = state.size === 'sm' ? 'sm' : state.size === 'lg' ? 'lg' : 'md';
  const shape: ShapeName = shapeNames.find((name) => name === state.shape) ?? 'softBurst';
  if (slug === 'progress')
    return (
      <Stack gap={4} style={{ width: '100%', maxWidth: 480 }}>
        <Stack gap={2}>
          <P size="sm">Project completion</P>
          <Progress
            value={state.indeterminate ? null : value}
            variant={variant}
            size={size}
            gap={Number(state.gap ?? 4)}
            amplitude={Number(state.amplitude ?? 3)}
            wavelength={Number(state.wavelength ?? 24)}
            aria-label="Project completion"
          />
        </Stack>
        <Stack gap={2}>
          <P size="sm">Processing files</P>
          <Progress
            variant="wavy"
            value={state.indeterminate ? null : value}
            gap={Number(state.gap ?? 4)}
            aria-label="Processing files"
          />
        </Stack>
        {state.value === undefined && (
          <Slider
            value={[value]}
            onValueChange={setAmount}
            aria-label="Adjust project completion"
          />
        )}
        <Stack gap={2}>
          <P size="sm">Workspace storage</P>
          <Progress
            size="lg"
            aria-label="Workspace storage"
            showLegend={state.showLegend !== false}
            formatValue={(v) => `${v} GB`}
            segments={[
              { id: 'documents', label: 'Documents', value: 24 },
              { id: 'images', label: 'Images', value: 32 },
              { id: 'video', label: 'Video', value: 18 },
            ]}
          />
        </Stack>
      </Stack>
    );
  if (slug === 'circular-progress')
    return (
      <Stack gap={4} style={{ width: '100%', maxWidth: 400 }}>
        <Inline
          gap={4}
          style={{ alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <CircularProgress
            value={state.indeterminate ? null : value}
            variant={variant}
            size={state.size === 'xl' ? 'xl' : size}
            gap={Number(state.gap ?? 4)}
            thickness={Number(state.thickness ?? 4)}
            amplitude={Number(state.amplitude ?? 2)}
            frequency={Number(state.frequency ?? 10)}
            aria-label="Project completion"
          />
          <CircularProgress value={value} variant="wavy" size="xl" aria-label="Processing files">
            {new Intl.NumberFormat(locale, { style: 'percent' }).format(value / 100)}
          </CircularProgress>
          <CircularProgress value={null} variant="wavy" size="lg" aria-label="Connecting" />
        </Inline>
        {state.value === undefined && (
          <Slider
            value={[value]}
            onValueChange={setAmount}
            aria-label="Adjust project completion"
          />
        )}
      </Stack>
    );
  if (slug === 'loading-indicator')
    return (
      <Stack gap={4} style={{ alignItems: 'center' }}>
        <Inline gap={4} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <LoadingIndicator
            variant={state.variant === 'contained' ? 'contained' : 'default'}
            size={size}
            playing={activePlaying}
            duration={Number(state.duration ?? 4667)}
            startingShape={Number(state.startingShape ?? 0)}
            label="Preparing workspace"
          />
          <LoadingIndicator
            variant="contained"
            size="lg"
            playing={activePlaying}
            label="Syncing files"
          />
        </Inline>
        {state.playing === undefined && (
          <Button variant="ghost" size="sm" onClick={() => setPlaying((current) => !current)}>
            {playing ? 'Pause animation' : 'Resume animation'}
          </Button>
        )}
      </Stack>
    );
  if (slug === 'shaped-components')
    return (
      <Stack gap={4} style={{ alignItems: 'center', width: '100%' }}>
        <Inline
          gap={3}
          style={{ flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}
        >
          <ShapedImage
            src={illustration}
            alt="A quiet mountain landscape"
            shape={shape}
            size={128}
          />
          <ShapedContainer shape={shape} size={128}>
            <Heart size={32} aria-hidden="true" />
          </ShapedContainer>
        </Inline>
        <Inline
          gap={3}
          style={{ flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}
        >
          <ShapedButton
            shape={shape}
            size={size}
            aria-label="Favorite project"
            aria-pressed={favorite}
            tooltip="Favorite project"
            onClick={() => setFavorite((current) => !current)}
          >
            <Heart fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />
          </ShapedButton>
          <ShapedButton
            shape="cookie6"
            size={size}
            variant="secondary"
            aria-label="Add project"
            tooltip="Add project"
            onClick={() => setFavorite(false)}
          >
            <Plus aria-hidden="true" />
          </ShapedButton>
          <ShapedButton
            shape="clover4"
            size={size}
            variant="outline"
            aria-label="Project ready"
            tooltip="Project ready"
          >
            <Check aria-hidden="true" />
          </ShapedButton>
          <ShapedBadge shape={shape} variant="accent">
            3
          </ShapedBadge>
        </Inline>
      </Stack>
    );
  return (
    <Stack gap={4} style={{ alignItems: 'center', width: '100%' }}>
      <Shape
        shape={shape}
        size={Number(state.size ?? 96)}
        morph={state.morph !== false}
        aria-label={shape}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))',
          gap: 24,
          width: '100%',
        }}
      >
        {shapeNames.map((name) => (
          <Stack key={name} gap={1} style={{ alignItems: 'center', minWidth: 0 }}>
            <Shape shape={name} size={32} />
            <P size="xs" style={{ overflowWrap: 'anywhere', textAlign: 'center' }}>
              {name}
            </P>
          </Stack>
        ))}
      </div>
    </Stack>
  );
}
