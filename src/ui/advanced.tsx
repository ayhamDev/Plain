import * as React from 'react';
import {
  ContextMenu as ContextPrimitive,
  HoverCard as HoverPrimitive,
  Menubar as MenubarPrimitive,
  Popover as PopoverPrimitive,
  RadioGroup,
  Slot,
} from 'radix-ui';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Eye,
  EyeOff,
  Info,
  LoaderCircle,
  Minus,
  Plus,
  Search,
  Star,
  Upload,
  X,
} from 'lucide-react';
import {
  StyleProvider,
  useDirection,
  usePortalContainer,
  useStyles,
  type PlainStyleProps,
} from './styling';
import { changeInput, inertAttribute } from './utils';

function useValue<T>(
  controlled: T | undefined,
  defaultValue: T,
  onValueChange?: (value: T) => void,
) {
  const [local, setLocal] = React.useState(defaultValue);
  const value = controlled === undefined ? local : controlled;
  const change = (next: T) => {
    if (controlled === undefined) setLocal(next);
    onValueChange?.(next);
  };
  const reset = React.useCallback(() => {
    if (controlled === undefined) setLocal(defaultValue);
  }, [controlled, defaultValue]);
  return [value, change, reset] as const;
}

function useFormReset<T extends HTMLElement>(
  element: React.RefObject<T | null>,
  reset: () => void,
  formId?: string,
) {
  React.useEffect(() => {
    const node = element.current;
    const form =
      node instanceof HTMLInputElement
        ? node.form
        : formId
          ? node?.ownerDocument.getElementById(formId)
          : node?.closest('form');
    if (!(form instanceof HTMLFormElement)) return;
    const onReset = (event: Event) =>
      queueMicrotask(() => {
        if (!event.defaultPrevented) reset();
      });
    form.addEventListener('reset', onReset);
    return () => form.removeEventListener('reset', onReset);
  }, [element, reset, formId]);
}

export interface NumberInputProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'type' | 'value' | 'defaultValue' | 'min' | 'max' | 'step' | 'size'
    >,
    PlainStyleProps {
  value?: number | '';
  defaultValue?: number | '';
  onValueChange?: (value: number | '') => void;
  min?: number;
  max?: number;
  step?: number | 'any';
  showControls?: boolean;
}
export const NumberInput = /* @__PURE__ */ React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value: controlled,
      defaultValue = '',
      onValueChange,
      min,
      max,
      step = 1,
      showControls = true,
      className,
      unstyled,
      onChange,
      onBlur,
      disabled,
      readOnly,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const input = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => input.current!, []);
    const [raw, setValue, reset] = useValue(controlled, defaultValue, onValueChange);
    const value = typeof raw === 'number' && !Number.isFinite(raw) ? '' : raw;
    useFormReset(input, reset);
    const lower = min !== undefined && Number.isFinite(min) ? min : undefined;
    const upper = max !== undefined && Number.isFinite(max) ? max : undefined;
    const increment = typeof step === 'number' && Number.isFinite(step) && step > 0 ? step : 1;
    const clamp = (next: number) => Math.min(upper ?? Infinity, Math.max(lower ?? -Infinity, next));
    const changeBy = (sign: number) => {
      const next =
        value === ''
          ? sign > 0
            ? (lower ?? increment)
            : (upper ?? -increment)
          : Number((value + sign * increment).toFixed(12));
      changeInput(input.current, String(clamp(next)));
      input.current?.focus();
    };
    return (
      <div
        {...styles('number-input.root', 'ui-input-control ui-number-input', undefined, unstyled)}
        data-disabled={disabled || undefined}
      >
        {showControls && (
          <button
            type="button"
            tabIndex={-1}
            disabled={
              disabled || readOnly || (value !== '' && lower !== undefined && value <= lower)
            }
            aria-label="Decrease value"
            title="Decrease value"
            {...styles('number-input.decrease', 'ui-input-action', undefined, unstyled)}
            onClick={() => changeBy(-1)}
          >
            <Minus
              {...styles('number-input.decrease-icon', 'ui-control-icon', undefined, unstyled)}
              aria-hidden="true"
            />
          </button>
        )}
        <input
          ref={input}
          type="number"
          aria-label="Number"
          value={value}
          min={lower}
          max={upper}
          step={step}
          disabled={disabled}
          readOnly={readOnly}
          {...styles('number-input.input', 'ui-advanced-input', className, unstyled)}
          {...props}
          onChange={(event) => {
            const next = event.currentTarget.valueAsNumber;
            setValue(Number.isFinite(next) ? next : '');
            onChange?.(event);
          }}
          onBlur={(event) => {
            onBlur?.(event);
            if (!event.defaultPrevented && value !== '' && value !== clamp(value))
              changeInput(input.current, String(clamp(value)));
          }}
        />
        {showControls && (
          <button
            type="button"
            tabIndex={-1}
            disabled={
              disabled || readOnly || (value !== '' && upper !== undefined && value >= upper)
            }
            aria-label="Increase value"
            title="Increase value"
            {...styles('number-input.increase', 'ui-input-action', undefined, unstyled)}
            onClick={() => changeBy(1)}
          >
            <Plus
              {...styles('number-input.increase-icon', 'ui-control-icon', undefined, unstyled)}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    );
  },
);
NumberInput.displayName = 'NumberInput';

export interface SearchInputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue'>,
    PlainStyleProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onClear?: () => void;
  clearLabel?: string;
}
export const SearchInput = /* @__PURE__ */ React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value: controlled,
      defaultValue = '',
      onValueChange,
      onClear,
      clearLabel = 'Clear search',
      className,
      unstyled,
      disabled,
      readOnly,
      onChange,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const input = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => input.current!, []);
    const [value, setValue, reset] = useValue(controlled, defaultValue, onValueChange);
    useFormReset(input, reset);
    return (
      <div
        {...styles('search-input.root', 'ui-input-control ui-search-input', undefined, unstyled)}
        data-disabled={disabled || undefined}
      >
        <Search
          {...styles('search-input.icon', 'ui-control-icon', undefined, unstyled)}
          aria-hidden="true"
        />
        <input
          ref={input}
          type="search"
          aria-label="Search"
          value={value}
          disabled={disabled}
          readOnly={readOnly}
          {...styles('search-input.input', 'ui-advanced-input', className, unstyled)}
          {...props}
          onChange={(event) => {
            setValue(event.currentTarget.value);
            onChange?.(event);
          }}
        />
        <button
          type="button"
          aria-label={clearLabel}
          title={clearLabel}
          tabIndex={value ? 0 : -1}
          disabled={disabled || readOnly || !value}
          data-empty={!value || undefined}
          {...styles('search-input.clear', 'ui-input-action ui-search-clear', undefined, unstyled)}
          onClick={() => {
            changeInput(input.current, '');
            onClear?.();
            input.current?.focus();
          }}
        >
          <X
            {...styles('search-input.clear-icon', 'ui-control-icon', undefined, unstyled)}
            aria-hidden="true"
          />
        </button>
      </div>
    );
  },
);
SearchInput.displayName = 'SearchInput';

export interface PasswordInputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue'>,
    PlainStyleProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  visible?: boolean;
  defaultVisible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}
export const PasswordInput = /* @__PURE__ */ React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      value: controlled,
      defaultValue = '',
      onValueChange,
      visible: controlledVisible,
      defaultVisible = false,
      onVisibilityChange,
      className,
      unstyled,
      disabled,
      onChange,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const input = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => input.current!, []);
    const [value, setValue, reset] = useValue(controlled, defaultValue, onValueChange);
    const [visible, setVisible] = useValue(controlledVisible, defaultVisible, onVisibilityChange);
    useFormReset(input, reset);
    return (
      <div
        {...styles('password-input.root', 'ui-input-control', undefined, unstyled)}
        data-disabled={disabled || undefined}
      >
        <input
          ref={input}
          type={visible ? 'text' : 'password'}
          aria-label="Password"
          autoComplete="current-password"
          value={value}
          disabled={disabled}
          {...styles('password-input.input', 'ui-advanced-input', className, unstyled)}
          {...props}
          onChange={(event) => {
            setValue(event.currentTarget.value);
            onChange?.(event);
          }}
        />
        <button
          type="button"
          disabled={disabled}
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          {...styles('password-input.toggle', 'ui-input-action', undefined, unstyled)}
          onClick={() => setVisible(!visible)}
        >
          {visible ? (
            <EyeOff
              {...styles('password-input.hide-icon', 'ui-control-icon', undefined, unstyled)}
              aria-hidden="true"
            />
          ) : (
            <Eye
              {...styles('password-input.show-icon', 'ui-control-icon', undefined, unstyled)}
              aria-hidden="true"
            />
          )}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

export interface PinInputProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'type' | 'value' | 'defaultValue' | 'size' | 'maxLength'
    >,
    PlainStyleProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  numeric?: boolean;
  masked?: boolean;
}
export const PinInput = /* @__PURE__ */ React.forwardRef<HTMLInputElement, PinInputProps>(
  (
    {
      value: controlled,
      defaultValue = '',
      onValueChange,
      onComplete,
      length = 6,
      numeric = true,
      masked,
      className,
      style,
      unstyled,
      disabled,
      readOnly,
      onChange,
      onFocus,
      onBlur,
      onSelect,
      onPaste,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const input = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => input.current!, []);
    const size = Number.isFinite(length) ? Math.max(1, Math.min(32, Math.floor(length))) : 6;
    const clean = (text: string) => (numeric ? text.replace(/[^0-9]/g, '') : text).slice(0, size);
    const [raw, setValue, reset] = useValue(controlled, defaultValue, onValueChange);
    const value = clean(raw);
    const [focused, setFocused] = React.useState(false);
    const [cursor, setCursor] = React.useState(0);
    useFormReset(input, reset);
    return (
      <div
        {...styles('pin-input.root', 'ui-pin-input', undefined, unstyled)}
        data-disabled={disabled || undefined}
        style={
          { '--ui-pin-length': size, '--ui-pin-columns': Math.min(8, size) } as React.CSSProperties
        }
      >
        <div aria-hidden="true" {...styles('pin-input.slots', 'ui-pin-slots', undefined, unstyled)}>
          {Array.from({ length: size }, (_, index) => (
            <span
              key={index}
              data-active={(focused && index === Math.min(cursor, size - 1)) || undefined}
              {...styles('pin-input.slot', 'ui-pin-slot', undefined, unstyled)}
            >
              {value[index] ? (masked ? '*' : value[index]) : ''}
            </span>
          ))}
        </div>
        <input
          ref={input}
          type={masked ? 'password' : 'text'}
          aria-label="Verification code"
          inputMode={numeric ? 'numeric' : 'text'}
          autoComplete="one-time-code"
          pattern={numeric ? `[0-9]{${size}}` : undefined}
          maxLength={size}
          value={value}
          disabled={disabled}
          readOnly={readOnly}
          {...styles('pin-input.input', 'ui-pin-native', className, unstyled)}
          style={style}
          {...props}
          onChange={(event) => {
            const next = clean(event.currentTarget.value);
            event.currentTarget.value = next;
            setValue(next);
            setCursor(event.currentTarget.selectionStart ?? next.length);
            onChange?.(event);
            if (next.length === size && next !== value) onComplete?.(next);
          }}
          onFocus={(event) => {
            setFocused(true);
            setCursor(event.currentTarget.selectionStart ?? value.length);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onSelect={(event) => {
            setCursor(event.currentTarget.selectionStart ?? value.length);
            onSelect?.(event);
          }}
          onPaste={(event) => {
            onPaste?.(event);
            if (event.defaultPrevented || disabled || readOnly) return;
            const inserted = numeric
              ? event.clipboardData.getData('text').replace(/[^0-9]/g, '')
              : event.clipboardData.getData('text');
            const start = event.currentTarget.selectionStart ?? value.length;
            const end = event.currentTarget.selectionEnd ?? start;
            const next = clean(value.slice(0, start) + inserted + value.slice(end));
            event.preventDefault();
            changeInput(input.current, next);
            const position = Math.min(size, start + inserted.length);
            input.current?.setSelectionRange(position, position);
            setCursor(position);
          }}
        />
      </div>
    );
  },
);
PinInput.displayName = 'PinInput';

export interface FileUploadRejection {
  file: File;
  reason: 'type' | 'size' | 'count';
}
export interface FileUploadProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'type' | 'value' | 'defaultValue' | 'children'
    >,
    PlainStyleProps {
  value?: readonly File[];
  defaultValue?: readonly File[];
  onValueChange?: (files: File[]) => void;
  onFilesChange?: (files: File[]) => void;
  onReject?: (rejections: FileUploadRejection[]) => void;
  maxFiles?: number;
  maxSize?: number;
}
function assignFiles(input: HTMLInputElement | null, files: readonly File[]) {
  if (!input) return;
  if (!files.length) {
    input.value = '';
    return;
  }
  if (typeof DataTransfer === 'undefined') return;
  const transfer = new DataTransfer();
  files.forEach((file) => transfer.items.add(file));
  input.files = transfer.files;
}
function accepts(file: File, accept: string | undefined) {
  if (!accept) return true;
  return accept.split(',').some((entry) => {
    const type = entry.trim().toLowerCase();
    return (
      !type ||
      (type.startsWith('.')
        ? file.name.toLowerCase().endsWith(type)
        : type.endsWith('/*')
          ? file.type.toLowerCase().startsWith(type.slice(0, -1))
          : file.type.toLowerCase() === type)
    );
  });
}
export const FileUpload = /* @__PURE__ */ React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      value: controlled,
      defaultValue = [],
      onValueChange,
      onFilesChange,
      onReject,
      maxFiles = Infinity,
      maxSize = Infinity,
      accept,
      multiple,
      className,
      unstyled,
      disabled,
      onChange,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const input = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => input.current!, []);
    const [files, setFiles, reset] = useValue<readonly File[]>(controlled, defaultValue, (next) => {
      onValueChange?.([...next]);
      onFilesChange?.([...next]);
    });
    const [dragging, setDragging] = React.useState(false);
    const dragDepth = React.useRef(0);
    const resetFiles = React.useCallback(() => {
      reset();
      // Native reset clears the FileList even when the React value has not changed.
      assignFiles(input.current, controlled ?? defaultValue);
    }, [controlled, defaultValue, reset]);
    useFormReset(input, resetFiles);
    React.useEffect(() => {
      const current = Array.from(input.current?.files ?? []);
      if (current.length !== files.length || current.some((file, index) => file !== files[index]))
        assignFiles(input.current, files);
    }, [files]);
    const receive = (next: File[]) => {
      const limit = multiple
        ? Math.max(1, Number.isFinite(maxFiles) ? Math.floor(maxFiles) : Infinity)
        : 1;
      const rejections = next.flatMap((file, index): FileUploadRejection[] =>
        !accepts(file, accept)
          ? [{ file, reason: 'type' }]
          : file.size > maxSize
            ? [{ file, reason: 'size' }]
            : index >= limit
              ? [{ file, reason: 'count' }]
              : [],
      );
      if (rejections.length) {
        assignFiles(input.current, files);
        if (!files.length && input.current) input.current.value = '';
        onReject?.(rejections);
        return;
      }
      assignFiles(input.current, controlled === undefined ? next : files);
      setFiles(next);
    };
    return (
      <div
        {...styles('file-upload.root', 'ui-file-upload', undefined, unstyled)}
        data-dragging={dragging || undefined}
        data-disabled={disabled || undefined}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) {
            dragDepth.current++;
            setDragging(true);
          }
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (!dragDepth.current) setDragging(false);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) event.dataTransfer.dropEffect = 'copy';
        }}
        onDrop={(event) => {
          event.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          if (!disabled) receive(Array.from(event.dataTransfer.files));
        }}
      >
        <div {...styles('file-upload.control', 'ui-file-upload-control', undefined, unstyled)}>
          <Upload
            {...styles('file-upload.icon', 'ui-control-icon', undefined, unstyled)}
            aria-hidden="true"
          />
          <input
            ref={input}
            type="file"
            aria-label="Upload files"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            {...styles('file-upload.input', 'ui-file-upload-input', className, unstyled)}
            {...props}
            onChange={(event) => {
              receive(Array.from(event.currentTarget.files ?? []));
              onChange?.(event);
            }}
          />
        </div>
        {!!files.length && (
          <ul
            aria-label="Selected files"
            {...styles('file-upload.list', 'ui-file-upload-list', undefined, unstyled)}
          >
            {files.map((file, index) => (
              <li
                key={`${file.name}-${file.lastModified}-${index}`}
                {...styles('file-upload.file', 'ui-file-upload-file', undefined, unstyled)}
              >
                <span
                  {...styles(
                    'file-upload.file-name',
                    'ui-file-upload-file-name',
                    undefined,
                    unstyled,
                  )}
                >
                  {file.name}
                </span>
                <span
                  {...styles(
                    'file-upload.file-size',
                    'ui-file-upload-file-size',
                    undefined,
                    unstyled,
                  )}
                >
                  {Math.ceil(file.size / 1024)} KB
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`Remove ${file.name}`}
                  title={`Remove ${file.name}`}
                  {...styles('file-upload.remove', 'ui-input-action', undefined, unstyled)}
                  onClick={() => {
                    const next = files.filter((_, i) => i !== index);
                    assignFiles(input.current, controlled === undefined ? next : files);
                    setFiles(next);
                  }}
                >
                  <X
                    {...styles('file-upload.remove-icon', 'ui-control-icon', undefined, unstyled)}
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);
FileUpload.displayName = 'FileUpload';

export { ColorPicker, type ColorPickerProps } from './color-picker';

export interface RatingProps
  extends
    Omit<
      React.ComponentPropsWithoutRef<typeof RadioGroup.Root>,
      'value' | 'defaultValue' | 'onValueChange'
    >,
    PlainStyleProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  max?: number;
  readOnly?: boolean;
  allowClear?: boolean;
  getLabel?: (value: number, max: number) => string;
}
export const Rating = /* @__PURE__ */ React.forwardRef<HTMLDivElement, RatingProps>(
  (
    {
      value: controlled,
      defaultValue = 0,
      onValueChange,
      max = 5,
      readOnly,
      allowClear,
      getLabel = (n, total) => `${n} of ${total} stars`,
      name,
      form,
      disabled,
      required,
      className,
      unstyled,
      dir,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const direction = useDirection(dir as 'ltr' | 'rtl' | undefined);
    const root = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => root.current!, []);
    const [raw, setValue, reset] = useValue(controlled, defaultValue, onValueChange);
    const limit = Math.max(1, Math.min(20, Math.floor(Number.isFinite(max) ? max : 5)));
    const value = Math.max(0, Math.min(limit, Math.round(Number.isFinite(raw) ? raw : 0)));
    useFormReset(root, reset, form);
    return (
      <div {...styles('rating.wrapper', 'ui-rating-wrapper', undefined, unstyled)}>
        <RadioGroup.Root
          ref={root}
          dir={direction}
          orientation="horizontal"
          aria-label="Rating"
          value={value ? String(value) : ''}
          disabled={disabled}
          required={required}
          form={form}
          {...styles('rating.root', 'ui-rating', className, unstyled)}
          {...props}
          onValueChange={(next) => {
            if (!readOnly) setValue(Number(next));
          }}
        >
          {Array.from({ length: limit }, (_, index) => (
            <RadioGroup.Item
              key={index}
              value={String(index + 1)}
              aria-label={getLabel(index + 1, limit)}
              tabIndex={readOnly ? -1 : undefined}
              data-filled={index < value || undefined}
              {...styles('rating.item', 'ui-rating-item', undefined, unstyled)}
            >
              <Star
                {...styles('rating.icon', 'ui-rating-icon', undefined, unstyled)}
                aria-hidden="true"
              />
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>
        {name && <input type="hidden" name={name} form={form} value={value} disabled={disabled} />}
        {allowClear && !readOnly && (
          <button
            type="button"
            disabled={disabled || value === 0}
            aria-label="Clear rating"
            title="Clear rating"
            {...styles('rating.clear', 'ui-input-action', undefined, unstyled)}
            onClick={() => setValue(0)}
          >
            <X
              {...styles('rating.clear-icon', 'ui-control-icon', undefined, unstyled)}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    );
  },
);
Rating.displayName = 'Rating';

export interface TagsInputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'size'>,
    PlainStyleProps {
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
      input.current?.setCustomValidity(required && !tags.length ? 'Add at least one tag.' : '');
    }, [required, tags.length]);
    const add = () => {
      const tag = draft.trim();
      if (!tag || tags.length >= maxTags || disabled || readOnly) return;
      if (!tags.includes(tag)) setTags([...tags, tag]);
      setDraft('');
    };
    return (
      <div
        {...styles('tags-input.root', 'ui-tags-input', undefined, unstyled)}
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
                aria-label={`Remove ${tag}`}
                title={`Remove ${tag}`}
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
        <input
          ref={input}
          type="text"
          aria-label="Tags"
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
        />
      </div>
    );
  },
);
TagsInput.displayName = 'TagsInput';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}
export interface MultiSelectProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'size'>,
    PlainStyleProps {
  options: readonly MultiSelectOption[];
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (values: string[]) => void;
  maxSelected?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  emptyLabel?: string;
}
export const MultiSelect = /* @__PURE__ */ React.forwardRef<HTMLInputElement, MultiSelectProps>(
  (
    {
      options,
      value: controlled,
      defaultValue = [],
      onValueChange,
      maxSelected = Infinity,
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      emptyLabel = 'No results',
      name,
      form,
      required,
      disabled,
      readOnly,
      className,
      unstyled,
      id: suppliedId,
      dir,
      onKeyDown,
      onChange,
      onFocus,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const direction = useDirection(dir as 'ltr' | 'rtl' | undefined);
    const portal = usePortalContainer();
    const input = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => input.current!, []);
    const generated = React.useId();
    const id = suppliedId ?? `multiselect-${generated}`;
    const listId = `${id}-options`;
    const [values, setValues, reset] = useValue<readonly string[]>(
      controlled,
      defaultValue,
      (next) => onValueChange?.([...next]),
    );
    const [open, setOpen] = useValue(controlledOpen, defaultOpen, onOpenChange);
    const [query, setQuery] = React.useState('');
    const [active, setActive] = React.useState<string | null>(null);
    const resetAll = React.useCallback(() => {
      reset();
      setQuery('');
      setActive(null);
    }, [reset]);
    useFormReset(input, resetAll);
    React.useEffect(() => {
      input.current?.setCustomValidity(
        required && !values.length ? 'Select at least one option.' : '',
      );
    }, [required, values.length]);
    const filtered = options.filter((option) =>
      option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
    );
    const unavailable = (option: MultiSelectOption) =>
      !!option.disabled || (!values.includes(option.value) && values.length >= maxSelected);
    const enabled = filtered.filter((option) => !unavailable(option));
    const activeValue = enabled.some((option) => option.value === active)
      ? active
      : enabled[0]?.value;
    const optionId = (value: string) => `${listId}-${encodeURIComponent(value)}`;
    React.useEffect(() => {
      if (open && activeValue)
        document
          .getElementById(`${listId}-${encodeURIComponent(activeValue)}`)
          ?.scrollIntoView({ block: 'nearest' });
    }, [open, activeValue, listId]);
    const toggle = (value: string) => {
      const option = options.find((option) => option.value === value);
      if (!option || unavailable(option) || disabled || readOnly) return;
      setValues(
        values.includes(value) ? values.filter((current) => current !== value) : [...values, value],
      );
      input.current?.focus();
    };
    return (
      <PopoverPrimitive.Root open={open && !disabled && !readOnly} onOpenChange={setOpen}>
        <PopoverPrimitive.Anchor asChild>
          <div
            {...styles('multi-select.root', 'ui-tags-input ui-multi-select', undefined, unstyled)}
            dir={direction}
            data-disabled={disabled || undefined}
          >
            {values.map((value, index) => (
              <span
                key={`${value}-${index}`}
                {...styles('multi-select.tag', 'ui-input-tag', undefined, unstyled)}
              >
                <span
                  {...styles('multi-select.tag-label', 'ui-input-tag-label', undefined, unstyled)}
                >
                  {options.find((option) => option.value === value)?.label ?? value}
                </span>
                {!readOnly && (
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={`Remove ${options.find((option) => option.value === value)?.label ?? value}`}
                    {...styles('multi-select.remove', 'ui-tag-remove', undefined, unstyled)}
                    onClick={() => {
                      setValues(values.filter((current) => current !== value));
                      input.current?.focus();
                    }}
                  >
                    <X
                      {...styles(
                        'multi-select.remove-icon',
                        'ui-control-icon',
                        undefined,
                        unstyled,
                      )}
                      aria-hidden="true"
                    />
                  </button>
                )}
                {name && (
                  <input type="hidden" name={name} form={form} value={value} disabled={disabled} />
                )}
              </span>
            ))}
            <input
              ref={input}
              id={id}
              type="text"
              role="combobox"
              aria-label="Select options"
              aria-autocomplete="list"
              aria-expanded={open && !disabled && !readOnly}
              aria-controls={open ? listId : undefined}
              aria-activedescendant={open && activeValue ? optionId(activeValue) : undefined}
              value={query}
              form={form}
              required={required && !values.length}
              disabled={disabled}
              readOnly={readOnly}
              {...styles('multi-select.input', 'ui-tags-native', className, unstyled)}
              {...props}
              onFocus={(event) => {
                onFocus?.(event);
                if (!event.defaultPrevented && !readOnly) setOpen(true);
              }}
              onChange={(event) => {
                setQuery(event.currentTarget.value);
                setActive(null);
                setOpen(true);
                onChange?.(event);
              }}
              onKeyDown={(event) => {
                onKeyDown?.(event);
                if (event.defaultPrevented || event.nativeEvent.isComposing || readOnly || disabled)
                  return;
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                  event.preventDefault();
                  const index = enabled.findIndex((option) => option.value === activeValue);
                  const next = !open
                    ? event.key === 'ArrowDown'
                      ? 0
                      : enabled.length - 1
                    : Math.max(
                        0,
                        Math.min(enabled.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)),
                      );
                  setActive(enabled[next]?.value ?? null);
                  setOpen(true);
                } else if ((event.key === 'Enter' || (event.key === ' ' && !query)) && open) {
                  event.preventDefault();
                  if (activeValue) toggle(activeValue);
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  setOpen(false);
                } else if (event.key === 'Tab') setOpen(false);
                else if (event.key === 'Backspace' && !query && values.length)
                  setValues(values.slice(0, -1));
              }}
            />
            <button
              type="button"
              tabIndex={-1}
              disabled={disabled || readOnly}
              aria-label="Toggle options"
              title="Toggle options"
              aria-expanded={open}
              {...styles('multi-select.toggle', 'ui-input-action', undefined, unstyled)}
              onClick={() => {
                setOpen(!open);
                if (!open) input.current?.focus();
              }}
            >
              <ChevronDown
                {...styles('multi-select.toggle-icon', 'ui-control-icon', undefined, unstyled)}
                aria-hidden="true"
              />
            </button>
          </div>
        </PopoverPrimitive.Anchor>
        <PopoverPrimitive.Portal container={portal}>
          <PopoverPrimitive.Content
            dir={direction}
            align="start"
            sideOffset={4}
            collisionPadding={8}
            {...styles('multi-select.content', 'ui-multi-select-content', undefined, unstyled)}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => event.preventDefault()}
            onInteractOutside={(event) => {
              if (input.current?.parentElement?.contains(event.target as Node))
                event.preventDefault();
            }}
          >
            <div
              id={listId}
              role="listbox"
              aria-label={props['aria-label'] ?? 'Options'}
              aria-multiselectable="true"
              {...styles('multi-select.list', 'ui-multi-select-list', undefined, unstyled)}
            >
              {!filtered.length && (
                <div
                  {...styles('multi-select.empty', 'ui-multi-select-empty', undefined, unstyled)}
                >
                  {emptyLabel}
                </div>
              )}
              {filtered.map((option) => (
                <div
                  key={option.value}
                  id={optionId(option.value)}
                  role="option"
                  aria-selected={values.includes(option.value)}
                  aria-disabled={unavailable(option) || undefined}
                  data-active={activeValue === option.value || undefined}
                  {...styles('multi-select.option', 'ui-multi-select-option', undefined, unstyled)}
                  onPointerDown={(event) => event.preventDefault()}
                  onPointerMove={() => {
                    if (!unavailable(option)) setActive(option.value);
                  }}
                  onClick={() => toggle(option.value)}
                >
                  <span
                    {...styles(
                      'multi-select.option-check',
                      'ui-multi-select-check',
                      undefined,
                      unstyled,
                    )}
                    aria-hidden="true"
                  >
                    {values.includes(option.value) && <Check size={16} />}
                  </span>
                  {option.icon && <span aria-hidden="true">{option.icon}</span>}
                  {option.label}
                </div>
              ))}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  },
);
MultiSelect.displayName = 'MultiSelect';

export type MenubarProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root> &
  PlainStyleProps;
export const Menubar = /* @__PURE__ */ React.forwardRef<HTMLDivElement, MenubarProps>(
  ({ className, unstyled, dir, children, ...props }, ref) => {
    const styles = useStyles();
    const direction = useDirection(dir);
    return (
      <StyleProvider unstyled={unstyled}>
        <MenubarPrimitive.Root
          ref={ref}
          dir={direction}
          {...styles('menubar.root', 'ui-menubar', className, unstyled)}
          {...props}
        >
          {children}
        </MenubarPrimitive.Root>
      </StyleProvider>
    );
  },
);
Menubar.displayName = 'Menubar';
export const MenubarMenu = MenubarPrimitive.Menu;
export const MenubarGroup = MenubarPrimitive.Group;
export const MenubarRadioGroup = MenubarPrimitive.RadioGroup;
export const MenubarSub = MenubarPrimitive.Sub;
export const MenubarTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <MenubarPrimitive.Trigger
      ref={ref}
      {...styles('menubar.trigger', 'ui-menubar-trigger', className, unstyled)}
      {...props}
    />
  );
});
MenubarTrigger.displayName = 'MenubarTrigger';
export const MenubarContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content> & PlainStyleProps
>(({ className, unstyled, children, ...props }, ref) => {
  const styles = useStyles();
  const container = usePortalContainer();
  return (
    <StyleProvider unstyled={unstyled}>
      <MenubarPrimitive.Portal container={container}>
        <MenubarPrimitive.Content
          ref={ref}
          align="start"
          sideOffset={4}
          collisionPadding={8}
          {...styles('menubar.content', 'ui-menu-content', className, unstyled)}
          {...props}
        >
          {children}
        </MenubarPrimitive.Content>
      </MenubarPrimitive.Portal>
    </StyleProvider>
  );
});
MenubarContent.displayName = 'MenubarContent';
export const MenubarItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> &
    PlainStyleProps & { inset?: boolean; shortcut?: React.ReactNode }
>(({ className, unstyled, inset, shortcut, children, ...props }, ref) => {
  const styles = useStyles();
  return (
    <MenubarPrimitive.Item
      ref={ref}
      data-inset={inset || undefined}
      {...styles('menubar.item', 'ui-menu-item', className, unstyled)}
      {...props}
    >
      <Slot.Slottable>{children}</Slot.Slottable>
      {shortcut && (
        <kbd {...styles('menubar.shortcut', 'ui-menu-shortcut', undefined, unstyled)}>
          {shortcut}
        </kbd>
      )}
    </MenubarPrimitive.Item>
  );
});
MenubarItem.displayName = 'MenubarItem';
export const MenubarCheckboxItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem> & PlainStyleProps
>(({ className, unstyled, children, ...props }, ref) => {
  const styles = useStyles();
  return (
    <MenubarPrimitive.CheckboxItem
      ref={ref}
      {...styles('menubar.checkbox-item', 'ui-menu-item ui-menu-choice', className, unstyled)}
      {...props}
    >
      <MenubarPrimitive.ItemIndicator
        {...styles('menubar.item-indicator', 'ui-menu-indicator', undefined, unstyled)}
      >
        <Check size={16} aria-hidden="true" />
      </MenubarPrimitive.ItemIndicator>
      {children}
    </MenubarPrimitive.CheckboxItem>
  );
});
MenubarCheckboxItem.displayName = 'MenubarCheckboxItem';
export const MenubarRadioItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem> & PlainStyleProps
>(({ className, unstyled, children, ...props }, ref) => {
  const styles = useStyles();
  return (
    <MenubarPrimitive.RadioItem
      ref={ref}
      {...styles('menubar.radio-item', 'ui-menu-item ui-menu-choice', className, unstyled)}
      {...props}
    >
      <MenubarPrimitive.ItemIndicator
        {...styles('menubar.radio-indicator', 'ui-menu-indicator', undefined, unstyled)}
      >
        <Circle size={8} fill="currentColor" aria-hidden="true" />
      </MenubarPrimitive.ItemIndicator>
      {children}
    </MenubarPrimitive.RadioItem>
  );
});
MenubarRadioItem.displayName = 'MenubarRadioItem';
export const MenubarLabel = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <MenubarPrimitive.Label
      ref={ref}
      {...styles('menubar.label', 'ui-menu-label', className, unstyled)}
      {...props}
    />
  );
});
MenubarLabel.displayName = 'MenubarLabel';
export const MenubarSeparator = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <MenubarPrimitive.Separator
      ref={ref}
      {...styles('menubar.separator', 'ui-menu-separator', className, unstyled)}
      {...props}
    />
  );
});
MenubarSeparator.displayName = 'MenubarSeparator';
export const MenubarSubTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & PlainStyleProps
>(({ className, unstyled, children, ...props }, ref) => {
  const styles = useStyles();
  return (
    <MenubarPrimitive.SubTrigger
      ref={ref}
      {...styles('menubar.sub-trigger', 'ui-menu-item ui-menu-sub-trigger', className, unstyled)}
      {...props}
    >
      <Slot.Slottable>{children}</Slot.Slottable>
      <ChevronRight
        {...styles('menubar.sub-icon', 'ui-menu-sub-icon', undefined, unstyled)}
        aria-hidden="true"
      />
    </MenubarPrimitive.SubTrigger>
  );
});
MenubarSubTrigger.displayName = 'MenubarSubTrigger';
export const MenubarSubContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  const container = usePortalContainer();
  return (
    <MenubarPrimitive.Portal container={container}>
      <MenubarPrimitive.SubContent
        ref={ref}
        collisionPadding={8}
        {...styles('menubar.sub-content', 'ui-menu-content', className, unstyled)}
        {...props}
      />
    </MenubarPrimitive.Portal>
  );
});
MenubarSubContent.displayName = 'MenubarSubContent';

export function ContextMenu({
  unstyled,
  children,
  dir,
  ...props
}: React.ComponentProps<typeof ContextPrimitive.Root> & PlainStyleProps) {
  const direction = useDirection(dir);
  return (
    <StyleProvider unstyled={unstyled}>
      <ContextPrimitive.Root dir={direction} {...props}>
        {children}
      </ContextPrimitive.Root>
    </StyleProvider>
  );
}
export const ContextMenuGroup = ContextPrimitive.Group;
export const ContextMenuRadioGroup = ContextPrimitive.RadioGroup;
export const ContextMenuSub = ContextPrimitive.Sub;
export const ContextMenuTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Trigger> & PlainStyleProps
>(({ className, unstyled, disabled, onKeyDown, ...props }, ref) => {
  const styles = useStyles();
  return (
    <ContextPrimitive.Trigger
      ref={ref}
      disabled={disabled}
      aria-haspopup={disabled ? undefined : 'menu'}
      {...styles('context-menu.trigger', 'ui-context-menu-trigger', className, unstyled)}
      {...props}
      tabIndex={disabled ? -1 : (props.tabIndex ?? 0)}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || disabled) return;
        if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
          event.preventDefault();
          const rect = event.currentTarget.getBoundingClientRect();
          event.currentTarget.dispatchEvent(
            new MouseEvent('contextmenu', {
              bubbles: true,
              cancelable: true,
              clientX: rect.left + 8,
              clientY: rect.bottom,
            }),
          );
        }
      }}
    />
  );
});
ContextMenuTrigger.displayName = 'ContextMenuTrigger';
export const ContextMenuContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Content> & PlainStyleProps
>(({ className, unstyled, children, ...props }, ref) => {
  const styles = useStyles();
  const container = usePortalContainer();
  return (
    <StyleProvider unstyled={unstyled}>
      <ContextPrimitive.Portal container={container}>
        <ContextPrimitive.Content
          ref={ref}
          collisionPadding={8}
          {...styles('context-menu.content', 'ui-menu-content', className, unstyled)}
          {...props}
        >
          {children}
        </ContextPrimitive.Content>
      </ContextPrimitive.Portal>
    </StyleProvider>
  );
});
ContextMenuContent.displayName = 'ContextMenuContent';
export const ContextMenuItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Item> &
    PlainStyleProps & { inset?: boolean; shortcut?: React.ReactNode }
>(({ className, unstyled, inset, shortcut, children, ...props }, ref) => {
  const styles = useStyles();
  return (
    <ContextPrimitive.Item
      ref={ref}
      data-inset={inset || undefined}
      {...styles('context-menu.item', 'ui-menu-item', className, unstyled)}
      {...props}
    >
      <Slot.Slottable>{children}</Slot.Slottable>
      {shortcut && (
        <kbd {...styles('context-menu.shortcut', 'ui-menu-shortcut', undefined, unstyled)}>
          {shortcut}
        </kbd>
      )}
    </ContextPrimitive.Item>
  );
});
ContextMenuItem.displayName = 'ContextMenuItem';
export const ContextMenuCheckboxItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.CheckboxItem> & PlainStyleProps
>(({ className, unstyled, children, ...props }, ref) => {
  const styles = useStyles();
  return (
    <ContextPrimitive.CheckboxItem
      ref={ref}
      {...styles('context-menu.checkbox-item', 'ui-menu-item ui-menu-choice', className, unstyled)}
      {...props}
    >
      <ContextPrimitive.ItemIndicator
        {...styles('context-menu.item-indicator', 'ui-menu-indicator', undefined, unstyled)}
      >
        <Check size={16} aria-hidden="true" />
      </ContextPrimitive.ItemIndicator>
      {children}
    </ContextPrimitive.CheckboxItem>
  );
});
ContextMenuCheckboxItem.displayName = 'ContextMenuCheckboxItem';
export const ContextMenuRadioItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.RadioItem> & PlainStyleProps
>(({ className, unstyled, children, ...props }, ref) => {
  const styles = useStyles();
  return (
    <ContextPrimitive.RadioItem
      ref={ref}
      {...styles('context-menu.radio-item', 'ui-menu-item ui-menu-choice', className, unstyled)}
      {...props}
    >
      <ContextPrimitive.ItemIndicator
        {...styles('context-menu.radio-indicator', 'ui-menu-indicator', undefined, unstyled)}
      >
        <Circle size={8} fill="currentColor" aria-hidden="true" />
      </ContextPrimitive.ItemIndicator>
      {children}
    </ContextPrimitive.RadioItem>
  );
});
ContextMenuRadioItem.displayName = 'ContextMenuRadioItem';
export const ContextMenuLabel = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Label> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <ContextPrimitive.Label
      ref={ref}
      {...styles('context-menu.label', 'ui-menu-label', className, unstyled)}
      {...props}
    />
  );
});
ContextMenuLabel.displayName = 'ContextMenuLabel';
export const ContextMenuSeparator = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Separator> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <ContextPrimitive.Separator
      ref={ref}
      {...styles('context-menu.separator', 'ui-menu-separator', className, unstyled)}
      {...props}
    />
  );
});
ContextMenuSeparator.displayName = 'ContextMenuSeparator';
export const ContextMenuSubTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.SubTrigger> & PlainStyleProps
>(({ className, unstyled, children, ...props }, ref) => {
  const styles = useStyles();
  return (
    <ContextPrimitive.SubTrigger
      ref={ref}
      {...styles(
        'context-menu.sub-trigger',
        'ui-menu-item ui-menu-sub-trigger',
        className,
        unstyled,
      )}
      {...props}
    >
      <Slot.Slottable>{children}</Slot.Slottable>
      <ChevronRight
        {...styles('context-menu.sub-icon', 'ui-menu-sub-icon', undefined, unstyled)}
        aria-hidden="true"
      />
    </ContextPrimitive.SubTrigger>
  );
});
ContextMenuSubTrigger.displayName = 'ContextMenuSubTrigger';
export const ContextMenuSubContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.SubContent> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  const container = usePortalContainer();
  return (
    <ContextPrimitive.Portal container={container}>
      <ContextPrimitive.SubContent
        ref={ref}
        collisionPadding={8}
        {...styles('context-menu.sub-content', 'ui-menu-content', className, unstyled)}
        {...props}
      />
    </ContextPrimitive.Portal>
  );
});
ContextMenuSubContent.displayName = 'ContextMenuSubContent';

export function HoverCard({
  unstyled,
  children,
  ...props
}: React.ComponentProps<typeof HoverPrimitive.Root> & PlainStyleProps) {
  return (
    <StyleProvider unstyled={unstyled}>
      <HoverPrimitive.Root openDelay={500} {...props}>
        {children}
      </HoverPrimitive.Root>
    </StyleProvider>
  );
}
export const HoverCardTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof HoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof HoverPrimitive.Trigger> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <HoverPrimitive.Trigger
      ref={ref}
      {...styles('hover-card.trigger', 'ui-hover-card-trigger', className, unstyled)}
      {...props}
    />
  );
});
HoverCardTrigger.displayName = 'HoverCardTrigger';
export const HoverCardContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof HoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverPrimitive.Content> & PlainStyleProps
>(({ className, unstyled, dir, ...props }, ref) => {
  const styles = useStyles();
  const container = usePortalContainer();
  const direction = useDirection(dir as 'ltr' | 'rtl' | undefined);
  return (
    <HoverPrimitive.Portal container={container}>
      <HoverPrimitive.Content
        ref={ref}
        dir={direction}
        sideOffset={8}
        collisionPadding={8}
        {...styles('hover-card.content', 'ui-hover-card-content', className, unstyled)}
        {...props}
      />
    </HoverPrimitive.Portal>
  );
});
HoverCardContent.displayName = 'HoverCardContent';

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
    return (
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
      </li>
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
    return (
      <StyleProvider unstyled={unstyled}>
        <ol
          ref={ref}
          aria-label="Activity"
          {...styles('timeline.root', 'ui-timeline', className, unstyled)}
          {...props}
        >
          {items ? items.map(({ id, ...item }) => <TimelineItem key={id} {...item} />) : children}
        </ol>
      </StyleProvider>
    );
  },
);
Timeline.displayName = 'Timeline';

export interface BannerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>, PlainStyleProps {
  title?: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  action?: React.ReactNode;
  dismissible?: boolean;
  dismissLabel?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDismiss?: () => void;
}
export const Banner = /* @__PURE__ */ React.forwardRef<HTMLDivElement, BannerProps>(
  (
    {
      title,
      variant = 'info',
      action,
      dismissible,
      dismissLabel = 'Dismiss notification',
      open: controlled,
      defaultOpen = true,
      onOpenChange,
      onDismiss,
      children,
      className,
      unstyled,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const [open, setOpen] = useValue(controlled, defaultOpen, onOpenChange);
    if (!open) return null;
    return (
      <div
        ref={ref}
        role={variant === 'danger' || variant === 'warning' ? 'alert' : 'status'}
        data-variant={variant}
        {...styles('banner.root', 'ui-banner', className, unstyled)}
        {...props}
      >
        {variant === 'success' ? (
          <Check
            {...styles('banner.success-icon', 'ui-banner-icon', undefined, unstyled)}
            aria-hidden="true"
          />
        ) : variant === 'warning' || variant === 'danger' ? (
          <AlertCircle
            {...styles('banner.alert-icon', 'ui-banner-icon', undefined, unstyled)}
            aria-hidden="true"
          />
        ) : (
          <Info
            {...styles('banner.info-icon', 'ui-banner-icon', undefined, unstyled)}
            aria-hidden="true"
          />
        )}
        <div {...styles('banner.content', 'ui-banner-content', undefined, unstyled)}>
          {title && (
            <div {...styles('banner.title', 'ui-banner-title', undefined, unstyled)}>{title}</div>
          )}
          {children && (
            <div {...styles('banner.description', 'ui-banner-description', undefined, unstyled)}>
              {children}
            </div>
          )}
        </div>
        {action && (
          <div {...styles('banner.action', 'ui-banner-action', undefined, unstyled)}>{action}</div>
        )}
        {dismissible && (
          <button
            type="button"
            aria-label={dismissLabel}
            title={dismissLabel}
            {...styles('banner.dismiss', 'ui-input-action', undefined, unstyled)}
            onClick={() => {
              setOpen(false);
              onDismiss?.();
            }}
          >
            <X
              {...styles('banner.dismiss-icon', 'ui-control-icon', undefined, unstyled)}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    );
  },
);
Banner.displayName = 'Banner';

export interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement>, PlainStyleProps {
  visible?: boolean;
  label?: string;
}
export const LoadingOverlay = /* @__PURE__ */ React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ visible = true, label = 'Loading', children, className, unstyled, ...props }, ref) => {
    const styles = useStyles();
    return (
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
            aria-label={label}
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
              {label}
            </span>
          </div>
        )}
      </div>
    );
  },
);
LoadingOverlay.displayName = 'LoadingOverlay';
