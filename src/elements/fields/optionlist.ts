import { Field } from './field';

export interface OptionList extends Field {
  options?: string[];
  multiselect?: boolean;
  selectOnClick?: boolean;
  sorted?: boolean;
  selectedOptions: string[];
}
