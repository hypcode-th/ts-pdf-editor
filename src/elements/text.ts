import { DrawableElement } from './element';

export interface Text extends DrawableElement {
  //   options: PDFPageDrawTextOptions
  value: string;
  color?: string;
  font?: string;
  size?: number;
  lineHeight?: number;
  maxWidth?: number;
  wordBreaks?: string[];
}
