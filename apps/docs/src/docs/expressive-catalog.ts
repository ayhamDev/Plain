import type { ComponentDefinition, PropDefinition } from './catalog';
const p = (
  name: string,
  type: string,
  description: string,
  defaultValue?: string,
): PropDefinition => ({ name, type, description, defaultValue });
const shape = p(
  'shape',
  'ShapeName',
  'One of the 36 exported shapeNames. Contours have matching vertices for native morphing.',
  'cookie6',
);
const morph = p(
  'morph',
  'boolean',
  'Interpolate shape changes with the theme motion duration. Reduced/none motion removes transitions.',
  'true',
);
export const expressiveComponents: ComponentDefinition[] = [
  {
    slug: 'circular-progress',
    name: 'Circular progress',
    category: 'Feedback',
    description: 'A precise progress ring, with a clear track gap and an optional wave.',
    imports: ['CircularProgress'],
    entry: '@plain/ui/circular-progress',
    code: '<CircularProgress value={64} aria-label="Upload progress" />\n<CircularProgress variant="wavy" value={64} size="lg" aria-label="Processing files" />\n<CircularProgress value={null} aria-label="Connecting" />',
    props: [
      p(
        'value / max',
        'number | null / number',
        'Clamped current value and positive maximum. null or omitted value is indeterminate.',
        'max: 100',
      ),
      p(
        'variant',
        'standard | wavy',
        'A smooth ring or a wave that flattens as completion approaches.',
        'standard',
      ),
      p(
        'size',
        'sm | md | lg | xl | number',
        '32, 48, 64 or 96 pixels, or a custom pixel diameter.',
        'md',
      ),
      p(
        'gap / thickness',
        'number',
        'Visible track separation and stroke thickness in pixels.',
        '4 / 4',
      ),
      p(
        'amplitude / frequency',
        'number',
        'Wave height in pixels and the number of complete waves around the ring.',
        '2 / 10',
      ),
      p(
        'indeterminate',
        'boolean',
        'Explicitly display ongoing progress without a current value.',
        'false',
      ),
      p('formatValue', '(value, max) => string', 'Override the localized accessible percentage.'),
      p('children', 'ReactNode', 'Optional centered value or icon; keep it short at small sizes.'),
    ],
    accessibility:
      'One Radix progressbar exposes the clamped value and maximum; indeterminate progress omits aria-valuenow. Supply aria-label or aria-labelledby. Provider locale formats percentages, direction mirrors the visual ring, and reduced/none motion stops rotation without hiding the indicator.',
    usage:
      'Use determinate progress for measurable work. Change value from null to a number when an estimate becomes available. Customize progress.track and progress.indicator tokens independently of the global palette.',
  },
  {
    slug: 'loading-indicator',
    name: 'Loading indicator',
    category: 'Feedback',
    description: 'Seven soft shapes morph and turn while a short task is running.',
    imports: ['LoadingIndicator'],
    entry: '@plain/ui/loading-indicator',
    code: '<LoadingIndicator label="Preparing workspace" />\n<LoadingIndicator variant="contained" size="lg" label="Syncing files" />',
    props: [
      p(
        'variant',
        'default | contained',
        'A standalone indicator or a circle with a contrasting surface.',
        'default',
      ),
      p('size', 'sm | md | lg | number', '32, 48 or 64 pixels, or a custom pixel size.', 'md'),
      p(
        'label',
        'string',
        'Screen reader status text; defaults to common.loading from the language provider.',
      ),
      p(
        'playing',
        'boolean',
        'Pause and resume the native SVG timeline without discarding its position.',
        'true',
      ),
      p(
        'duration',
        'number',
        'Duration of the complete seven-shape cycle in milliseconds.',
        '4667',
      ),
      p('startingShape', 'number', 'Initial contour index, clamped to 0 through 6.', '0'),
    ],
    accessibility:
      'A role=status announces one localized label; the SVG is decorative. Reduced/none motion displays a static shape. The server renders a visible initial contour and starts animation only in the browser. Internal status text supports custom provider messages.',
    usage:
      'Use for short, indeterminate waits. Keep Progress or CircularProgress for measurable tasks. Theme loading-indicator.color, loading-indicator.container and loading-indicator.contained-color. Native SVG interpolation uses precomputed contours and adds no animation engine.',
  },
  {
    slug: 'shape',
    name: 'Shape',
    category: 'Layout',
    description: 'A responsive library of 36 soft geometric silhouettes.',
    imports: ['Shape', 'shapeNames'],
    entry: '@plain/ui/shape',
    stylesheet: '@plain/ui/shape.css',
    code: '<Shape shape="softBurst" size={96} aria-label="Featured" />\n<Shape shape="flower" size={64} />',
    props: [
      p(
        'shape',
        'ShapeName',
        'Select a contour from shapeNames. SHAPE_PATHS and getShapeClipPath are also exported.',
        'circle',
      ),
      p('size', 'number | string', 'Pixel size or a responsive CSS length.', '48'),
      morph,
      p(
        'aria-label / aria-labelledby',
        'string',
        'Give a meaningful graphic a name. Unnamed shapes are decorative.',
      ),
    ],
    accessibility:
      'Unnamed SVGs are hidden from assistive technology. A named shape has role=img. Abstract geometry does not mirror in RTL. Every instance preserves its SVG ref, native props and tooltip support.',
    usage:
      'Import shape.css after core.css, or use the complete styles.css. Use shape.color or currentColor. Shape changes use matching vertices, with a static fallback where CSS path transitions are unavailable. ShapedIcon is an alias of Shape.',
  },
  {
    slug: 'shaped-components',
    name: 'Shaped components',
    category: 'Layout',
    description: 'The same shape language for images, surfaces, buttons and badges.',
    imports: ['ShapedContainer', 'ShapedImage', 'ShapedButton', 'ShapedBadge'],
    entry: '@plain/ui/shaped-components',
    stylesheet: '@plain/ui/shape.css',
    code: '<ShapedContainer shape="clover4" size={120}><span>New</span></ShapedContainer>\n<ShapedButton shape="cookie6" aria-label="Add project">+</ShapedButton>\n<ShapedBadge shape="softBurst" variant="accent">3</ShapedBadge>\n<ShapedImage shape="arch" src="/workspace.jpg" alt="A workspace" size={160} />',
    props: [
      shape,
      morph,
      p(
        'size',
        'number | string; buttons/badges: sm | md | lg',
        'Container/image pixels or CSS lengths. Buttons are 44/56/72px; badges are 32/48/64px.',
      ),
      p(
        'ShapedButton.variant',
        'primary | accent | secondary | outline | ghost | destructive',
        'Existing Button colors, focus, loading, disabled and native form behavior.',
        'primary',
      ),
      p(
        'ShapedBadge.variant',
        'default | accent | solid | outline',
        'Badge appearance, using the existing semantic palette.',
        'default',
      ),
      p(
        'ShapedImage.alt',
        'string',
        'Required native image alternative; use an empty string for decorative images.',
      ),
      p(
        'style / unstyled / tooltip',
        'CSSProperties / boolean / TooltipValue',
        'Native overrides, inherited unstyled composition and accessible tooltips.',
      ),
    ],
    accessibility:
      'ShapedButton is a native Button with a full rectangular hit target and an unclipped focus outline. Give icon buttons accessible names. ShapedImage forwards its native image ref, alt, loading and load/error handlers. Container clips decorative content: use ShapedButton for actions and avoid clipping focusable content.',
    usage:
      'Keep text inside narrow silhouettes short. ShapedIconButton is an alias of ShapedButton. The image is a native img: compose existing Image/Avatar functionality when you need custom loading or fallback content. Import shape.css with core.css, or use styles.css.',
  },
];
