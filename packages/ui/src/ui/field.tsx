import * as React from 'react';
import { type PlainStyleProps, useStyles } from './style-context';
import { Label } from './label';

export interface FieldProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>, PlainStyleProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactElement<{
    id?: string;
    'aria-describedby'?: string;
    'aria-labelledby'?: string;
    'aria-invalid'?: boolean;
    'aria-required'?: boolean;
  }>;
}

export function Field({
  label,
  description,
  error,
  required,
  children,
  className,
  unstyled,
  ...props
}: FieldProps & PlainStyleProps) {
  const styles = useStyles();
  const generatedId = React.useId();
  const id = children.props.id ?? generatedId;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const describedBy =
    [children.props['aria-describedby'], description ? descriptionId : '', error ? errorId : '']
      .filter(Boolean)
      .join(' ') || undefined;
  return styles.tooltip(
    <div {...styles('field.root', 'flex min-w-0 flex-col gap-2', className, unstyled)} {...props}>
      <Label id={`${id}-label`} htmlFor={id}>
        {label}
        {required && (
          <span
            aria-hidden="true"
            {...styles('field.required', 'ms-1 text-danger', undefined, unstyled)}
          >
            *
          </span>
        )}
      </Label>
      {React.cloneElement(children, {
        id,
        'aria-labelledby': [`${id}-label`, children.props['aria-labelledby']]
          .filter(Boolean)
          .join(' '),
        'aria-describedby': describedBy,
        'aria-invalid': Boolean(error) || children.props['aria-invalid'],
        'aria-required': required || children.props['aria-required'],
      })}
      {description && (
        <p
          id={descriptionId}
          {...styles(
            'field.description',
            'text-xs leading-5 text-muted-foreground',
            undefined,
            unstyled,
          )}
        >
          {description}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          {...styles('field.error', 'text-xs leading-5 text-danger', undefined, unstyled)}
        >
          {error}
        </p>
      )}
    </div>,
    unstyled,
  );
}
