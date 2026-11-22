import * as React from 'react';
import PhoneNumberInput, {
  getCountries,
  getCountryCallingCode,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
  parsePhoneNumber,
  type Country,
} from 'react-phone-number-input/max';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from './command';
import { Popover, PopoverTrigger } from './overlays';
import { SelectionPanel } from './selection-panel';
import { useSelectionPresentation, type SelectionPresentation } from './selection-presentation';
import { inputVariantClass, type InputVariant } from './input-variants';
import { useTranslation } from './i18n';
import {
  DirectionProvider,
  StyleProvider,
  useDirection,
  useStyles,
  type PlainStyleProps,
} from './styling';

export type PhoneCountry = Country;

export interface PhoneInputDetails {
  country?: PhoneCountry;
  possible: boolean;
  valid: boolean;
}

export interface PhoneInputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue'>,
    PlainStyleProps {
  /** International digits, including the leading +. Empty values are emitted as ''. */
  value?: string;
  defaultValue?: string;
  /** Separate from native onChange, which receives the visible input's event. */
  onValueChange?: (value: string, details: PhoneInputDetails) => void;
  defaultCountry?: PhoneCountry;
  countries?: readonly PhoneCountry[];
  onCountryChange?: (country: PhoneCountry | undefined) => void;
  /** true shows the calling code; false uses national formatting. */
  international?: boolean;
  countryCallingCodeEditable?: boolean;
  smartCaret?: boolean;
  /** Length validation tolerates evolving numbering plans. 'valid' checks digit patterns too. */
  validation?: 'possible' | 'valid' | false;
  showCountrySelect?: boolean;
  showInternationalOption?: boolean;
  countryLabels?: Partial<Record<PhoneCountry, string>>;
  /** Country-name locale. Internal messages follow LanguageProvider. */
  locale?: string;
  variant?: InputVariant;
  /** auto uses a bottom sheet on mobile and a popover on larger screens. */
  presentation?: SelectionPresentation;
}

const supportedCountries = /* @__PURE__ */ getCountries();
const useLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

function phoneDetails(value: string, fallback?: PhoneCountry): PhoneInputDetails {
  const possible = !!value && isPossiblePhoneNumber(value);
  return {
    country: (value ? parsePhoneNumber(value)?.country : undefined) ?? fallback,
    possible,
    valid: possible && isValidPhoneNumber(value),
  };
}

interface PhoneContextValue {
  input: React.RefObject<HTMLInputElement | null>;
  onNativeChange?: React.ChangeEventHandler<HTMLInputElement>;
  onSelectCountry: (country: PhoneCountry | undefined) => void;
  showCountrySelect: boolean;
  tooltip: PhoneInputProps['tooltip'];
  englishNames: Intl.DisplayNames;
  presentation: SelectionPresentation;
}
const PhoneContext = /* @__PURE__ */ React.createContext<PhoneContextValue | null>(null);

const PhoneNumberField = /* @__PURE__ */ React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, onChange, ...props }, forwardedRef) => {
  const context = React.useContext(PhoneContext)!;
  const styles = useStyles();
  const acceptedDisplay = React.useRef('');
  const setRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      context.input.current = node;
      if (node) acceptedDisplay.current = node.value;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [context.input, forwardedRef],
  );
  // The formatter owns the native value/caret. Keep cancellation native too.
  React.useEffect(() => {
    if (context.input.current) acceptedDisplay.current = context.input.current.value;
  });
  return styles.tooltip(
    <input
      {...props}
      {...styles('phone-input.input', 'ui-advanced-input ui-phone-number', className)}
      ref={setRef}
      dir="ltr"
      onChange={(event) => {
        context.onNativeChange?.(event);
        if (event.defaultPrevented) {
          event.currentTarget.value = acceptedDisplay.current;
          return;
        }
        onChange?.(event);
        acceptedDisplay.current = event.currentTarget.value;
      }}
    />,
    undefined,
    context.tooltip,
  );
});
PhoneNumberField.displayName = 'PhoneNumberField';

interface CountryOption {
  value?: PhoneCountry;
  label: string;
  divider?: boolean;
}
interface CountryPickerProps {
  value?: PhoneCountry;
  onChange: (country: PhoneCountry | undefined) => void;
  options: CountryOption[];
  disabled?: boolean;
  readOnly?: boolean;
  onFocus?: React.FocusEventHandler<HTMLButtonElement>;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
}
function PhoneCountryPicker({
  value,
  onChange,
  options,
  disabled,
  readOnly,
  onFocus,
  onBlur,
}: CountryPickerProps) {
  const context = React.useContext(PhoneContext)!;
  const { t } = useTranslation();
  const styles = useStyles();
  const [open, setOpen] = React.useState(false);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const availableOpen = open && !disabled && !readOnly;
  const { mode, ready } = useSelectionPresentation(context.presentation, availableOpen);
  const popupId = React.useId();
  const choices = options.filter((option) => !option.divider);
  const label = choices.find((option) => option.value === value)?.label ?? t('phone.international');
  const callingCode = value ? `+${getCountryCallingCode(value)}` : '';
  if (!context.showCountrySelect) return null;
  return (
    <Popover open={availableOpen && ready && mode === 'popover'} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={trigger}
          {...styles('phone-input.country', 'ui-phone-country')}
          type="button"
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded={open && !disabled && !readOnly}
          aria-controls={open ? popupId : undefined}
          aria-label={`${t('phone.country')}: ${label}${callingCode ? ` (${callingCode})` : ''}`}
          disabled={disabled || readOnly || choices.length < 2}
          onFocus={onFocus}
          onBlur={onBlur}
        >
          <span {...styles('phone-input.country-value', 'ui-phone-country-value')}>
            {value ? <bdi dir="ltr">{value}</bdi> : <Globe aria-hidden="true" size={16} />}
          </span>
          <ChevronDown
            {...styles('phone-input.country-icon', 'ui-phone-country-icon')}
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <SelectionPanel
        id={popupId}
        open={availableOpen}
        onOpenChange={setOpen}
        mode={mode}
        ready={ready}
        title={t('phone.country')}
        returnFocusRef={trigger}
        popoverProps={styles('phone-input.content', 'ui-phone-country-content')}
      >
        <Command label={t('phone.searchCountry')} defaultValue={value ?? 'international'}>
          <CommandInput
            placeholder={t('phone.searchCountry')}
            aria-label={t('phone.searchCountry')}
          />
          <CommandList
            aria-label={t('phone.country')}
            {...styles('phone-input.list', 'ui-phone-country-list')}
            style={!styles.unstyled ? { maxHeight: mode === 'sheet' ? 'none' : 320 } : undefined}
          >
            <CommandEmpty>{t('phone.noCountries')}</CommandEmpty>
            {choices.map((option) => (
              <CommandItem
                key={option.value ?? 'international'}
                value={option.value ?? 'international'}
                keywords={[
                  option.label,
                  option.value ? `+${getCountryCallingCode(option.value)}` : '',
                  option.value ? (context.englishNames.of(option.value) ?? option.value) : '',
                ]}
                {...styles('phone-input.option', 'ui-phone-country-option')}
                onSelect={() => {
                  context.onSelectCountry(option.value);
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <Check
                  {...styles('phone-input.selected-icon', 'ui-phone-country-check')}
                  aria-hidden="true"
                  style={{ opacity: option.value === value ? 1 : 0 }}
                />
                <span {...styles('phone-input.option-name', 'ui-phone-country-name')}>
                  {option.label}
                </span>
                <bdi dir="ltr" {...styles('phone-input.calling-code', 'ui-phone-calling-code')}>
                  {option.value ? `+${getCountryCallingCode(option.value)}` : ''}
                </bdi>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </SelectionPanel>
    </Popover>
  );
}

/** International phone formatting with P.UI country search and native form participation. */
export const PhoneInput = /* @__PURE__ */ React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (props, forwardedRef) => {
    const {
      value,
      defaultValue = '',
      onValueChange,
      defaultCountry,
      countries,
      onCountryChange,
      international = true,
      countryCallingCodeEditable = true,
      smartCaret = true,
      validation = 'possible',
      showCountrySelect = true,
      showInternationalOption = true,
      countryLabels,
      locale,
      variant = 'outlined',
      presentation = 'auto',
      name,
      form,
      disabled,
      readOnly,
      required,
      onChange,
      onBlur,
      onInvalid,
      className,
      style,
      dir,
      unstyled,
      tooltip,
      'aria-invalid': ariaInvalid,
      ...nativeProps
    } = props;
    const styles = useStyles();
    const { locale: providerLocale, t } = useTranslation();
    const direction = useDirection(dir === 'rtl' || dir === 'ltr' ? dir : undefined);
    const input = React.useRef<HTMLInputElement>(null);
    const controlled = Object.prototype.hasOwnProperty.call(props, 'value');
    const [localValue, setLocalValue] = React.useState(defaultValue);
    const [touched, setTouched] = React.useState(false);
    const [resetEpoch, setResetEpoch] = React.useState(0);
    const [editVersion, noteEdit] = React.useReducer((version: number) => version + 1, 0);
    const pendingEdit = React.useRef<string | undefined>(undefined);
    const restoreFocus = React.useRef<
      { start: number | null; end: number | null; country: boolean } | undefined
    >(undefined);
    const number = (controlled ? value : localValue) || '';
    const selectedCountry = React.useRef(defaultCountry);
    const allowedCountries = React.useMemo(
      () => (countries ? [...countries] : undefined),
      [countries],
    );
    const names = React.useMemo(() => {
      try {
        return new Intl.DisplayNames(locale ?? providerLocale, { type: 'region' });
      } catch {
        return new Intl.DisplayNames('en', { type: 'region' });
      }
    }, [locale, providerLocale]);
    const englishNames = React.useMemo(() => new Intl.DisplayNames('en', { type: 'region' }), []);
    const labels = React.useMemo(
      () => ({
        ...Object.fromEntries(
          supportedCountries.map((country) => [
            country,
            countryLabels?.[country] ?? names.of(country) ?? englishNames.of(country) ?? country,
          ]),
        ),
        ZZ: t('phone.international'),
        country: t('phone.country'),
        phone: t('phone.number'),
      }),
      [names, englishNames, countryLabels, t],
    );
    const details = phoneDetails(number);
    const error =
      disabled || readOnly
        ? ''
        : !number
          ? required
            ? t('phone.required')
            : ''
          : validation && !details[validation]
            ? t('phone.invalid')
            : '';
    // Engine resets replace the input; ordinary edits keep callback refs stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useImperativeHandle(forwardedRef, () => input.current!, [resetEpoch]);
    // The formatting engine keeps a draft. Reconcile only rejected controlled edits;
    // accepted typing never remounts and retains the engine's smart caret.
    useLayoutEffect(() => {
      const pending = pendingEdit.current;
      pendingEdit.current = undefined;
      if (!controlled || pending === undefined || pending === number) return;
      const node = input.current;
      const active = node?.ownerDocument.activeElement;
      if (
        node &&
        (active === node || active === node.parentElement?.querySelector('[data-slot="country"]'))
      ) {
        restoreFocus.current = {
          start: node.selectionStart,
          end: node.selectionEnd,
          country: active !== node,
        };
      }
      setResetEpoch((epoch) => epoch + 1);
    }, [controlled, number, editVersion]);
    useLayoutEffect(() => {
      const restore = restoreFocus.current;
      const node = input.current;
      if (!restore || !node) return;
      restoreFocus.current = undefined;
      if (restore.country)
        node.parentElement?.querySelector<HTMLButtonElement>('[data-slot="country"]')?.focus();
      else {
        node.focus();
        node.setSelectionRange(restore.start, restore.end);
      }
    }, [resetEpoch]);
    React.useEffect(() => {
      input.current?.setCustomValidity(error);
    }, [error, resetEpoch]);
    React.useEffect(() => {
      const formElement = input.current?.form;
      if (!formElement) return;
      const reset = (event: Event) => {
        queueMicrotask(() => {
          if (event.defaultPrevented) return;
          if (!controlled) setLocalValue(defaultValue);
          selectedCountry.current = defaultCountry;
          setTouched(false);
          setResetEpoch((epoch) => epoch + 1);
        });
      };
      formElement.addEventListener('reset', reset);
      return () => formElement.removeEventListener('reset', reset);
    }, [controlled, defaultValue, defaultCountry, form, resetEpoch]);
    const context: PhoneContextValue = {
      input,
      onNativeChange: onChange,
      onSelectCountry: (country) => {
        selectedCountry.current = country;
      },
      showCountrySelect,
      tooltip,
      englishNames,
      presentation,
    };
    return (
      <StyleProvider unstyled={unstyled}>
        <DirectionProvider dir={direction}>
          <PhoneContext.Provider value={context}>
            <PhoneNumberInput
              key={resetEpoch}
              {...nativeProps}
              {...styles(
                'phone-input.root',
                `ui-input-control ui-phone-input ${inputVariantClass(variant)}`,
                className,
                unstyled,
              )}
              style={style}
              containerComponentProps={{
                'data-ui': 'phone-input',
                'data-slot': 'root',
                'data-variant': variant,
                'data-disabled': disabled || undefined,
                'data-readonly': readOnly || undefined,
                dir: direction,
              }}
              aria-label={
                nativeProps['aria-label'] ??
                (nativeProps['aria-labelledby'] || nativeProps.id ? undefined : t('phone.number'))
              }
              aria-invalid={ariaInvalid ?? (touched && !!error ? true : undefined)}
              form={form}
              disabled={disabled}
              readOnly={readOnly}
              required={required}
              autoComplete={nativeProps.autoComplete ?? 'tel'}
              inputMode={nativeProps.inputMode ?? 'tel'}
              value={number || undefined}
              defaultCountry={defaultCountry}
              countries={allowedCountries}
              labels={labels}
              locales={names.resolvedOptions().locale}
              countrySelectComponent={PhoneCountryPicker}
              inputComponent={PhoneNumberField}
              focusInputOnCountrySelection={false}
              addInternationalOption={showInternationalOption}
              international={international}
              countryCallingCodeEditable={countryCallingCodeEditable}
              smartCaret={smartCaret}
              onChange={(next) => {
                const nextValue = next ?? '';
                if (controlled) {
                  pendingEdit.current = nextValue;
                  noteEdit();
                } else setLocalValue(nextValue);
                onValueChange?.(nextValue, phoneDetails(nextValue, selectedCountry.current));
              }}
              onCountryChange={(country) => {
                selectedCountry.current = country;
                onCountryChange?.(country);
              }}
              onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
                setTouched(true);
                onBlur?.(event);
              }}
              onInvalid={(event: React.InvalidEvent<HTMLInputElement>) => {
                setTouched(true);
                onInvalid?.(event);
              }}
            />
            {name && (
              <input type="hidden" name={name} form={form} value={number} disabled={disabled} />
            )}
          </PhoneContext.Provider>
        </DirectionProvider>
      </StyleProvider>
    );
  },
);
PhoneInput.displayName = 'PhoneInput';
