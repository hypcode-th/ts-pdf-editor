import { Field } from './field';
import { StyledElement } from '../element';

export interface RadioOption extends StyledElement {
  option: string;
}

export interface RadioGroup extends Field {
  options?: RadioOption[];
  selectedOption?: string;
}
