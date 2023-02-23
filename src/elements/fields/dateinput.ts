import { TextAlignment } from "pdf-lib";
import { Field } from "./field";

export interface DateInput extends Field {
  combing?: boolean
  multiline?: boolean
  scrolling?: boolean
  maxLength?: number
  alignment?: TextAlignment
  date?: Date
  format?: string
  timezone?: string
}
