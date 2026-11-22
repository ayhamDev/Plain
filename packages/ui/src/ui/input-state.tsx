import * as React from 'react';

export function useValue<T>(
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

export function useFormReset<T extends HTMLElement>(
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
