/** Shared appearances for text fields, compound inputs and picker triggers. */
export type InputVariant = 'outlined' | 'filled' | 'ghost' | 'contrast';

export function inputVariantClass(variant: InputVariant) {
  return `ui-input-variant${variant === 'contrast' ? ' ui-input-contrast' : ''}`;
}

export const inputClass =
  'ui-interactive flex min-h-[var(--ui-input-height,var(--ui-control-height))] w-full min-w-0 rounded-[var(--ui-input-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] border-[color:var(--_ui-input-border,var(--ui-input-border))] bg-[var(--_ui-input-background,var(--ui-input-background,var(--ui-surface)))] px-3 py-2 text-sm text-[var(--_ui-input-foreground,var(--ui-input-foreground,var(--ui-foreground)))] placeholder:text-[var(--ui-input-placeholder,var(--ui-muted-foreground))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-input-focus,var(--ui-accent))] disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-55 aria-invalid:border-danger aria-invalid:focus-visible:outline-danger';
