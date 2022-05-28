import { Field, FieldStyle } from "./field"
import { Element } from "../element"

export interface RadioOption extends Element {
  option: string 
  style?: FieldStyle
};

export interface RadioGroup extends Field {
  options?: RadioOption[]
  selectedOpton?: string
}