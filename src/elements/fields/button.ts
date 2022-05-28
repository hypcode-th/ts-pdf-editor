import { ImageAlignment } from "pdf-lib";
import { Image } from "../image";
import { Field } from "./field";

export interface Button extends Field {
  text: string
  font?: string
  fontSize?: number
  image?: Image
  imageAlignment?: ImageAlignment
}
