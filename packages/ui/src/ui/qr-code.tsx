import * as React from 'react';
import { useStyles, type PlainStyleProps } from './styling';
import { useTranslation } from './i18n';
import { useMotionSettings } from './motion-policy';
import {
  circlePattern,
  encodeQR,
  finderAt,
  finite,
  inLogo,
  modulePath,
  qrPaths,
  roundedRect,
} from './qr-code-geometry';

export type QRCodeErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';
export type QRCodeModuleShape = 'square' | 'rounded' | 'dots' | 'diamond';
export type QRCodeFinderShape = 'square' | 'rounded' | 'circle';
export interface QRCodeGradient {
  type?: 'linear' | 'radial';
  /** Linear-gradient rotation in degrees. */
  rotation?: number;
  stops: readonly { offset: number; color: string; opacity?: number }[];
}
export interface QRCodeLogo {
  src: string;
  /** Fraction of the encoded matrix width; normalized to 0..0.24. */
  size?: number;
  /** Clear padding around the image, in modules. */
  padding?: number;
  background?: string;
  /** Corner radius in modules. */
  radius?: number;
  crossOrigin?: 'anonymous' | 'use-credentials';
}
export interface QRCodeAnimation {
  /** Assemble is the default; reveal remains an alias for the assembly treatment. */
  preset?: 'assemble' | 'scan' | 'reveal' | 'fade';
  /** Milliseconds; zero makes the code immediately visible. */
  duration?: number;
  delay?: number;
}
export interface QRCodeModule {
  x: number;
  y: number;
  size: 1;
  isFunction: boolean;
}
export interface QRCodeFinder {
  corner: 'top-left' | 'top-right' | 'bottom-left';
  x: number;
  y: number;
  size: 7;
}
export interface QRCodeProps
  extends
    Omit<React.SVGProps<SVGSVGElement>, 'children' | 'dangerouslySetInnerHTML' | 'viewBox'>,
    PlainStyleProps {
  value: string;
  size?: number;
  level?: QRCodeErrorCorrectionLevel;
  /** Quiet zone in modules, normalized to 4..128. */
  margin?: number;
  foreground?: string;
  background?: string;
  shape?: 'square' | 'circle';
  moduleShape?: QRCodeModuleShape;
  /** Data-module scale, normalized to 0.6..1. Function patterns retain their full size. */
  moduleScale?: number;
  finderShape?: QRCodeFinderShape;
  finderCenterShape?: QRCodeFinderShape;
  finderColor?: string;
  finderCenterColor?: string;
  gradient?: QRCodeGradient;
  logo?: QRCodeLogo;
  /** Decorative outer modules for a circular silhouette, outside the quiet zone. */
  circlePattern?: boolean;
  circlePatternColor?: string;
  animation?: boolean | QRCodeAnimation;
  /** Encoder version, 1..40. Native SVG `version` remains available. */
  qrVersion?: number;
  maskPattern?: number;
  /** Advanced SVG rendering in matrix coordinates; finder patterns use renderFinder. */
  renderModule?: (
    module: QRCodeModule,
    defaultElement: React.ReactElement<React.SVGProps<SVGPathElement>>,
  ) => React.ReactNode;
  /** Advanced finder rendering in local 0..7 coordinates. */
  renderFinder?: (finder: QRCodeFinder, defaultElement: React.ReactElement) => React.ReactNode;
  label?: string;
  description?: string;
  onEncodingError?: (error: Error) => void;
}
function finderPath(size: number, shape: QRCodeFinderShape, inset = 0) {
  if (shape === 'circle') {
    const r = size / 2,
      c = inset + r;
    return `M${inset} ${c}a${r} ${r} 0 1 0 ${size} 0a${r} ${r} 0 1 0 ${-size} 0Z`;
  }
  return roundedRect(inset, inset, size, shape === 'rounded' ? size * 0.18 : 0);
}

export const QRCode = /* @__PURE__ */ React.forwardRef<SVGSVGElement, QRCodeProps>(
  (
    {
      value,
      size = 192,
      level,
      margin = 4,
      foreground,
      background,
      shape = 'square',
      moduleShape,
      moduleScale = 1,
      finderShape,
      finderCenterShape,
      finderColor,
      finderCenterColor,
      gradient,
      logo,
      circlePattern: decorate = true,
      circlePatternColor,
      animation = true,
      qrVersion,
      maskPattern,
      renderModule,
      renderFinder,
      label,
      description,
      onEncodingError,
      className,
      style,
      unstyled,
      'aria-describedby': describedBy,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const { t } = useTranslation();
    const id = React.useId();
    const { reduced } = useMotionSettings(animation !== false);
    const circular = shape === 'circle';
    const correction =
      level === undefined ? (logo ? 'H' : 'M') : ['L', 'M', 'Q', 'H'].includes(level) ? level : 'M';
    const version =
      Number.isInteger(qrVersion) && qrVersion! >= 1 && qrVersion! <= 40 ? qrVersion : undefined;
    const mask =
      Number.isInteger(maskPattern) && maskPattern! >= 0 && maskPattern! <= 7
        ? maskPattern
        : undefined;
    const encoded = React.useMemo(
      () => encodeQR(value, correction, version, mask),
      [value, correction, version, mask],
    );
    const padding = Math.floor(finite(margin, 4, 4, 128));
    const pixels = Number.isFinite(size) && size > 0 ? Math.max(1, Math.round(size)) : 192;
    const square = encoded.size + padding * 2;
    const extent =
      encoded.state === 'ready'
        ? circular
          ? Math.ceil(square * Math.SQRT2) + padding * 2
          : square
        : 100;
    const offset = (extent - encoded.size) / 2;
    const selectedModule = (
      ['square', 'rounded', 'dots', 'diamond'].includes(moduleShape ?? '')
        ? moduleShape
        : circular
          ? 'dots'
          : 'square'
    ) as QRCodeModuleShape;
    const selectedFinder = (
      ['square', 'rounded', 'circle'].includes(finderShape ?? '')
        ? finderShape
        : circular
          ? 'rounded'
          : 'square'
    ) as QRCodeFinderShape;
    const selectedCenter = (
      ['square', 'rounded', 'circle'].includes(finderCenterShape ?? '')
        ? finderCenterShape
        : selectedFinder
    ) as QRCodeFinderShape;
    const scale = finite(moduleScale, 1, 0.6, 1);
    const logoSide = logo?.src ? encoded.size * finite(logo.size, 0.18, 0, 0.24) : 0;
    const logoPadding = finite(logo?.padding, 1, 0, 4);
    const logoBounds = React.useMemo(
      () =>
        logoSide
          ? {
              x: (encoded.size - logoSide) / 2,
              y: (encoded.size - logoSide) / 2,
              size: logoSide,
              padding: logoPadding,
            }
          : undefined,
      [encoded.size, logoSide, logoPadding],
    );
    const paths = React.useMemo(
      () => qrPaths(encoded, selectedModule, scale, logoBounds),
      [encoded, selectedModule, scale, logoBounds],
    );
    const decoration = React.useMemo(
      () =>
        circular && decorate && encoded.state === 'ready'
          ? circlePattern(encoded, extent, padding, selectedModule, scale)
          : '',
      [circular, decorate, encoded, extent, padding, selectedModule, scale],
    );
    const ink = foreground ?? 'var(--ui-qr-code-foreground, #000000)';
    const paper = background ?? 'var(--ui-qr-code-background, #ffffff)';
    const stops = (gradient?.stops ?? [])
      .slice(0, 16)
      .filter((stop) => typeof stop.color === 'string' && stop.color.trim())
      .map((stop) => ({
        ...stop,
        offset: finite(stop.offset, 0, 0, 1),
        opacity: finite(stop.opacity, 1, 0, 1),
      }))
      .sort((a, b) => a.offset - b.offset);
    const dataInk = stops.length ? `url(#${id}-gradient)` : ink;
    const settings = typeof animation === 'object' && animation ? animation : {};
    const duration =
      settings.duration === undefined ? undefined : finite(settings.duration, 600, 0, 10000);
    const delay = settings.delay === undefined ? undefined : finite(settings.delay, 0, 0, 10000);
    const preset = ['assemble', 'scan', 'reveal', 'fade'].includes(settings.preset ?? '')
      ? settings.preset!
      : 'assemble';
    const motion =
      animation !== false && !reduced && encoded.state === 'ready' && duration !== 0
        ? preset
        : 'none';
    const assembled = motion === 'assemble' || motion === 'reveal';
    const masked = assembled || motion === 'scan';
    const stateDescription = t(
      encoded.state === 'empty'
        ? 'qr.emptyDescription'
        : encoded.state === 'error'
          ? 'qr.errorDescription'
          : 'qr.description',
    );
    const message = description
      ? encoded.state === 'ready'
        ? description
        : `${description} ${stateDescription}`
      : stateDescription;
    const errorCallback = React.useRef(onEncodingError);
    React.useEffect(() => {
      errorCallback.current = onEncodingError;
    }, [onEncodingError]);
    React.useEffect(() => {
      if (encoded.error) errorCallback.current?.(encoded.error);
    }, [encoded.error]);
    const corners: QRCodeFinder[] = [
      { corner: 'top-left', x: 0, y: 0, size: 7 },
      { corner: 'top-right', x: encoded.size - 7, y: 0, size: 7 },
      { corner: 'bottom-left', x: 0, y: encoded.size - 7, size: 7 },
    ];
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={pixels}
        height={pixels}
        viewBox={`0 0 ${extent} ${extent}`}
        role="img"
        aria-label={label ?? t('qr.label')}
        aria-describedby={[describedBy, `${id}-description`].filter(Boolean).join(' ')}
        shapeRendering={
          selectedModule === 'square' && selectedFinder === 'square' && selectedCenter === 'square'
            ? 'crispEdges'
            : 'geometricPrecision'
        }
        {...styles('qr-code.root', 'ui-qr-code', className, unstyled)}
        style={
          {
            ...(duration !== undefined ? { '--ui-qr-code-duration': `${duration}ms` } : {}),
            ...(delay !== undefined ? { '--ui-qr-code-delay': `${delay}ms` } : {}),
            ...style,
          } as React.CSSProperties
        }
        {...props}
        data-state={encoded.state}
        data-level={correction}
        data-shape={circular ? 'circle' : 'square'}
        data-module-shape={selectedModule}
        data-animation={motion}
      >
        <title {...styles('qr-code.title', '', undefined, unstyled)}>
          {label ?? t('qr.label')}
        </title>
        <desc id={`${id}-description`} {...styles('qr-code.description', '', undefined, unstyled)}>
          {message}
        </desc>
        {circular ? (
          <circle
            cx={extent / 2}
            cy={extent / 2}
            r={extent / 2}
            fill={paper}
            {...styles('qr-code.background', '', undefined, unstyled)}
          />
        ) : (
          <rect
            width={extent}
            height={extent}
            fill={paper}
            {...styles('qr-code.background', '', undefined, unstyled)}
          />
        )}
        {encoded.state === 'ready' ? (
          <>
            <defs>
              {stops.length > 0 &&
                (gradient?.type === 'radial' ? (
                  <radialGradient id={`${id}-gradient`}>
                    {stops.map((stop, index) => (
                      <stop
                        key={index}
                        offset={stop.offset}
                        stopColor={stop.color}
                        stopOpacity={stop.opacity}
                      />
                    ))}
                  </radialGradient>
                ) : (
                  <linearGradient
                    id={`${id}-gradient`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                    gradientTransform={`rotate(${finite(gradient?.rotation, 0, -36000, 36000)} .5 .5)`}
                  >
                    {stops.map((stop, index) => (
                      <stop
                        key={index}
                        offset={stop.offset}
                        stopColor={stop.color}
                        stopOpacity={stop.opacity}
                      />
                    ))}
                  </linearGradient>
                ))}
              {masked && (
                <mask
                  id={`${id}-reveal`}
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width={extent}
                  height={extent}
                  style={{ maskType: 'luminance' }}
                >
                  <g
                    key={value + correction}
                    {...styles('qr-code.reveal', '', undefined, unstyled)}
                  >
                    {assembled ? (
                      <>
                        {Array.from({ length: 64 }, (_, index) => {
                          const x = index % 8,
                            y = Math.floor(index / 8);
                          const stage = ((x + y) / 14) * 0.75 + (((index * 17) % 11) / 11) * 0.25;
                          return (
                            <rect
                              key={index}
                              x={(x * extent) / 8 - 0.02}
                              y={(y * extent) / 8 - 0.02}
                              width={extent / 8 + 0.04}
                              height={extent / 8 + 0.04}
                              fill="white"
                              style={{ '--_ui-qr-stage': stage } as React.CSSProperties}
                              {...styles('qr-code.motion-tile', '', undefined, unstyled)}
                            />
                          );
                        })}
                        {corners.map((finder) => (
                          <rect
                            key={finder.corner}
                            x={offset + finder.x}
                            y={offset + finder.y}
                            width={7}
                            height={7}
                            fill="white"
                            {...styles('qr-code.motion-anchor', '', undefined, unstyled)}
                          />
                        ))}
                      </>
                    ) : (
                      <>
                        <linearGradient id={`${id}-scan`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="white" />
                          <stop offset="0.666667" stopColor="white" />
                          <stop offset="0.733333" stopColor="black" />
                          <stop offset="1" stopColor="black" />
                        </linearGradient>
                        <rect
                          x="0"
                          y={-extent}
                          width={extent}
                          height={extent * 3}
                          fill={`url(#${id}-scan)`}
                          style={{ '--_ui-qr-distance': `${extent}px` } as React.CSSProperties}
                          {...styles('qr-code.scan', '', undefined, unstyled)}
                        />
                      </>
                    )}
                  </g>
                </mask>
              )}
              {(renderModule || renderFinder) && (
                <clipPath id={`${id}-matrix`}>
                  <rect x={offset} y={offset} width={encoded.size} height={encoded.size} />
                </clipPath>
              )}
              {logoBounds && (
                <>
                  <mask
                    id={`${id}-logo-mask`}
                    maskUnits="userSpaceOnUse"
                    x="0"
                    y="0"
                    width={encoded.size}
                    height={encoded.size}
                    style={{ maskType: 'luminance' }}
                  >
                    <rect width={encoded.size} height={encoded.size} fill="white" />
                    <path d={paths.reserved} fill="black" />
                  </mask>
                  <clipPath id={`${id}-logo-clip`}>
                    <path
                      d={roundedRect(
                        logoBounds.x,
                        logoBounds.y,
                        logoBounds.size,
                        finite(logo?.radius, 0.5, 0, logoBounds.size / 2),
                      )}
                    />
                  </clipPath>
                </>
              )}
            </defs>
            <g
              key={value + correction}
              mask={masked ? `url(#${id}-reveal)` : undefined}
              {...styles('qr-code.pattern', '', undefined, unstyled)}
            >
              {decoration && (
                <path
                  d={decoration}
                  fill={circlePatternColor ?? ink}
                  {...styles('qr-code.circle', '', undefined, unstyled)}
                />
              )}
              <g clipPath={renderModule || renderFinder ? `url(#${id}-matrix)` : undefined}>
                {renderModule ? (
                  <g
                    transform={`translate(${offset} ${offset})`}
                    fill={dataInk}
                    {...styles('qr-code.foreground', '', undefined, unstyled)}
                  >
                    {Array.from({ length: encoded.size * encoded.size }, (_, index) => {
                      const x = index % encoded.size,
                        y = Math.floor(index / encoded.size),
                        isFunction = !!encoded.reserved[index];
                      if (
                        !encoded.data[index] ||
                        finderAt(x, y, encoded.size) ||
                        (!isFunction && inLogo(x, y, logoBounds))
                      )
                        return null;
                      const element = (
                        <path
                          d={modulePath(
                            x,
                            y,
                            isFunction ? 'square' : selectedModule,
                            isFunction ? 1 : scale,
                          )}
                          fill={isFunction ? ink : undefined}
                          {...styles('qr-code.module', '', undefined, unstyled)}
                        />
                      );
                      return (
                        <React.Fragment key={index}>
                          {renderModule({ x, y, size: 1, isFunction }, element)}
                        </React.Fragment>
                      );
                    })}
                  </g>
                ) : (
                  <>
                    <path
                      d={paths.data}
                      transform={`translate(${offset} ${offset})`}
                      fill={dataInk}
                      {...styles('qr-code.foreground', '', undefined, unstyled)}
                    />
                    <path
                      d={paths.functions}
                      transform={`translate(${offset} ${offset})`}
                      fill={ink}
                      {...styles('qr-code.function', '', undefined, unstyled)}
                    />
                  </>
                )}
                {corners.map((finder) => {
                  const element = (
                    <>
                      <path
                        d={finderPath(7, selectedFinder) + finderPath(5, selectedFinder, 1)}
                        fillRule="evenodd"
                        fill={finderColor ?? ink}
                        {...styles('qr-code.finder-frame', '', undefined, unstyled)}
                      />
                      <path
                        d={finderPath(3, selectedCenter, 2)}
                        fill={finderCenterColor ?? finderColor ?? ink}
                        {...styles('qr-code.finder-center', '', undefined, unstyled)}
                      />
                    </>
                  );
                  return (
                    <g
                      key={finder.corner}
                      transform={`translate(${offset + finder.x} ${offset + finder.y})`}
                      {...styles('qr-code.finder', '', undefined, unstyled)}
                      data-corner={finder.corner}
                    >
                      {renderFinder ? renderFinder(finder, element) : element}
                    </g>
                  );
                })}
                {logoBounds && (
                  <g
                    transform={`translate(${offset} ${offset})`}
                    mask={`url(#${id}-logo-mask)`}
                    {...styles('qr-code.logo', '', undefined, unstyled)}
                  >
                    <path
                      d={roundedRect(
                        logoBounds.x - logoBounds.padding,
                        logoBounds.y - logoBounds.padding,
                        logoBounds.size + logoBounds.padding * 2,
                        finite(logo?.radius, 0.5, 0, logoBounds.size / 2) + logoBounds.padding,
                      )}
                      fill={logo?.background ?? paper}
                      {...styles('qr-code.logo-background', '', undefined, unstyled)}
                    />
                    <image
                      href={logo!.src}
                      x={logoBounds.x}
                      y={logoBounds.y}
                      width={logoBounds.size}
                      height={logoBounds.size}
                      preserveAspectRatio="xMidYMid meet"
                      clipPath={`url(#${id}-logo-clip)`}
                      crossOrigin={logo?.crossOrigin}
                      {...styles('qr-code.logo-image', '', undefined, unstyled)}
                    />
                  </g>
                )}
              </g>
            </g>
          </>
        ) : (
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
            shapeRendering="auto"
            fill={ink}
            {...styles('qr-code.placeholder', '', undefined, unstyled)}
          >
            {t(encoded.state === 'empty' ? 'qr.empty' : 'qr.error')}
          </text>
        )}
      </svg>
    );
  },
);
QRCode.displayName = 'QRCode';
