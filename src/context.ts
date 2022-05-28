import { degrees, PDFAcroPushButton, PDFButton, PDFDocument, PDFField, PDFFont, PDFImage, PDFPage, StandardFonts } from "pdf-lib";
import * as fontkit from '@pdf-lib/fontkit';
import * as fs from 'fs';
import { Document } from "./document";
import { Element } from "./elements/element";
import { Field, FieldStyle } from "./elements/fields/field";
import { CheckBox } from "./elements/fields/checkbox";
import { FieldAppearanceOptions } from "pdf-lib/cjs/api/form/PDFField";
import { addFieldToParent, colorFromHex, createFieldAppearanceOptions, findOrCreateNonTerminals, splitFieldName } from "./helper";
import { Button } from "./elements/fields/button";
import { Image } from "./elements/image";
import { UnsupportMimeType } from "./errors";
import { RadioGroup } from "./elements/fields/radio";
import { TextField } from "./elements/fields/textfield";
import { Signature } from "./elements/fields/signature";

export interface ContextOption {
  // mapping between custom font name and the font file path or binary of the font file
  customFontMap?: Map<string, string | Uint8Array | ArrayBuffer>

  // Default font when the font does not exist
  defaultFont?: StandardFonts
}

export class Context {
  private doc: Document
  private pdfDoc: PDFDocument
  private fontDict: Map<string, PDFFont>
  private options?: ContextOption

  private constructor(doc: Document, pdfDoc: PDFDocument, options: ContextOption) {
    this.doc = doc
    this.pdfDoc = pdfDoc
    this.fontDict = new Map<string, PDFFont>()
    this.options = options
  }

  public static create = async (doc: Document, options: ContextOption) => {
    let pdfDoc: PDFDocument
    if (doc.src) {
      pdfDoc = await PDFDocument.load(doc.src)
    } else {
      pdfDoc = await PDFDocument.create()
    }
    // Register fontkit
    pdfDoc.registerFontkit(fontkit)

    return new Context(doc, pdfDoc, options)
  }

  protected async getFont(fontName: string): Promise<PDFFont> {
    let font = this.fontDict.get(fontName)
    if (font) return font

    var stdFont: StandardFonts = (<any>StandardFonts)[fontName]
    if (stdFont) {
      font = this.pdfDoc.embedStandardFont(stdFont)
    } else if (this.options?.customFontMap) {
      const fontByte = this.options.customFontMap.get(fontName)
      if (fontByte) {
        font = await this.pdfDoc.embedFont(fontByte)
      }
    }
    if (!font) {
      const defautlFont = (this.options?.defaultFont) ? this.options.defaultFont : StandardFonts.Helvetica
      return await this.getFont(defautlFont)
    }
    this.fontDict.set(fontName, font)
    return font
  }

  protected async getImage(img: Image): Promise<PDFImage> {
    switch (img.mimeType) {
    case 'image/jpg':
    case 'image/jpeg':
      return await this.pdfDoc.embedJpg(img.src)
    case 'image/png':
      return await this.pdfDoc.embedPng(img.src)
    default:
      throw new UnsupportMimeType(img.mimeType)
    }
  }

  protected updatePDFField(pdfField: PDFField, field: Field) {
    if (field.exported === true) {
      pdfField.enableExporting()
    } else if (field.exported === false) {
      pdfField.disableExporting()
    }
    if (field.readOnly === true) {
      pdfField.enableReadOnly()
    } else if (field.readOnly === false) {
      pdfField.disableReadOnly()
    }
    if (field.required === true) {
      pdfField.enableRequired()
    } else if (field.required === false) {
      pdfField.disableRequired()
    }
  }

  protected async addButton(page: PDFPage, button: Button): Promise<void> {
    const form = page.doc.getForm()
    const field = form.createButton(button.name)
    this.updatePDFField(field, button)
    if (button.fontSize) {
      field.setFontSize(button.fontSize)
    }
    if (button.image) {
      const pdfImg = await this.getImage(button.image)
      if (pdfImg) {
        field.setImage(pdfImg, button.imageAlignment)
      }
    }
    const options = createFieldAppearanceOptions(button, button.style)
    field.addToPage(button.text, page, options)
  }
  
  protected addCheckBox(page: PDFPage, checkBox: CheckBox) {
    const form = page.doc.getForm()
    const field = form.createCheckBox(checkBox.name)
    this.updatePDFField(field, checkBox)
    if (checkBox.checked === true) {
      field.check()
    } else if (checkBox.checked === false) {
      field.uncheck()
    }
    const options = createFieldAppearanceOptions(checkBox)
    field.addToPage(page, options)
  }

  protected addRadioGroup(page: PDFPage, radioGroup: RadioGroup) {
    const form = page.doc.getForm()
    const field = form.createRadioGroup(radioGroup.name)
    this.updatePDFField(field, radioGroup)
    radioGroup.options?.forEach((radioOption) => {
      const options = createFieldAppearanceOptions(radioOption, radioOption.style)
      field.addOptionToPage(radioOption.option, page, options)
    })
    if (radioGroup.selectedOpton) {
      field.select(radioGroup.selectedOpton)
    }
  }

  protected async addTextField(page: PDFPage, textField: TextField): Promise<void> {
    const form = page.doc.getForm()
    const field = form.createTextField(textField.name)
    this.updatePDFField(field, textField)
    
    if (textField.combing === true) {
      field.enableCombing()
    } else if (textField.combing === false) {
      field.disableCombing()
    }
    if (textField.fileSelection === true) {
      field.enableFileSelection()
    } else if (textField.fileSelection === false) {
      field.disableFileSelection()
    }
    if (textField.multiline === true) {
      field.enableMultiline()
    } else if (textField.multiline === false) {
      field.disableMultiline()
    }
    if (textField.password === true) {
      field.enablePassword()
    } else if (textField.password === false) {
      field.disablePassword()
    }
    if (textField.richFormatting === true) {
      field.enableRichFormatting()
    } else if (textField.richFormatting === false) {
      field.disableRichFormatting()
    }
    if (textField.scrolling === true) {
      field.enableScrolling()
    } else if (textField.scrolling === false) {
      field.disableScrolling()
    }
    if (textField.spellChecking === true) {
      field.enableSpellChecking()
    } else if (textField.spellChecking === false) {
      field.disableSpellChecking()
    }
    if (textField.maxLength) {
      field.setMaxLength(textField.maxLength)
    }
    if (textField.alignment) {
      field.setAlignment(textField.alignment)
    }
    if (textField.fontSize) {
      field.setFontSize(textField.fontSize)
    }
    if (textField.text) {
      field.setText(textField.text)
    }
    const options = createFieldAppearanceOptions(textField)
    if (textField.font) {
      options.font = await this.getFont(textField.font)
    }
    field.addToPage(page, options)
  }

  addSignature(page: PDFPage, signature: Signature) {
    const form = page.doc.getForm()
    const nameParts = splitFieldName(signature.name);
    const parent = findOrCreateNonTerminals(form, nameParts.nonTerminal);
    // const sig = PDFAcroSignature.
    const sig = PDFAcroPushButton.create(form.doc.context);
    sig.setPartialName(nameParts.terminal);
    addFieldToParent(parent, [sig, sig.ref], nameParts.terminal);
    const field = PDFButton.of(sig, sig.ref, form.doc);
    this.updatePDFField(field, signature)
    const options = createFieldAppearanceOptions(signature)
    field.addToPage("", page, options)
  }
}