import { StyledElement } from '../element';

export interface Field extends StyledElement {
  name: string;
  exported?: boolean;
  readOnly?: boolean;
  required?: boolean;
}
