export enum ElementType {
  Text = "text",
  Image = "image",
  Rectangle = "rectangle",
  Square = "square",
  Circle = "circle",
  Oval = "oval",
  Line = "line",
  CheckBox = "checkbox",
  Button = "buton",
  Dropdown = "dropdown",
  OptionList = "optionlist",
  RadioGroup = "radiogroup",
  TextField = "textfield",
  Signature = "signature",
};

export interface Element {
  elemType: ElementType

  // origin at bottom-left
  x: number 
  y: number 

  // size
  width: number 
  height: number

  // rotate in degree ccw around x,y
  rotate: number
}

export interface StyledElement extends Element {
  // styles
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  font?: string;
  fontSize?: number;
  hidden?: boolean;
}