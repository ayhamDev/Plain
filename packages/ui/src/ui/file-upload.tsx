import * as React from 'react';
import { type PlainStyleProps, useStyles, useDirection } from './style-context';
import { type InputVariant, inputVariantClass } from './input-variants';
import { useFormReset, useValue } from './input-state';
import { useTranslation } from './i18n';
import { Upload, X } from 'lucide-react';

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
