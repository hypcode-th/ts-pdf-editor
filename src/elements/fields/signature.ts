import { Field } from "./field";

export interface Signature extends Field {
  signerId: string
  type: string // 'sign', 'initial', 'stamp'
}