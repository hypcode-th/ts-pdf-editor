import { Field } from "./field";

export interface Signature extends Field {
  anchorString: string // Anchor string for DocuSign
  type: 'sign' | 'initial' | 'stamp' | 'datesigned'
}