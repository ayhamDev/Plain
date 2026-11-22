import * as React from 'react';
import { type PlainStyleProps, useStyles } from './style-context';
import { type InputVariant, inputVariantClass } from './input-variants';
import { useTranslation } from './i18n';
import { useValue, useFormReset } from './input-state';
import { X } from 'lucide-react';

export interface TagsInputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'size'>,
    PlainStyleProps {
  variant?: InputVariant;
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  maxTags?: number;
  delimiters?: readonly string[];
  addOnBlur?: boolean;
}

export const TagsInput = /* @__PURE__ */ React.forwardRef<HTMLInputElement, TagsInputProps>(
  (
    {
      value: controlled,
      variant = 'outlined',
      defaultValue = [],
      onValueChange,
      maxTags = Infinity,
      delimiters = ['Enter', ','],
      addOnBlur,
      name,
      form,
      required,
      disabled,
      readOnly,
      className,
      unstyled,
      onKeyDown,
      onBlur,
      onChange,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const { t } = useTranslation();

    const input = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => input.current!, []);
    const [tags, setTags, reset] = useValue<readonly string[]>(controlled, defaultValue, (next) =>
      onValueChange?.([...next]),
    );
    const [draft, setDraft] = React.useState('');
    const resetAll = React.useCallback(() => {
      reset();
      setDraft('');
    }, [reset]);
    useFormReset(input, resetAll);
    React.useEffect(() => {
      input.current?.setCustomValidity(required && !tags.length ? t('input.requiredTag') : '');
    }, [required, tags.length, t]);
    const add = () => {
      const tag = draft.trim();
      if (!tag || tags.length >= maxTags || disabled || readOnly) return;
      if (!tags.includes(tag)) setTags([...tags, tag]);
      setDraft('');
    };
    return (
      <div
        {...styles(
          'tags-input.root',
          `ui-tags-input ${inputVariantClass(variant)}`,
          undefined,
          unstyled,
        )}
        data-variant={variant}
        data-disabled={disabled || undefined}
      >
        {tags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            {...styles('tags-input.tag', 'ui-input-tag', undefined, unstyled)}
          >
            <span {...styles('tags-input.tag-label', 'ui-input-tag-label', undefined, unstyled)}>
              {tag}
            </span>
            {!readOnly && (
              <button
                type="button"
                disabled={disabled}
                aria-label={t('common.remove', { label: tag })}
                title={t('common.remove', { label: tag })}
                {...styles('tags-input.remove', 'ui-tag-remove', undefined, unstyled)}
                onClick={() => {
                  setTags(tags.filter((_, i) => i !== index));
                  input.current?.focus();
                }}
              >
                <X
                  {...styles('tags-input.remove-icon', 'ui-control-icon', undefined, unstyled)}
                  aria-hidden="true"
                />
              </button>
            )}
            {name && (
              <input type="hidden" name={name} form={form} value={tag} disabled={disabled} />
            )}
          </span>
        ))}
        {styles.tooltip(
          <input
            ref={input}
            type="text"
            aria-label={t('input.tags')}
            form={form}
            value={draft}
            required={required && !tags.length}
            disabled={disabled}
            readOnly={readOnly}
            {...styles('tags-input.input', 'ui-tags-native', className, unstyled)}
            {...props}
            onChange={(event) => {
              setDraft(event.currentTarget.value);
              onChange?.(event);
            }}
            onBlur={(event) => {
              onBlur?.(event);
              if (addOnBlur && !event.defaultPrevented) add();
            }}
            onKeyDown={(event) => {
              onKeyDown?.(event);
              if (event.defaultPrevented || event.nativeEvent.isComposing || disabled || readOnly)
                return;
              if (delimiters.includes(event.key)) {
                event.preventDefault();
                add();
              } else if (event.key === 'Escape' && draft) {
                event.preventDefault();
                setDraft('');
              } else if (event.key === 'Backspace' && !draft && tags.length) {
                event.preventDefault();
                setTags(tags.slice(0, -1));
              }
            }}
          />,
          unstyled,
        )}
      </div>
    );
  },
);

TagsInput.displayName = 'TagsInput';
