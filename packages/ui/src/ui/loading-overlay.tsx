import * as React from 'react';
import { type PlainStyleProps, useStyles } from './style-context';
import { useTranslation } from './i18n';
import { inertAttribute } from './utils';
import { LoaderCircle } from 'lucide-react';

export interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement>, PlainStyleProps {
  visible?: boolean;
  label?: string;
}

export const LoadingOverlay = /* @__PURE__ */ React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ visible = true, label: labelProp, children, className, unstyled, ...props }, ref) => {
    const styles = useStyles();
    const { t } = useTranslation();
    return styles.tooltip(
      <div
        ref={ref}
        aria-busy={visible}
        {...styles('loading-overlay.root', 'ui-loading-overlay', className, unstyled)}
        {...props}
      >
        <div
          inert={inertAttribute(visible)}
          aria-hidden={visible || undefined}
          {...styles('loading-overlay.content', 'ui-loading-overlay-content', undefined, unstyled)}
        >
          {children}
        </div>
        {visible && (
          <div
            role="status"
            aria-label={labelProp ?? t('common.loading')}
            {...styles(
              'loading-overlay.overlay',
              'ui-loading-overlay-backdrop',
              undefined,
              unstyled,
            )}
          >
            <LoaderCircle
              {...styles('loading-overlay.spinner', 'ui-loading-spinner', undefined, unstyled)}
              aria-hidden="true"
            />
            <span {...styles('loading-overlay.label', 'ui-visually-hidden', undefined, unstyled)}>
              {labelProp ?? t('common.loading')}
            </span>
          </div>
        )}
      </div>,
      unstyled,
    );
  },
);

LoadingOverlay.displayName = 'LoadingOverlay';
