export enum ElementType {
  Text = "text",
  Image = "image",
  Rectangle = "rectangle",
  Square = "square",
  Circle = "circle",
  Oval = "oval",
  Line = "line",
  CheckBox = "checkbox",
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
