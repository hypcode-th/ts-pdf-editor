import { BlendMode } from 'pdf-lib';
import { DrawableElement } from './element';

export interface Image extends DrawableElement {
  src: string | Uint8Array | ArrayBuffer;
  mimeType: string;
}
