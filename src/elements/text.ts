import { BlendMode, PDFPageDrawTextOptions } from "pdf-lib";
import { Field } from "./fields/field";

export interface Text extends Field {
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