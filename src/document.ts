import { Page } from "./page"

export interface Document {
  src?: string | Uint8Array | ArrayBuffer 
  pages: Page[] 
}
