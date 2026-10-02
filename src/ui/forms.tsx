import { useStyles, useDirection, usePortalContainer, type PlainStyleProps } from './styling';
import * as React from 'react';
import {
  Label as LabelPrimitive,
  Checkbox as CheckboxPrimitive,
  Switch as SwitchPrimitive,
  RadioGroup as RadioPrimitive,
  Slider as SliderPrimitive,
  Select as SelectPrimitive,
  Toggle as TogglePrimitive,
  ToggleGroup as ToggleGroupPrimitive,
} from 'radix-ui';
import { Check, ChevronDown, ChevronUp, Minus } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';
import { useModalInert } from './modal-accessibility';
const inputClass =
  'ui-interactive flex min-h-[var(--ui-input-height,var(--ui-control-height))] w-full min-w-0 rounded-[var(--ui-input-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] border-input-border bg-[var(--ui-input-background,var(--ui-surface))] px-3 py-2 text-sm text-[var(--ui-input-foreground,var(--ui-foreground))] placeholder:text-[var(--ui-input-placeholder,var(--ui-muted-foreground))] focus-visible:border-[var(--ui-input-focus,var(--ui-accent))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-input-focus,var(--ui-accent))] disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-55 aria-invalid:border-danger aria-invalid:focus-visible:outline-danger';
export const Input = /* @__PURE__ */ React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & PlainStyleProps
>(({ className, type = 'text', unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <input
      ref={ref}
      type={type}
      {...styles('input.root', inputClass, className, unstyled)}
      {...props}
    />
  );
});
Input.displayName = 'Input';
export const Textarea = /* @__PURE__ */ React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & PlainStyleProps
>(({ className, rows = 3, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <textarea
      ref={ref}
      rows={rows}
      {...styles(
        'textarea.root',
        cn(inputClass, 'min-h-24 resize-y leading-6'),
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';
export const Label = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <LabelPrimitive.Root
      ref={ref}
      {...styles(
        'label.root',
        'text-sm font-medium leading-5 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
Label.displayName = 'Label';
export interface FieldProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
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
  return (
    <div {...styles('field.root', 'flex flex-col gap-2', className, unstyled)} {...props}>
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
    </div>
  );
}
export const Checkbox = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      {...styles(
        'checkbox.root',
        'ui-interactive peer flex size-4.5 shrink-0 items-center justify-center rounded-[var(--ui-checkbox-radius,min(var(--ui-radius),4px))] border-[length:var(--ui-border-width,1px)] border-[var(--ui-checkbox-border)] bg-[var(--ui-checkbox-background,var(--ui-surface))] text-[var(--ui-checkbox-foreground,var(--ui-accent-foreground))] data-[state=checked]:border-[var(--ui-checkbox-checked,var(--ui-accent))] data-[state=checked]:bg-[var(--ui-checkbox-checked,var(--ui-accent))] data-[state=indeterminate]:border-[var(--ui-checkbox-checked,var(--ui-accent))] data-[state=indeterminate]:bg-[var(--ui-checkbox-checked,var(--ui-accent))] disabled:cursor-not-allowed disabled:opacity-45',
        className,
        unstyled,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        {...styles(
          'checkbox.indicator',
          'ui-state-indicator flex items-center justify-center',
          undefined,
          unstyled,
        )}
      >
        <Minus
          {...styles(
            'checkbox.indeterminate-icon',
            'hidden size-3.5 [[data-state=indeterminate]>&]:block',
            undefined,
            unstyled,
          )}
          aria-hidden="true"
        />
        <Check
          {...styles(
            'checkbox.icon',
            'size-3.5 [[data-state=indeterminate]>&]:hidden',
            undefined,
            unstyled,
          )}
          strokeWidth={3}
          aria-hidden="true"
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = 'Checkbox';
export const Switch = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  const dir = useDirection(props.dir === 'rtl' || props.dir === 'ltr' ? props.dir : undefined);
  return (
    <SwitchPrimitive.Root
      ref={ref}
      dir={dir}
      {...styles(
        'switch.root',
        'ui-interactive ui-switch peer relative inline-flex h-5.5 w-10 shrink-0 items-center rounded-[var(--ui-switch-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] border-[var(--ui-switch-border)] bg-[var(--ui-switch-background,var(--ui-border))] p-0.5 data-[state=checked]:border-[var(--ui-switch-checked,var(--ui-accent))] data-[state=checked]:bg-[var(--ui-switch-checked,var(--ui-accent))] disabled:cursor-not-allowed disabled:opacity-45',
        className,
        unstyled,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        {...styles(
          'switch.thumb',
          'ui-switch-thumb absolute top-1/2 block size-4 -translate-y-1/2 rounded-[var(--ui-switch-thumb-radius,var(--ui-radius))] bg-[var(--ui-switch-thumb,white)] shadow-sm data-[state=unchecked]:bg-[var(--ui-switch-thumb-unchecked,var(--ui-foreground))]',
          undefined,
          unstyled,
        )}
      />
    </SwitchPrimitive.Root>
  );
});
Switch.displayName = 'Switch';
export const RadioGroup = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof RadioPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioPrimitive.Root> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <RadioPrimitive.Root
      ref={ref}
      {...styles('radio-group.root', 'grid gap-3', className, unstyled)}
      {...props}
    />
  );
});
RadioGroup.displayName = 'RadioGroup';
export const RadioGroupItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof RadioPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioPrimitive.Item> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <RadioPrimitive.Item
      ref={ref}
      {...styles(
        'radio-group.item',
        'ui-interactive size-4.5 shrink-0 rounded-full border-[length:var(--ui-border-width,1px)] border-[var(--ui-radio-border)] bg-[var(--ui-radio-background)] text-[var(--ui-radio-checked,var(--ui-accent))] data-[state=checked]:border-[var(--ui-radio-checked,var(--ui-accent))] disabled:cursor-not-allowed disabled:opacity-45',
        className,
        unstyled,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        {...styles(
          'radio-group.indicator',
          'ui-state-indicator flex items-center justify-center',
          undefined,
          unstyled,
        )}
      >
        <span
          {...styles('radio-group.dot', 'size-2.5 rounded-full bg-current', undefined, unstyled)}
        />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Item>
  );
});
RadioGroupItem.displayName = 'RadioGroupItem';
export interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  thumbLabels?: string[];
}
export const Slider = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps & PlainStyleProps
>(({ className, thumbLabels, unstyled, ...props }, ref) => {
  const styles = useStyles();
  const values = props.value ?? props.defaultValue ?? [0];
  return (
    <SliderPrimitive.Root
      ref={ref}
      {...styles(
        'slider.root',
        'relative flex h-6 w-full touch-none select-none items-center data-[orientation=vertical]:h-40 data-[orientation=vertical]:w-6 data-[orientation=vertical]:flex-col disabled:opacity-45',
        className,
        unstyled,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        {...styles(
          'slider.track',
          'relative h-1 w-full grow overflow-hidden rounded-full bg-[var(--ui-slider-track,var(--ui-border))] data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1',
          undefined,
          unstyled,
        )}
      >
        <SliderPrimitive.Range
          {...styles(
            'slider.range',
            'absolute h-full bg-[var(--ui-slider-range,var(--ui-accent))] data-[orientation=vertical]:w-full',
            undefined,
            unstyled,
          )}
        />
      </SliderPrimitive.Track>
      {values.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          aria-label={
            thumbLabels?.[i] ??
            props['aria-label'] ??
            (values.length > 1 ? `Value ${i + 1}` : 'Value')
          }
          {...styles(
            'slider.thumb',
            'ui-interactive block size-4 rounded-full border-2 border-accent bg-[var(--ui-slider-thumb,var(--ui-surface))] shadow-sm hover:shadow-[0_0_0_4px_var(--ui-accent-soft)] focus-visible:outline-2 focus-visible:outline-accent disabled:pointer-events-none',
            undefined,
            unstyled,
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = 'Slider';
export function Select({
  open,
  defaultOpen = false,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isOpen = open ?? internalOpen;
  useModalInert(isOpen);
  return (
    <SelectPrimitive.Root
      open={isOpen}
      onOpenChange={(next) => {
        if (open === undefined) setInternalOpen(next);
        onOpenChange?.(next);
      }}
      {...props}
    />
  );
}
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;
export const SelectTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & PlainStyleProps
>(({ className, children, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      {...styles(
        'select.trigger',
        cn(
          inputClass,
          'items-center justify-between gap-2 border-[var(--ui-select-border)] bg-[var(--ui-select-background)] text-[var(--ui-select-foreground)] rounded-[var(--ui-select-radius)] min-h-[var(--ui-select-height)] focus-visible:outline-[var(--ui-select-focus)] text-start data-[placeholder]:text-[var(--ui-select-placeholder)] [&>span]:truncate',
        ),
        className,
        unstyled,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown
          {...styles('select.icon', 'size-4 shrink-0 text-muted-foreground', undefined, unstyled)}
          aria-hidden="true"
        />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = 'SelectTrigger';
export const SelectContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & PlainStyleProps
>(({ className, children, position = 'popper', sideOffset = 6, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <SelectPrimitive.Portal container={usePortalContainer()}>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        sideOffset={sideOffset}
        {...styles(
          'select.content',
          'ui-popup z-[var(--ui-layer-dropdown)] max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[var(--ui-popover-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] border-[var(--ui-popover-border,var(--ui-border))] bg-[var(--ui-popover-background,var(--ui-surface))] text-[var(--ui-popover-foreground,var(--ui-foreground))] shadow-[var(--ui-popover-shadow,var(--ui-shadow))]',
          className,
          unstyled,
        )}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton
          {...styles('select.scroll-up', 'flex justify-center py-1', undefined, unstyled)}
        >
          <ChevronUp {...styles('select.scroll-icon', 'size-4', undefined, unstyled)} />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport {...styles('select.viewport', 'p-1', undefined, unstyled)}>
          {children}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton
          {...styles('select.scroll-down', 'flex justify-center py-1', undefined, unstyled)}
        >
          <ChevronDown {...styles('select.scroll-icon', 'size-4', undefined, unstyled)} />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = 'SelectContent';
export const SelectItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & PlainStyleProps
>(({ className, children, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <SelectPrimitive.Item
      ref={ref}
      {...styles(
        'select.item',
        'ui-interactive relative flex min-h-9 cursor-default select-none items-center rounded-[min(var(--ui-radius),4px)] py-2 pe-8 ps-3 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-45',
        className,
        unstyled,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        {...styles('select.indicator', 'absolute end-2 flex items-center', undefined, unstyled)}
      >
        <Check {...styles('select.icon', 'size-4', undefined, unstyled)} aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = 'SelectItem';
export const SelectLabel = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <SelectPrimitive.Label
      ref={ref}
      {...styles(
        'select.label',
        'px-3 py-2 text-xs font-medium text-muted-foreground',
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
SelectLabel.displayName = 'SelectLabel';
export const SelectSeparator = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <SelectPrimitive.Separator
      ref={ref}
      {...styles('select.separator', 'my-1 h-px bg-border', className, unstyled)}
      {...props}
    />
  );
});
SelectSeparator.displayName = 'SelectSeparator';
export const toggleVariants = /* @__PURE__ */ cva(
  'ui-interactive inline-flex items-center justify-center gap-2 rounded-ui border text-sm font-medium hover:bg-muted data-[state=on]:bg-accent-soft data-[state=on]:text-accent disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4',
  {
    variants: {
      variant: { default: 'border-transparent', outline: 'border-border' },
      size: { sm: 'h-8 min-w-8 px-2', md: 'h-9 min-w-9 px-3', lg: 'h-11 min-w-11 px-4' },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);
export const Toggle = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  (React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>) &
    PlainStyleProps
>(({ className, variant, size, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <TogglePrimitive.Root
      ref={ref}
      {...styles('toggle.root', toggleVariants({ variant, size }), className, unstyled)}
      {...props}
    />
  );
});
Toggle.displayName = 'Toggle';
export const ToggleGroup = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      {...styles('toggle-group.root', 'inline-flex items-center gap-1', className, unstyled)}
      {...props}
    />
  );
});
ToggleGroup.displayName = 'ToggleGroup';
export const ToggleGroupItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  (React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>) &
    PlainStyleProps
>(({ className, variant, size, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      {...styles('toggle-group.item', toggleVariants({ variant, size }), className, unstyled)}
      {...props}
    />
  );
});
ToggleGroupItem.displayName = 'ToggleGroupItem';
