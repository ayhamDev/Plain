import * as React from 'react';
import Encoder from 'qrcode';
import { useStyles, type PlainStyleProps } from './styling';
import { useTranslation } from './i18n';

export type QRCodeErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';
export interface QRCodeProps
  extends
    Omit<React.SVGProps<SVGSVGElement>, 'children' | 'dangerouslySetInnerHTML' | 'viewBox'>,
    PlainStyleProps {
  value: string;
  size?: number;
  level?: QRCodeErrorCorrectionLevel;
  /** Quiet zone in modules, normalized to at least four. */
  margin?: number;
  foreground?: string;
  background?: string;
  label?: string;
  description?: string;
  onEncodingError?: (error: Error) => void;
}
interface Encoded {
  state: 'ready' | 'empty' | 'error';
  size: number;
  path: string;
  error: Error | null;
}
function encode(value: string, level: QRCodeErrorCorrectionLevel): Encoded {
  if (value === '') return { state: 'empty', size: 0, path: '', error: null };
  try {
    if (typeof value !== 'string') throw new TypeError('QRCode value must be a string.');
    const { modules } = Encoder.create(value, { errorCorrectionLevel: level });
    const paths: string[] = [];
    for (let y = 0; y < modules.size; y++) {
      let x = 0;
      while (x < modules.size) {
        if (!modules.data[y * modules.size + x]) {
          x++;
          continue;
        }
        const start = x;
        while (x < modules.size && modules.data[y * modules.size + x]) x++;
        paths.push(`M${start} ${y}h${x - start}v1H${start}z`);
      }
    }
    return { state: 'ready', size: modules.size, path: paths.join(''), error: null };
  } catch (error) {
    return {
      state: 'error',
      size: 0,
      path: '',
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export const QRCode = /* @__PURE__ */ React.forwardRef<SVGSVGElement, QRCodeProps>(
  (
    {
      value,
      size = 192,
      level = 'M',
      margin = 4,
      foreground,
      background,
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
    const correction = ['L', 'M', 'Q', 'H'].includes(level) ? level : 'M';
    const encoded = React.useMemo(() => encode(value, correction), [value, correction]);
    const padding = Number.isFinite(margin) ? Math.max(4, Math.floor(margin)) : 4;
    const pixels = Number.isFinite(size) && size > 0 ? Math.max(1, Math.round(size)) : 192;
    const extent = encoded.state === 'ready' ? encoded.size + padding * 2 : 100;
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
        shapeRendering="crispEdges"
        {...styles('qr-code.root', 'ui-qr-code', className, unstyled)}
        style={style}
        {...props}
        data-state={encoded.state}
        data-level={correction}
      >
        <title {...styles('qr-code.title', '', undefined, unstyled)}>
          {label ?? t('qr.label')}
        </title>
        <desc id={`${id}-description`} {...styles('qr-code.description', '', undefined, unstyled)}>
          {message}
        </desc>
        <rect
          width={extent}
          height={extent}
          fill={background ?? 'var(--ui-qr-code-background, #ffffff)'}
          {...styles('qr-code.background', '', undefined, unstyled)}
        />
        {encoded.state === 'ready' ? (
          <path
            d={encoded.path}
            transform={`translate(${padding} ${padding})`}
            fill={foreground ?? 'var(--ui-qr-code-foreground, #000000)'}
            {...styles('qr-code.foreground', '', undefined, unstyled)}
          />
        ) : (
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
            shapeRendering="auto"
            fill={foreground ?? 'var(--ui-qr-code-foreground, #000000)'}
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
