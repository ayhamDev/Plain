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
export type QRCodeFinderShape = 'square' | 'rounded' | 'circle' | 'dots';
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
  /** Draw traces the finders and writes the pattern. Older preset names now alias draw. */
  preset?: 'draw' | 'assemble' | 'scan' | 'reveal' | 'fade';
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
  /** Margin in modules, normalized to 4..128; around the silhouette for an integrated circle. */
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
  /** True/integrated joins the circular dot field; separated preserves a square quiet zone. */
  circlePattern?: boolean | 'integrated' | 'separated';
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
  if (shape === 'circle' || shape === 'dots') {
    const r = size / 2,
      c = inset + r;
    return `M${inset} ${c}a${r} ${r} 0 1 0 ${size} 0a${r} ${r} 0 1 0 ${-size} 0Z`;
  }
  return roundedRect(inset, inset, size, shape === 'rounded' ? size * 0.18 : 0);
}
function finderFrame(shape: QRCodeFinderShape) {
  if (shape !== 'dots') return finderPath(7, shape) + finderPath(5, shape, 1);
  // Round dots follow the same 7-module bounds and finder center as a solid ring.
  // A solid center preserves the 1:1:3:1:1 scan-line proportions.
  return Array.from({ length: 24 }, (_, index) => {
    const angle = (index * Math.PI) / 12;
    return modulePath(3 + Math.cos(angle) * 3, 3 + Math.sin(angle) * 3, 'dots');
  }).join('');
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
      moduleScale,
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
    const integrated = circular && Boolean(decorate) && decorate !== 'separated';
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
          ? Math.ceil((integrated ? encoded.size : square) * Math.SQRT2) + padding * 2
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
      ['square', 'rounded', 'circle', 'dots'].includes(finderShape ?? '')
        ? finderShape
        : circular
          ? 'dots'
          : 'square'
    ) as QRCodeFinderShape;
    const selectedCenter = (
      ['square', 'rounded', 'circle', 'dots'].includes(finderCenterShape ?? '')
        ? finderCenterShape
        : selectedFinder === 'dots'
          ? 'circle'
          : selectedFinder
    ) as QRCodeFinderShape;
    const scale = finite(moduleScale, circular ? 0.9 : 1, 0.6, 1);
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
          ? circlePattern(encoded, extent, padding, selectedModule, scale, integrated)
          : '',
      [circular, decorate, encoded, extent, padding, selectedModule, scale, integrated],
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
      settings.duration === undefined ? undefined : finite(settings.duration, 1000, 0, 10000);
    const delay = settings.delay === undefined ? undefined : finite(settings.delay, 0, 0, 10000);
    const motion =
      animation !== false && !reduced && !unstyled && encoded.state === 'ready' && duration !== 0
        ? 'draw'
        : 'none';
    const masked = motion === 'draw';
    const drawOrigin = circular ? padding : offset;
    const drawSize = extent - drawOrigin * 2;
    const drawRows = Math.min(48, Math.max(1, Math.ceil(drawSize)));
    const drawHeight = drawSize / drawRows;
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
    const patternKey = JSON.stringify([value, correction, version, mask, circular, decorate]);
    return styles.tooltip(
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
        data-finder-shape={selectedFinder}
        data-circle-pattern={
          circular ? (decorate ? (integrated ? 'integrated' : 'separated') : 'none') : undefined
        }
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
                <clipPath id={`${id}-draw-field`}>
                  <path
                    d={
                      `M0 0H${extent}V${extent}H0Z` +
                      corners
                        .map((finder) => roundedRect(offset + finder.x, offset + finder.y, 7, 0))
                        .join('')
                    }
                    clipRule="evenodd"
                  />
                </clipPath>
              )}
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
                  <g key={patternKey} {...styles('qr-code.reveal', '', undefined, unstyled)}>
                    <g clipPath={`url(#${id}-draw-field)`} fill="none" stroke="white">
                      {Array.from({ length: drawRows }, (_, index) => {
                        const y = drawOrigin + (index + 0.5) * drawHeight;
                        return (
                          <path
                            key={index}
                            d={`M${index % 2 ? extent - drawOrigin : drawOrigin} ${y}H${index % 2 ? drawOrigin : extent - drawOrigin}`}
                            pathLength={1}
                            strokeWidth={drawHeight + 0.02}
                            strokeLinecap="butt"
                            style={
                              {
                                '--_ui-qr-row': index / Math.max(1, drawRows - 1),
                              } as React.CSSProperties
                            }
                            {...styles('qr-code.draw-stroke', '', undefined, unstyled)}
                          />
                        );
                      })}
                    </g>
                    {corners.map((finder, index) => (
                      <g
                        key={finder.corner}
                        transform={`translate(${offset + finder.x} ${offset + finder.y})`}
                        style={{ '--_ui-qr-corner': index } as React.CSSProperties}
                      >
                        <path
                          d={finderPath(6, selectedFinder, 0.5)}
                          pathLength={1}
                          fill="none"
                          stroke="white"
                          strokeWidth={1.15}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          {...styles('qr-code.draw-anchor', '', undefined, unstyled)}
                        />
                        <path
                          d="M2 3.5H5"
                          pathLength={1}
                          fill="none"
                          stroke="white"
                          strokeWidth={3}
                          {...styles('qr-code.draw-center', '', undefined, unstyled)}
                        />
                        <rect
                          width={7}
                          height={7}
                          fill="white"
                          {...styles('qr-code.draw-complete', '', undefined, unstyled)}
                        />
                      </g>
                    ))}
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
              key={patternKey}
              mask={masked ? `url(#${id}-reveal)` : undefined}
              {...styles('qr-code.pattern', '', undefined, unstyled)}
            >
              {decoration && (
                <path
                  d={decoration}
                  fill={circlePatternColor ?? dataInk}
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
                        d={finderFrame(selectedFinder)}
                        fillRule={selectedFinder === 'dots' ? 'nonzero' : 'evenodd'}
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
      </svg>,
      unstyled,
    );
  },
);
QRCode.displayName = 'QRCode';
