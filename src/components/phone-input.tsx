import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import InternationalPhoneInput, {
  getCountryCallingCode,
  type Country,
} from "react-phone-number-input";
import es from "react-phone-number-input/locale/es";
import en from "react-phone-number-input/locale/en";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/language-switch";
import { normalizePhone } from "@/lib/phone";

type CountrySelectProps = {
  value?: Country;
  onChange: (country?: Country) => void;
  options: { value?: Country; label: string; divider?: boolean }[];
  disabled?: boolean;
  readOnly?: boolean;
  onFocus?: ComponentProps<"select">["onFocus"];
  onBlur?: ComponentProps<"select">["onBlur"];
  "aria-label"?: string;
};

function CountrySelect({
  value,
  onChange,
  options,
  disabled,
  readOnly,
  onFocus,
  onBlur,
  "aria-label": label,
}: CountrySelectProps) {
  return (
    <select
      aria-label={label}
      value={value ?? ""}
      onChange={(event) => onChange((event.target.value || undefined) as Country | undefined)}
      disabled={disabled || readOnly}
      onFocus={onFocus}
      onBlur={onBlur}
      className="h-11 w-full min-w-0 rounded-md border border-input bg-card px-3 text-base text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50"
    >
      {options
        .filter((option) => !option.divider)
        .map((option) => (
          <option key={option.value ?? "international"} value={option.value ?? ""}>
            {option.label}
            {option.value ? ` (+${getCountryCallingCode(option.value)})` : ""}
          </option>
        ))}
    </select>
  );
}

const NumberInput = forwardRef<
  HTMLInputElement,
  ComponentProps<"input"> & { validationMessage: string }
>(({ validationMessage, ...props }, ref) => {
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => input.current!, []);
  useEffect(() => {
    input.current?.setCustomValidity(validationMessage);
  }, [validationMessage]);
  return <Input {...props} ref={input} className="min-w-0" />;
});
NumberInput.displayName = "NumberInput";

type PhoneInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
};

export function PhoneInput({ id, value, onChange, required, disabled }: PhoneInputProps) {
  const { locale, t } = useI18n();
  const [touched, setTouched] = useState(false);
  const invalid = Boolean(value) && !normalizePhone(value);
  const error = t("contactBadPhone");

  return (
    <div className="min-w-0 space-y-1.5">
      <InternationalPhoneInput
        id={id}
        defaultCountry="US"
        labels={locale === "es" ? es : en}
        countrySelectComponent={CountrySelect}
        countrySelectProps={{ "aria-label": t("phoneCountry") }}
        inputComponent={NumberInput}
        numberInputProps={{ validationMessage: invalid ? error : "" }}
        className="grid min-w-0 gap-2"
        value={value ? (normalizePhone(value) ?? value) : undefined}
        onChange={(next) => onChange(next ?? "")}
        onBlur={() => setTouched(true)}
        required={required}
        disabled={disabled}
        autoComplete="tel"
        inputMode="tel"
        placeholder={t("contactPhonePh")}
        aria-describedby={`${id}-hint`}
        aria-invalid={touched && invalid ? true : undefined}
      />
      <p
        id={`${id}-hint`}
        className={
          touched && invalid ? "text-xs text-destructive" : "text-xs text-muted-foreground"
        }
        aria-live="polite"
      >
        {touched && invalid ? error : t("phoneCountryHint")}
      </p>
    </div>
  );
}
