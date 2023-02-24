import { BlendMode, LineCapStyle } from "pdf-lib"

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
  TextField = "textfield",
  Signature = "signature",
  DateInput = "dateinput",
};

export interface Element {
  elemType: ElementType

  // origin at bottom-left
  x?: number | undefined; 
  y?: number | undefined; 

  // size
  width?: number | undefined; 
  height?: number | undefined;

  // rotate in degree ccw around x,y
  rotate?: number | undefined;
}

export interface StyledElement extends Element {
  // styles
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number | undefined;
  font?: string;
  fontSize?: number | undefined;
  hidden?: boolean;
}

export interface DrawableElement extends Element {
  blendMode?: BlendMode;
  opacity?: number | undefined;
  xSkew?: number | undefined; // in degree
  ySkew?: number | undefined; // in degree
}
