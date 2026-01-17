import { NumericFormat, type NumericFormatProps } from "react-number-format";
import { Input } from "./input";

export function CurrencyInput({
  thousandSeparator = true,
  decimalScale = 2,
  fixedDecimalScale = true,
  autoComplete = "off",
  ...props
}: NumericFormatProps) {
  return (
    <NumericFormat
      autoComplete={autoComplete}
      customInput={Input}
      decimalScale={decimalScale}
      fixedDecimalScale={fixedDecimalScale}
      thousandSeparator={thousandSeparator}
      {...props}
    />
  );
}
