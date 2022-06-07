import { Element } from '../element'


export interface Field extends Element {
  name: string
  exported?: boolean 
  readOnly?: boolean 
  required?: boolean
  
  // styles
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  font?: string;
  fontSize?: number;
  hidden?: boolean;
}

