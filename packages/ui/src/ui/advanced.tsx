import * as React from 'react';
import { inputVariantClass, type InputVariant } from './input-variants';
import { useTranslation } from './i18n';
import { SelectionPanel } from './selection-panel';
import { useSelectionPresentation, type SelectionPresentation } from './selection-presentation';
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
  DirectionProvider,
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
  variant?: InputVariant;
  textAlign?: 'start' | 'center' | 'end';
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
      variant = 'outlined',
      textAlign = showControls ? 'center' : 'start',
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
    const { t } = useTranslation();
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
        {...styles(
          'number-input.root',
          `ui-input-control ui-number-input ${inputVariantClass(variant)}`,
          undefined,
          unstyled,
        )}
        data-disabled={disabled || undefined}
        data-variant={variant}
        data-controls={showControls}
        data-align={textAlign}
      >
        {showControls && (
          <button
            type="button"
            tabIndex={-1}
            disabled={
              disabled || readOnly || (value !== '' && lower !== undefined && value <= lower)
            }
            aria-label={t('input.decrease')}
            title={t('input.decrease')}
            {...styles('number-input.decrease', 'ui-input-action', undefined, unstyled)}
            onClick={() => changeBy(-1)}
          >
            <Minus
              {...styles('number-input.decrease-icon', 'ui-control-icon', undefined, unstyled)}
              aria-hidden="true"
            />
          </button>
        )}
        {styles.tooltip(
          <input
            ref={input}
            type="number"
            aria-label={t('input.number')}
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
          />,
          unstyled,
        )}
        {showControls && (
          <button
            type="button"
            tabIndex={-1}
            disabled={
              disabled || readOnly || (value !== '' && upper !== undefined && value >= upper)
            }
            aria-label={t('input.increase')}
            title={t('input.increase')}
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
  variant?: InputVariant;
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
      variant = 'outlined',
      defaultValue = '',
      onValueChange,
      onClear,
      clearLabel: clearLabelProp,
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
    const { t } = useTranslation();
    const input = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => input.current!, []);
    const [value, setValue, reset] = useValue(controlled, defaultValue, onValueChange);
    useFormReset(input, reset);
    return (
      <div
        {...styles(
          'search-input.root',
          `ui-input-control ui-search-input ${inputVariantClass(variant)}`,
          undefined,
          unstyled,
        )}
        data-variant={variant}
        data-disabled={disabled || undefined}
      >
        <Search
          {...styles('search-input.icon', 'ui-control-icon', undefined, unstyled)}
          aria-hidden="true"
        />
        {styles.tooltip(
          <input
            ref={input}
            type="search"
            aria-label={t('common.search')}
            value={value}
            disabled={disabled}
            readOnly={readOnly}
            {...styles('search-input.input', 'ui-advanced-input', className, unstyled)}
            {...props}
            onChange={(event) => {
              setValue(event.currentTarget.value);
              onChange?.(event);
            }}
          />,
          unstyled,
        )}
        <button
          type="button"
          aria-label={clearLabelProp ?? t('input.clear')}
          title={clearLabelProp ?? t('input.clear')}
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
  variant?: InputVariant;
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
      variant = 'outlined',
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
    const { t } = useTranslation();
    const input = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => input.current!, []);
    const [value, setValue, reset] = useValue(controlled, defaultValue, onValueChange);
    const [visible, setVisible] = useValue(controlledVisible, defaultVisible, onVisibilityChange);
    useFormReset(input, reset);
    return (
      <div
        {...styles(
          'password-input.root',
          `ui-input-control ${inputVariantClass(variant)}`,
          undefined,
          unstyled,
        )}
        data-variant={variant}
        data-disabled={disabled || undefined}
      >
        {styles.tooltip(
          <input
            ref={input}
            type={visible ? 'text' : 'password'}
            aria-label={t('input.password')}
            autoComplete="current-password"
            value={value}
            disabled={disabled}
            {...styles('password-input.input', 'ui-advanced-input', className, unstyled)}
            {...props}
            onChange={(event) => {
              setValue(event.currentTarget.value);
              onChange?.(event);
            }}
          />,
          unstyled,
        )}
        <button
          type="button"
          disabled={disabled}
          aria-label={t(visible ? 'input.hidePassword' : 'input.showPassword')}
          title={t(visible ? 'input.hidePassword' : 'input.showPassword')}
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
  variant?: InputVariant;
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
      variant = 'outlined',
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
      tooltip,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const { t } = useTranslation();

    const input = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => input.current!, []);
    const size = Number.isFinite(length) ? Math.max(1, Math.min(32, Math.floor(length))) : 6;
    const clean = (text: string) => (numeric ? text.replace(/[^0-9]/g, '') : text).slice(0, size);
    const [raw, setValue, reset] = useValue(controlled, defaultValue, onValueChange);
    const value = clean(raw);
    const [focused, setFocused] = React.useState(false);
    const [cursor, setCursor] = React.useState(0);
    useFormReset(input, reset);
    return styles.tooltip(
      <div
        tabIndex={tooltip === undefined ? undefined : disabled ? 0 : -1}
        {...styles('pin-input.root', 'ui-pin-input', undefined, unstyled)}
        data-variant={variant}
        data-disabled={disabled || undefined}
        style={
          { '--ui-pin-length': size, '--ui-pin-columns': Math.min(8, size) } as React.CSSProperties
        }
      >
        <div aria-hidden="true" {...styles('pin-input.slots', 'ui-pin-slots', undefined, unstyled)}>
          {Array.from({ length: size }, (_, index) => (
            <span
              key={index}
              data-variant={variant}
              data-disabled={disabled || undefined}
              data-active={(focused && index === Math.min(cursor, size - 1)) || undefined}
              {...styles(
                'pin-input.slot',
                `ui-pin-slot ${inputVariantClass(variant)}`,
                undefined,
                unstyled,
              )}
            >
              {value[index] ? (masked ? '*' : value[index]) : ''}
            </span>
          ))}
        </div>
        {styles.tooltip(
          <input
            ref={input}
            type={masked ? 'password' : 'text'}
            aria-label={t('input.pin')}
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
          />,
          unstyled,
        )}
      </div>,
      unstyled,
      tooltip,
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
  variant?: InputVariant;
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
function useFileFormReset(
  input: React.RefObject<HTMLInputElement | null>,
  files: readonly File[],
  reset: () => void,
) {
  const [pendingRestore, setPendingRestore] = React.useState(false);
  const resetFiles = React.useCallback(() => {
    reset();
    setPendingRestore(true);
  }, [reset]);
  useFormReset(input, resetFiles);
  React.useEffect(() => {
    if (!pendingRestore) return;
    // A trusted reset can clear FileList after the reset listener's microtasks.
    // Restore after that default action, using the latest committed React value.
    const timer = setTimeout(() => {
      assignFiles(input.current, files);
      setPendingRestore(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [input, files, pendingRestore]);
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
function validateFiles(
  files: readonly File[],
  accept: string | undefined,
  multiple: boolean | undefined,
  maxFiles: number,
  maxSize: number,
): FileUploadRejection[] {
  const limit = multiple
    ? Math.max(1, Number.isFinite(maxFiles) ? Math.floor(maxFiles) : Infinity)
    : 1;
  return files.flatMap((file, index): FileUploadRejection[] =>
    !accepts(file, accept)
      ? [{ file, reason: 'type' }]
      : file.size > maxSize
        ? [{ file, reason: 'size' }]
        : index >= limit
          ? [{ file, reason: 'count' }]
          : [],
  );
}
export const FileUpload = /* @__PURE__ */ React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      value: controlled,
      variant = 'outlined',
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
      tooltip,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const { t } = useTranslation();
    const input = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => input.current!, []);
    const [files, setFiles, reset] = useValue<readonly File[]>(controlled, defaultValue, (next) => {
      onValueChange?.([...next]);
      onFilesChange?.([...next]);
    });
    const [dragging, setDragging] = React.useState(false);
    const dragDepth = React.useRef(0);
    useFileFormReset(input, files, reset);
    React.useEffect(() => {
      const current = Array.from(input.current?.files ?? []);
      if (current.length !== files.length || current.some((file, index) => file !== files[index]))
        assignFiles(input.current, files);
    }, [files]);
    const receive = (next: File[]) => {
      const rejections = validateFiles(next, accept, multiple, maxFiles, maxSize);
      if (rejections.length) {
        assignFiles(input.current, files);
        if (!files.length && input.current) input.current.value = '';
        onReject?.(rejections);
        return;
      }
      assignFiles(input.current, controlled === undefined ? next : files);
      setFiles(next);
    };
    return styles.tooltip(
      <div
        tabIndex={tooltip === undefined ? undefined : disabled ? 0 : -1}
        {...styles(
          'file-upload.root',
          `ui-file-upload ${inputVariantClass(variant)}`,
          undefined,
          unstyled,
        )}
        data-dragging={dragging || undefined}
        data-variant={variant}
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
          {styles.tooltip(
            <input
              ref={input}
              type="file"
              aria-label={t('file.upload')}
              accept={accept}
              multiple={multiple}
              disabled={disabled}
              {...styles('file-upload.input', 'ui-file-upload-input', className, unstyled)}
              {...props}
              onChange={(event) => {
                receive(Array.from(event.currentTarget.files ?? []));
                onChange?.(event);
              }}
            />,
            unstyled,
          )}
        </div>
        {!!files.length && (
          <ul
            aria-label={t('file.selected')}
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
                  {t('file.size', { count: Math.ceil(file.size / 1024) })}
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={t('file.remove', { label: file.name })}
                  title={t('file.remove', { label: file.name })}
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
      </div>,
      unstyled,
      tooltip,
    );
  },
);
FileUpload.displayName = 'FileUpload';

export interface DropzoneRenderState {
  files: readonly File[];
  rejections: readonly FileUploadRejection[];
  dragging: boolean;
  disabled: boolean;
}
export interface DropzoneProps extends FileUploadProps {
  /** Presentational heading. The input's accessible name uses native ARIA props. */
  label?: React.ReactNode;
  description?: React.ReactNode;
  /** Set null to omit the default upload icon. */
  icon?: React.ReactNode;
  /** Replace the icon/heading with presentational content. Put actions outside the drop area. */
  children?: React.ReactNode | ((state: DropzoneRenderState) => React.ReactNode);
  showFileList?: boolean;
}
export const Dropzone = /* @__PURE__ */ React.forwardRef<HTMLInputElement, DropzoneProps>(
  (
    {
      value: controlled,
      variant = 'outlined',
      defaultValue = [],
      onValueChange,
      onFilesChange,
      onReject,
      maxFiles = Infinity,
      maxSize = Infinity,
      accept,
      multiple,
      disabled = false,
      label,
      description,
      icon,
      children,
      showFileList = true,
      className,
      style,
      unstyled,
      onChange,
      'aria-describedby': describedBy,
      'aria-invalid': ariaInvalid,
      tooltip,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const { t } = useTranslation();
    const direction = useDirection(
      props.dir === 'rtl' || props.dir === 'ltr' ? props.dir : undefined,
    );
    const id = React.useId();
    const input = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => input.current!, []);
    const [files, setFiles, reset] = useValue<readonly File[]>(controlled, defaultValue, (next) => {
      onValueChange?.([...next]);
      onFilesChange?.([...next]);
    });
    const [dragging, setDragging] = React.useState(false);
    const [rejections, setRejections] = React.useState<FileUploadRejection[]>([]);
    const dragDepth = React.useRef(0);
    const resetFiles = React.useCallback(() => {
      reset();
      setRejections([]);
      dragDepth.current = 0;
      setDragging(false);
    }, [reset]);
    useFileFormReset(input, files, resetFiles);
    React.useEffect(() => {
      const current = Array.from(input.current?.files ?? []);
      if (current.length !== files.length || current.some((file, index) => file !== files[index]))
        assignFiles(input.current, files);
    }, [files]);
    React.useEffect(() => {
      if (disabled) {
        dragDepth.current = 0;
        setDragging(false);
      }
    }, [disabled]);
    const receive = (next: File[]) => {
      const rejected = validateFiles(next, accept, multiple, maxFiles, maxSize);
      setRejections(rejected);
      if (rejected.length) {
        assignFiles(input.current, files);
        onReject?.(rejected);
        return;
      }
      assignFiles(input.current, controlled === undefined ? next : files);
      setFiles(next);
    };
    const hasFiles = (event: React.DragEvent) =>
      Array.from(event.dataTransfer.types).includes('Files');
    const hint = description === undefined ? t('file.browse') : description;
    const state = { files, rejections, dragging, disabled };
    return styles.tooltip(
      <div
        tabIndex={tooltip === undefined ? undefined : disabled ? 0 : -1}
        {...styles('dropzone.root', 'ui-dropzone', undefined, unstyled)}
        dir={direction}
        style={Object.fromEntries(
          Object.entries(style ?? {}).filter(([key]) => key.startsWith('--ui-')),
        )}
        data-variant={variant}
        data-disabled={disabled || undefined}
        data-dragging={dragging || undefined}
        data-invalid={
          rejections.length > 0 || ariaInvalid === true || ariaInvalid === 'true' || undefined
        }
      >
        <div
          data-variant={variant}
          data-disabled={disabled || undefined}
          {...styles(
            'dropzone.area',
            `ui-dropzone-area ${inputVariantClass(variant)}`,
            undefined,
            unstyled,
          )}
          onDragEnter={(event) => {
            if (!hasFiles(event) || event.defaultPrevented) return;
            event.preventDefault();
            if (!disabled) {
              dragDepth.current++;
              setDragging(true);
            }
          }}
          onDragLeave={(event) => {
            if (event.defaultPrevented) return;
            dragDepth.current = Math.max(0, dragDepth.current - 1);
            if (!dragDepth.current) setDragging(false);
          }}
          onDragOver={(event) => {
            if (!hasFiles(event)) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
          }}
          onDrop={(event) => {
            dragDepth.current = 0;
            setDragging(false);
            if (event.defaultPrevented || !hasFiles(event)) return;
            event.preventDefault();
            if (!disabled && event.dataTransfer.files.length)
              receive(Array.from(event.dataTransfer.files));
          }}
        >
          {styles.tooltip(
            <input
              ref={input}
              type="file"
              aria-label={t('file.upload')}
              accept={accept}
              multiple={multiple}
              disabled={disabled}
              {...styles('dropzone.input', 'ui-dropzone-input', className, unstyled)}
              style={style}
              {...props}
              aria-invalid={rejections.length ? true : ariaInvalid}
              aria-describedby={
                [describedBy, hint ? `${id}-hint` : '', rejections.length ? `${id}-errors` : '']
                  .filter(Boolean)
                  .join(' ') || undefined
              }
              onChange={(event) => {
                onChange?.(event);
                if (event.defaultPrevented || disabled) assignFiles(input.current, files);
                else receive(Array.from(event.currentTarget.files ?? []));
              }}
            />,
            unstyled,
          )}
          <div {...styles('dropzone.content', 'ui-dropzone-content', undefined, unstyled)}>
            {children !== undefined ? (
              typeof children === 'function' ? (
                children(state)
              ) : (
                children
              )
            ) : (
              <>
                {icon !== null && (
                  <span
                    {...styles('dropzone.icon', 'ui-dropzone-icon', undefined, unstyled)}
                    aria-hidden="true"
                  >
                    {icon ?? <Upload />}
                  </span>
                )}
                {label !== null && (
                  <p {...styles('dropzone.label', 'ui-dropzone-label', undefined, unstyled)}>
                    {label ?? t(dragging ? 'file.dropActive' : 'file.drop')}
                  </p>
                )}
              </>
            )}
            {hint && (
              <p
                id={`${id}-hint`}
                {...styles('dropzone.description', 'ui-dropzone-description', undefined, unstyled)}
              >
                {hint}
              </p>
            )}
          </div>
        </div>
        {!!rejections.length && (
          <div
            id={`${id}-errors`}
            role="alert"
            {...styles('dropzone.errors', 'ui-dropzone-errors', undefined, unstyled)}
          >
            <ul>
              {rejections.map(({ file, reason }, index) => (
                <li key={`${file.name}-${index}`}>
                  {t(
                    reason === 'type'
                      ? 'file.rejectType'
                      : reason === 'size'
                        ? 'file.rejectSize'
                        : 'file.rejectCount',
                    { label: file.name },
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {showFileList && !!files.length && (
          <ul
            aria-label={t('file.selected')}
            {...styles('dropzone.list', 'ui-dropzone-list', undefined, unstyled)}
          >
            {files.map((file, index) => (
              <li
                key={`${file.name}-${file.lastModified}-${index}`}
                {...styles('dropzone.file', 'ui-dropzone-file', undefined, unstyled)}
              >
                <span
                  dir="auto"
                  {...styles('dropzone.file-name', 'ui-dropzone-file-name', undefined, unstyled)}
                >
                  {file.name}
                </span>
                <span
                  dir="ltr"
                  {...styles('dropzone.file-size', 'ui-dropzone-file-size', undefined, unstyled)}
                >
                  {t('file.size', { count: Math.ceil(file.size / 1024) })}
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={t('file.remove', { label: file.name })}
                  title={t('file.remove', { label: file.name })}
                  {...styles(
                    'dropzone.remove',
                    'ui-input-action ui-dropzone-remove',
                    undefined,
                    unstyled,
                  )}
                  onClick={() => {
                    const next = files.filter((_, i) => i !== index);
                    assignFiles(input.current, controlled === undefined ? next : files);
                    setRejections([]);
                    setFiles(next);
                    input.current?.focus();
                  }}
                >
                  <X
                    {...styles('dropzone.remove-icon', 'ui-control-icon', undefined, unstyled)}
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div
          role="status"
          {...styles('dropzone.status', 'ui-visually-hidden', undefined, unstyled)}
        >
          {t(
            files.length === 0
              ? 'file.selectionEmpty'
              : files.length === 1
                ? 'file.selectionSingle'
                : 'file.selectionStatus',
            { count: files.length },
          )}
        </div>
      </div>,
      unstyled,
      tooltip,
    );
  },
);
Dropzone.displayName = 'Dropzone';

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
      getLabel: getLabelProp,
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
    const { t } = useTranslation();
    const direction = useDirection(dir as 'ltr' | 'rtl' | undefined);
    const root = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => root.current!, []);
    const [raw, setValue, reset] = useValue(controlled, defaultValue, onValueChange);
    const limit = Math.max(1, Math.min(20, Math.floor(Number.isFinite(max) ? max : 5)));
    const value = Math.max(0, Math.min(limit, Math.round(Number.isFinite(raw) ? raw : 0)));
    useFormReset(root, reset, form);
    return (
      <div {...styles('rating.wrapper', 'ui-rating-wrapper', undefined, unstyled)}>
        {styles.tooltip(
          <RadioGroup.Root
            ref={root}
            dir={direction}
            orientation="horizontal"
            aria-label={t('rating.title')}
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
                aria-label={
                  getLabelProp?.(index + 1, limit) ??
                  t('rating.label', { value: index + 1, max: limit })
                }
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
          </RadioGroup.Root>,
          unstyled,
        )}
        {name && <input type="hidden" name={name} form={form} value={value} disabled={disabled} />}
        {allowClear && !readOnly && (
          <button
            type="button"
            disabled={disabled || value === 0}
            aria-label={t('rating.clear')}
            title={t('rating.clear')}
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
  variant?: InputVariant;
  options: readonly MultiSelectOption[];
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (values: string[]) => void;
  maxSelected?: number;
  selectionDisplay?: 'tags' | 'summary';
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  emptyLabel?: string;
  presentation?: SelectionPresentation;
  sheetTitle?: React.ReactNode;
}
export const MultiSelect = /* @__PURE__ */ React.forwardRef<HTMLInputElement, MultiSelectProps>(
  (
    {
      options,
      value: controlled,
      variant = 'outlined',
      defaultValue = [],
      onValueChange,
      maxSelected = Infinity,
      selectionDisplay = 'tags',
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      emptyLabel: emptyLabelProp,
      presentation = 'popover',
      sheetTitle,
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
      onClick,
      onBeforeInput,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const { t, locale } = useTranslation();
    const direction = useDirection(dir as 'ltr' | 'rtl' | undefined);
    const input = React.useRef<HTMLInputElement>(null);
    const ignoreNextFocus = React.useRef(false);
    React.useImperativeHandle(ref, () => input.current!, []);
    const generated = React.useId();
    const id = suppliedId ?? `multiselect-${generated}`;
    const listId = `${id}-options`;
    const panelId = `${id}-panel`;
    const summaryId = `${id}-selection`;
    const [values, setValues, reset] = useValue<readonly string[]>(
      controlled,
      defaultValue,
      (next) => onValueChange?.([...next]),
    );
    const [open, setOpen] = useValue(controlledOpen, defaultOpen, onOpenChange);
    const availableOpen = open && !disabled && !readOnly;
    const { mode, ready, sheet } = useSelectionPresentation(presentation, availableOpen);
    const selectionSummary = values
      .map((value) => options.find((option) => option.value === value)?.label ?? value)
      .join(', ');
    const [query, setQuery] = React.useState('');
    const [active, setActive] = React.useState<string | null>(null);
    const resetAll = React.useCallback(() => {
      reset();
      setQuery('');
      setActive(null);
    }, [reset]);
    useFormReset(input, resetAll);
    React.useEffect(() => {
      input.current?.setCustomValidity(required && !values.length ? t('select.required') : '');
    }, [required, values.length, t]);
    const filtered = options.filter((option) =>
      option.label.toLocaleLowerCase(locale).includes(query.toLocaleLowerCase(locale)),
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
      if (!sheet) input.current?.focus();
    };
    const changeQuery: React.ChangeEventHandler<HTMLInputElement> = (event) => {
      onChange?.(event);
      if (event.defaultPrevented) return;
      setQuery(event.currentTarget.value);
      setActive(null);
      setOpen(true);
    };
    const navigate: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.nativeEvent.isComposing || readOnly || disabled) return;
      if (sheet && !open && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        setOpen(true);
        return;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const index = enabled.findIndex((option) => option.value === activeValue);
        const next = !open
          ? event.key === 'ArrowDown'
            ? 0
            : enabled.length - 1
          : Math.max(0, Math.min(enabled.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)));
        setActive(enabled[next]?.value ?? null);
        setOpen(true);
      } else if ((event.key === 'Enter' || (event.key === ' ' && !query)) && open) {
        event.preventDefault();
        if (activeValue) toggle(activeValue);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      } else if (event.key === 'Tab' && !sheet) setOpen(false);
      else if (event.key === 'Backspace' && !query && values.length) setValues(values.slice(0, -1));
    };
    return (
      <StyleProvider unstyled={unstyled}>
        <DirectionProvider dir={direction}>
          <PopoverPrimitive.Root
            open={availableOpen && ready && mode === 'popover'}
            onOpenChange={setOpen}
          >
            <PopoverPrimitive.Anchor asChild>
              <div
                {...styles(
                  'multi-select.root',
                  `ui-tags-input ui-multi-select ${inputVariantClass(variant)}`,
                  undefined,
                  unstyled,
                )}
                dir={direction}
                data-variant={variant}
                data-disabled={disabled || undefined}
                data-selection-display={selectionDisplay}
                data-has-value={values.length > 0 || undefined}
              >
                {selectionDisplay === 'tags' &&
                  values.map((value, index) => (
                    <span
                      key={`${value}-${index}`}
                      {...styles('multi-select.tag', 'ui-input-tag', undefined, unstyled)}
                    >
                      <span
                        {...styles(
                          'multi-select.tag-label',
                          'ui-input-tag-label',
                          undefined,
                          unstyled,
                        )}
                      >
                        {options.find((option) => option.value === value)?.label ?? value}
                      </span>
                      {!readOnly && (
                        <button
                          type="button"
                          disabled={disabled}
                          aria-label={t('common.remove', {
                            label: options.find((option) => option.value === value)?.label ?? value,
                          })}
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
                    </span>
                  ))}
                {name &&
                  values.map((value, index) => (
                    <input
                      key={`${value}-${index}`}
                      type="hidden"
                      name={name}
                      form={form}
                      value={value}
                      disabled={disabled}
                    />
                  ))}
                {selectionDisplay === 'summary' && (
                  <span
                    id={summaryId}
                    {...styles('multi-select.summary', 'ui-visually-hidden', undefined, unstyled)}
                  >
                    {selectionSummary}
                  </span>
                )}
                {styles.tooltip(
                  <input
                    ref={input}
                    id={id}
                    type="text"
                    role="combobox"
                    aria-label={t('select.options')}
                    aria-autocomplete={sheet ? 'none' : 'list'}
                    aria-haspopup={sheet ? 'dialog' : 'listbox'}
                    aria-expanded={open && !disabled && !readOnly}
                    aria-controls={availableOpen ? (sheet ? panelId : listId) : undefined}
                    aria-activedescendant={
                      !sheet && open && activeValue ? optionId(activeValue) : undefined
                    }
                    value={sheet ? '' : query}
                    form={form}
                    required={required && !values.length}
                    disabled={disabled}
                    readOnly={readOnly}
                    {...styles('multi-select.input', 'ui-tags-native', className, unstyled)}
                    {...props}
                    inputMode={sheet ? 'none' : props.inputMode}
                    placeholder={
                      selectionDisplay === 'summary' && values.length
                        ? selectionSummary
                        : props.placeholder
                    }
                    aria-describedby={
                      [
                        props['aria-describedby'],
                        selectionDisplay === 'summary' && values.length ? summaryId : undefined,
                      ]
                        .filter(Boolean)
                        .join(' ') || undefined
                    }
                    onFocus={(event) => {
                      onFocus?.(event);
                      if (ignoreNextFocus.current) {
                        ignoreNextFocus.current = false;
                        return;
                      }
                      if (!event.defaultPrevented && !readOnly && !sheet) setOpen(true);
                    }}
                    onClick={(event) => {
                      onClick?.(event);
                      if (!event.defaultPrevented && sheet && !readOnly && !disabled) setOpen(true);
                    }}
                    onBeforeInput={(event) => {
                      onBeforeInput?.(event);
                      if (sheet) event.preventDefault();
                    }}
                    onChange={sheet ? undefined : changeQuery}
                    onKeyDown={navigate}
                  />,
                  unstyled,
                )}
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={disabled || readOnly}
                  aria-label={t('select.toggle')}
                  title={t('select.toggle')}
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
            <SelectionPanel
              id={panelId}
              open={availableOpen}
              onOpenChange={setOpen}
              mode={mode}
              ready={ready}
              title={sheetTitle ?? props['aria-label'] ?? t('select.options')}
              returnFocusRef={input}
              multiple
              onReturnFocus={() => {
                ignoreNextFocus.current = true;
                input.current?.focus({ preventScroll: true });
              }}
              popoverProps={{
                dir: direction,
                align: 'start',
                sideOffset: 4,
                collisionPadding: 8,
                ...styles('multi-select.content', 'ui-multi-select-content', undefined, unstyled),
                onOpenAutoFocus: (event) => event.preventDefault(),
                onCloseAutoFocus: (event) => event.preventDefault(),
                onInteractOutside: (event) => {
                  if (input.current?.parentElement?.contains(event.target as Node))
                    event.preventDefault();
                },
              }}
            >
              {mode === 'sheet' && (
                <input
                  data-selection-search
                  type="search"
                  role="combobox"
                  aria-expanded="true"
                  aria-autocomplete="list"
                  aria-label={t('select.search')}
                  placeholder={t('select.search')}
                  value={query}
                  aria-controls={listId}
                  aria-activedescendant={activeValue ? optionId(activeValue) : undefined}
                  {...styles('multi-select.search', 'ui-selection-search', undefined, unstyled)}
                  onChange={changeQuery}
                  onKeyDown={navigate}
                />
              )}
              <div
                id={listId}
                role="listbox"
                aria-label={props['aria-label'] ?? t('common.options')}
                aria-multiselectable="true"
                {...styles('multi-select.list', 'ui-multi-select-list', undefined, unstyled)}
                style={
                  mode === 'sheet' && !(unstyled ?? styles.unstyled)
                    ? { maxHeight: 'none', minHeight: 0, flex: '1 1 auto', overflowY: 'auto' }
                    : undefined
                }
              >
                {!filtered.length && (
                  <div
                    {...styles('multi-select.empty', 'ui-multi-select-empty', undefined, unstyled)}
                  >
                    {emptyLabelProp ?? t('common.noResults')}
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
                    {...styles(
                      'multi-select.option',
                      'ui-multi-select-option',
                      undefined,
                      unstyled,
                    )}
                    onPointerDown={(event) => {
                      if (event.pointerType === 'mouse') event.preventDefault();
                    }}
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
            </SelectionPanel>
          </PopoverPrimitive.Root>
        </DirectionProvider>
      </StyleProvider>
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
        {styles.tooltip(
          <MenubarPrimitive.Root
            ref={ref}
            dir={direction}
            {...styles('menubar.root', 'ui-menubar', className, unstyled)}
            {...props}
          >
            {children}
          </MenubarPrimitive.Root>,
          unstyled,
        )}
      </StyleProvider>
    );
  },
);
Menubar.displayName = 'Menubar';
export const MenubarMenu = MenubarPrimitive.Menu;
export const MenubarGroup = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Group> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<MenubarPrimitive.Group {...props} ref={ref} />, unstyled);
});
MenubarGroup.displayName = 'MenubarGroup';
export const MenubarRadioGroup = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioGroup>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioGroup> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<MenubarPrimitive.RadioGroup {...props} ref={ref} />, unstyled);
});
MenubarRadioGroup.displayName = 'MenubarRadioGroup';
export const MenubarSub = MenubarPrimitive.Sub;
export const MenubarTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <MenubarPrimitive.Trigger
      ref={ref}
      {...styles('menubar.trigger', 'ui-menubar-trigger', className, unstyled)}
      {...props}
    />,
    unstyled,
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
        {styles.tooltip(
          <MenubarPrimitive.Content
            ref={ref}
            align="start"
            sideOffset={4}
            collisionPadding={8}
            {...styles('menubar.content', 'ui-menu-content', className, unstyled)}
            {...props}
          >
            {children}
          </MenubarPrimitive.Content>,
          unstyled,
        )}
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

  return styles.tooltip(
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
    </MenubarPrimitive.Item>,
    unstyled,
  );
});
MenubarItem.displayName = 'MenubarItem';
export const MenubarCheckboxItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem> & PlainStyleProps
>(({ className, unstyled, children, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
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
    </MenubarPrimitive.CheckboxItem>,
    unstyled,
  );
});
MenubarCheckboxItem.displayName = 'MenubarCheckboxItem';
export const MenubarRadioItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem> & PlainStyleProps
>(({ className, unstyled, children, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
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
    </MenubarPrimitive.RadioItem>,
    unstyled,
  );
});
MenubarRadioItem.displayName = 'MenubarRadioItem';
export const MenubarLabel = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <MenubarPrimitive.Label
      ref={ref}
      {...styles('menubar.label', 'ui-menu-label', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});
MenubarLabel.displayName = 'MenubarLabel';
export const MenubarSeparator = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <MenubarPrimitive.Separator
      ref={ref}
      {...styles('menubar.separator', 'ui-menu-separator', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});
MenubarSeparator.displayName = 'MenubarSeparator';
export const MenubarSubTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & PlainStyleProps
>(({ className, unstyled, children, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
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
    </MenubarPrimitive.SubTrigger>,
    unstyled,
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
      {styles.tooltip(
        <MenubarPrimitive.SubContent
          ref={ref}
          collisionPadding={8}
          {...styles('menubar.sub-content', 'ui-menu-content', className, unstyled)}
          {...props}
        />,
        unstyled,
      )}
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
export const ContextMenuGroup = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Group> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<ContextPrimitive.Group {...props} ref={ref} />, unstyled);
});
ContextMenuGroup.displayName = 'ContextMenuGroup';
export const ContextMenuRadioGroup = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.RadioGroup>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.RadioGroup> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<ContextPrimitive.RadioGroup {...props} ref={ref} />, unstyled);
});
ContextMenuRadioGroup.displayName = 'ContextMenuRadioGroup';
export const ContextMenuSub = ContextPrimitive.Sub;
export const ContextMenuTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Trigger> & PlainStyleProps
>(({ className, unstyled, disabled, onKeyDown, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
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
    />,
    unstyled,
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
        {styles.tooltip(
          <ContextPrimitive.Content
            ref={ref}
            collisionPadding={8}
            {...styles('context-menu.content', 'ui-menu-content', className, unstyled)}
            {...props}
          >
            {children}
          </ContextPrimitive.Content>,
          unstyled,
        )}
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

  return styles.tooltip(
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
    </ContextPrimitive.Item>,
    unstyled,
  );
});
ContextMenuItem.displayName = 'ContextMenuItem';
export const ContextMenuCheckboxItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.CheckboxItem> & PlainStyleProps
>(({ className, unstyled, children, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
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
    </ContextPrimitive.CheckboxItem>,
    unstyled,
  );
});
ContextMenuCheckboxItem.displayName = 'ContextMenuCheckboxItem';
export const ContextMenuRadioItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.RadioItem> & PlainStyleProps
>(({ className, unstyled, children, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
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
    </ContextPrimitive.RadioItem>,
    unstyled,
  );
});
ContextMenuRadioItem.displayName = 'ContextMenuRadioItem';
export const ContextMenuLabel = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Label> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <ContextPrimitive.Label
      ref={ref}
      {...styles('context-menu.label', 'ui-menu-label', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});
ContextMenuLabel.displayName = 'ContextMenuLabel';
export const ContextMenuSeparator = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Separator> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <ContextPrimitive.Separator
      ref={ref}
      {...styles('context-menu.separator', 'ui-menu-separator', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});
ContextMenuSeparator.displayName = 'ContextMenuSeparator';
export const ContextMenuSubTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.SubTrigger> & PlainStyleProps
>(({ className, unstyled, children, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
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
    </ContextPrimitive.SubTrigger>,
    unstyled,
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
      {styles.tooltip(
        <ContextPrimitive.SubContent
          ref={ref}
          collisionPadding={8}
          {...styles('context-menu.sub-content', 'ui-menu-content', className, unstyled)}
          {...props}
        />,
        unstyled,
      )}
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

  return styles.tooltip(
    <HoverPrimitive.Trigger
      ref={ref}
      {...styles('hover-card.trigger', 'ui-hover-card-trigger', className, unstyled)}
      {...props}
    />,
    unstyled,
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
      {styles.tooltip(
        <HoverPrimitive.Content
          ref={ref}
          dir={direction}
          sideOffset={8}
          collisionPadding={8}
          {...styles('hover-card.content', 'ui-hover-card-content', className, unstyled)}
          {...props}
        />,
        unstyled,
      )}
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
      dismissLabel: dismissLabelProp,
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
    const { t } = useTranslation();

    const [open, setOpen] = useValue(controlled, defaultOpen, onOpenChange);
    if (!open) return null;
    return styles.tooltip(
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
            aria-label={dismissLabelProp ?? t('banner.dismiss')}
            title={dismissLabelProp ?? t('banner.dismiss')}
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
      </div>,
      unstyled,
    );
  },
);
Banner.displayName = 'Banner';

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
