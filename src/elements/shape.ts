import { LineCapStyle } from 'pdf-lib';
import { DrawableElement } from './element';

export interface Point {
  x: number;
  y: number;
}

export interface DrawablePath extends DrawableElement {
  borderColor?: string;
  borderDashArray?: number[];
  borderDashPhase?: number;
  borderLineCap?: LineCapStyle;
  borderOpacity?: number;
  borderWidth?: number;
  color?: string;
}

export interface Circle extends DrawablePath {
  size?: number;
}

export interface Ellipse extends DrawablePath {
  xScale?: number;
  yScale?: number;
}

// export interface Rectangle extends DrawablePath {}

export interface Square extends DrawablePath {
  size?: number;
}

export interface Line extends DrawableElement {
  color?: string;
  dashArray?: number[];
  dashPhase?: number;
  end: Point;
  lineCap?: LineCapStyle;
  start: Point;
  thickness?: number;
}

export interface SVGPath extends DrawablePath {
  scale?: number;
  points?: Point[];
}
