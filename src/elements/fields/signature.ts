import { PDFAcroSignature, PDFField, PDFForm, PDFPage, PDFSignature } from "pdf-lib";
import { FieldAppearanceOptions } from "pdf-lib/cjs/api/form/PDFField";
import { addFieldToParent, findOrCreateNonTerminals, splitFieldName } from "../../helper";
import { Field } from "./field";

export interface Signature extends Field {
  signerId: string
  type: string // 'sign', 'initial', 'stamp'
}