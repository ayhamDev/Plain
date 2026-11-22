import * as React from 'react';
import { type PlainStyleProps, useStyles, StyleProvider } from './style-context';
import { Circle } from 'lucide-react';
import { useTranslation } from './i18n';

export interface TimelineEvent {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  time?: React.ReactNode;
  dateTime?: string;
  icon?: React.ReactNode;
  status?: 'complete' | 'current' | 'pending';
}

export type TimelineItemProps = Omit<React.LiHTMLAttributes<HTMLLIElement>, 'title'> &
  PlainStyleProps &
  Omit<TimelineEvent, 'id'>;

export const TimelineItem = /* @__PURE__ */ React.forwardRef<HTMLLIElement, TimelineItemProps>(
  (
    {
      title,
      description,
      time,
      dateTime,
      icon,
      status = 'complete',
      children,
      className,
      unstyled,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();

    return styles.tooltip(
      <li
        ref={ref}
        data-state={status}
        aria-current={status === 'current' ? 'step' : undefined}
        {...styles('timeline.item', 'ui-timeline-item', className, unstyled)}
        {...props}
      >
        <span
          {...styles('timeline.marker', 'ui-timeline-marker', undefined, unstyled)}
          aria-hidden="true"
        >
          {icon ?? <Circle size={10} fill={status === 'pending' ? 'none' : 'currentColor'} />}
        </span>
        <div {...styles('timeline.content', 'ui-timeline-content', undefined, unstyled)}>
          <div {...styles('timeline.heading', 'ui-timeline-heading', undefined, unstyled)}>
            <div {...styles('timeline.title', 'ui-timeline-title', undefined, unstyled)}>
              {title}
            </div>
            {time && (
              <time
                dateTime={dateTime}
                {...styles('timeline.time', 'ui-timeline-time', undefined, unstyled)}
              >
                {time}
              </time>
            )}
          </div>
          {description && (
            <div
              {...styles('timeline.description', 'ui-timeline-description', undefined, unstyled)}
            >
              {description}
            </div>
          )}
          {children}
        </div>
      </li>,
      unstyled,
    );
  },
);

TimelineItem.displayName = 'TimelineItem';

export interface TimelineProps extends React.OlHTMLAttributes<HTMLOListElement>, PlainStyleProps {
  items?: readonly TimelineEvent[];
}

export const Timeline = /* @__PURE__ */ React.forwardRef<HTMLOListElement, TimelineProps>(
  ({ items, children, className, unstyled, ...props }, ref) => {
    const styles = useStyles();
    const { t } = useTranslation();

    return (
      <StyleProvider unstyled={unstyled}>
        {styles.tooltip(
          <ol
            ref={ref}
            aria-label={t('activity.label')}
            {...styles('timeline.root', 'ui-timeline', className, unstyled)}
            {...props}
          >
            {items ? items.map(({ id, ...item }) => <TimelineItem key={id} {...item} />) : children}
          </ol>,
          unstyled,
        )}
      </StyleProvider>
    );
  },
);

Timeline.displayName = 'Timeline';
