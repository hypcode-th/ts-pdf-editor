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
  font?: string
  fontSize?: number
  text?: string
}
