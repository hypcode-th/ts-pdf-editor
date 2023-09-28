import { BlendMode } from "pdf-lib"

export enum ElementType {
  Text = "text",
  Image = "image",
  Rectangle = "rectangle",
  Square = "square",
  Circle = "circle",
  Ellipse = "ellipse",
  Line = "line",
  SVGPath = "svgpath",
  CheckBox = "checkbox",
  Button = "buton",
  Dropdown = "dropdown",
  OptionList = "optionlist",
  RadioGroup = "radiogroup",
  RadioOption = "radiooption",
  TextField = "textfield",
  Signature = "signature",
  DateInput = "dateinput",
  DateSigned = "datesigned",
};

export interface Element {
  elemType: ElementType

  // element id for reference
  // if specify, it must be unique e.g. UUID
  id?: string

  // origin at bottom-left
  x?: number; 
  y?: number; 

  // size
  width?: number; 
  height?: number;

  // rotate in degree ccw around x,y
  rotate?: number;
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

export interface DrawableElement extends Element {
  blendMode?: BlendMode
  opacity?: number
  xSkew?: number; // in degree
  ySkew?: number; // in degree
}
