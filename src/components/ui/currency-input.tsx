import { NumericFormat, type NumericFormatProps } from 'react-number-format'
import { Input } from './input'

export function CurrencyInput({
  thousandSeparator = true,
  decimalScale = 2,
  fixedDecimalScale = true,
  autoComplete = 'off',
  ...props
}: NumericFormatProps) {
  return (
    <NumericFormat
      thousandSeparator={thousandSeparator}
      decimalScale={decimalScale}
      fixedDecimalScale={fixedDecimalScale}
      customInput={Input}
      autoComplete={autoComplete}
      {...props}
    />
  )
}
