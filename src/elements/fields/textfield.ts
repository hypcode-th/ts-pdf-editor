import { TextAlignment } from "pdf-lib";
import { Field } from "./field";

export interface TextField extends Field {
  combing?: boolean
  fileSelection?: boolean
  multiline?: boolean
  password?: boolean
  richFormatting?: boolean
  scrolling?: boolean
  spellChecking?: boolean
  maxLength?: number
  alignment?: TextAlignment
  text?: string

  // Additional attributes
  fitWidth?: boolean
  fitHeight?: boolean

  style?: 'text' | 'decimal' | 'currency' | 'percent' | 'percent_value'
  locale?: string
  currency?: string
  currencyDisplay?: 'symbol' | 'code' | 'name'
  maximumFractionDigits?: number 
  maximumSignificantDigits?: number 
  minimumFractionDigits?: number 
  minimumIntegerDigits?: number
  minimumSignificantDigits?: number 
}
