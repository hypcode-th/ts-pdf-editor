import { BlendMode } from "pdf-lib";
import { Element } from './element'

export interface Text extends Element {
//   options: PDFPageDrawTextOptions
  value: string;
  color?: string;
  opacity?: number;
  blendMode?: BlendMode;
  font?: string;
  size?: number;
  xSkew?: number; // in degree
  ySkew?: number; // in degree
  lineHeight?: number;
  maxWidth?: number;
  wordBreaks?: string[];
}