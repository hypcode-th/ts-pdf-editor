import { Field } from './field';

export interface Dropdown extends Field {
  options?: string[];
  editable?: boolean;
  multiselect?: boolean;
  selectOnClick?: boolean;
  sorted?: boolean;
  spellChecked?: boolean;
  selectedOptions: string[];
}
