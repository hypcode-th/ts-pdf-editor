import { BlendMode, PDFDocument, PDFImage, PDFPage, PDFPageDrawImageOptions } from 'pdf-lib'
import { UnsupportMimeType } from '../errors'
import { Element } from './element'

export interface Image extends Element {
  src: string | Uint8Array | ArrayBuffer
  mimeType: string
  xSkew?: number;  // in degree
  ySkew?: number; // in degree
  opacity?: number;
  blendMode?: BlendMode;
}
