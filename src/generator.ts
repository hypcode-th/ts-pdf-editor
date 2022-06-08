import { degrees, PageSizes, PDFAcroPushButton, PDFButton, PDFDocument, PDFField, PDFFont, PDFImage, PDFPage, rgb, StandardFonts } from "pdf-lib";
import * as fontkit from '@pdf-lib/fontkit';
import { IDocument } from "./document";
import { Element, ElementType } from "./elements/element";
import { Field } from "./elements/fields/field";
import { CheckBox } from "./elements/fields/checkbox";
import { addFieldToParent, colorFromHex, findOrCreateNonTerminals, splitFieldName, Uint8ArrayToBuffer } from "./helper";
import { Button } from "./elements/fields/button";
import { Image } from "./elements/image";
import { EmptyImageSource, UnsupportMimeType } from "./errors";
import { RadioGroup } from "./elements/fields/radio";
import { TextField } from "./elements/fields/textfield";
import { Signature } from "./elements/fields/signature";
import { FieldAppearanceOptions } from "pdf-lib/cjs/api/form/PDFField";
import { Dropdown } from "./elements/fields/dropdown";
import { OptionList } from "./elements/fields/optionlist";
import { Text } from "./elements/text";

export interface PDFFileGeneratorOption {
  // mapping between custom font name and the font file path or binary of the font file
  customFontMap?: Map<string, string | Uint8Array | ArrayBuffer>

  // Default font when the font does not exist
  defaultFont?: StandardFonts
}

export class PDFFileGenerator {
  private doc: IDocument
  private pdfDoc: PDFDocument
  private fontDict: Map<string, PDFFont>
  private imageDict: Map<string, PDFImage>
  private options?: PDFFileGeneratorOption

  protected constructor(doc: IDocument, pdfDoc: PDFDocument, options?: PDFFileGeneratorOption) {
    this.doc = doc
    this.pdfDoc = pdfDoc
    this.fontDict = new Map<string, PDFFont>()
    this.imageDict = new Map<string, PDFImage>()
    this.options = options
  }

  public static async create(doc: IDocument, options?: PDFFileGeneratorOption): Promise<PDFFileGenerator> {
    // Create an empty PDF document
    let pdfDoc = await PDFDocument.create()

    // Register fontkit
    if (options?.customFontMap) {
      pdfDoc.registerFontkit(fontkit)
    }

    return new PDFFileGenerator(doc, pdfDoc, options)
  }

  public generate = async (): Promise<Buffer> => {
    // Load all reference file
    const fileRefDict = new Map<string, PDFDocument>()
    for (let exf of this.doc.fileReferences) {
      if (!exf.src) continue
      const exfDoc = await PDFDocument.load(exf.src)
      fileRefDict.set(exf.refId, exfDoc)
    }

    // Process each page
    let pageIndex = 0
    for (let page of this.doc.pages) {
      let pdfPage: PDFPage | undefined
      // If the page is a reference to the PDF file
      if (page.refFileId) {
        if (page.refPageIndex === undefined) {
          throw new Error("reference page index is missing")
        }
        if (page.refPageIndex < 0) {
          throw new Error("reference page index must be greater or equal to zero")
        }
        let refDoc = fileRefDict.get(page.refFileId)
        if (!refDoc) {
          throw new Error(`a file reference by the page ${pageIndex} is not found`)
        }
        try {
          let copiedPages = await this.pdfDoc.copyPages(refDoc, [page.refPageIndex])
          pdfPage = this.pdfDoc.addPage(copiedPages[0])
        } catch (err) {
          console.log(err)
          throw err
        }
      } else if (page.pageSize) {
        const { width, height } = page.pageSize
        pdfPage = this.pdfDoc.addPage([width, height])
      } else if (this.doc.defaultPageSize) {
        const { width, height } = this.doc.defaultPageSize
        pdfPage = this.pdfDoc.addPage([width, height])
      } else {
        pdfPage = this.pdfDoc.addPage(PageSizes.A4)
      }

      // set the default style of the page
      const font = await this.getFont(page.font ? page.font : StandardFonts.Helvetica)
      pdfPage.setFont(font)
      pdfPage.setFontSize(page.fontSize ? page.fontSize : 16)
      pdfPage.setFontColor(page.textColor ? colorFromHex(page.textColor)! : rgb(0,0,0))

      // render elements if any
      if (page.elements) {
        for (let elem of page.elements) {
          await this.createPDFElement(pdfPage, elem)
        }
      }
      pageIndex++
    }

    const data = await this.pdfDoc.save()
    return Uint8ArrayToBuffer(data)
  }

  protected async createPDFElement(page: PDFPage, elem: any): Promise<void> {
    switch (elem.elemType) {
      case ElementType.TextField:
        return await this.addTextField(page, elem)
      case ElementType.CheckBox:
        return await this.addCheckBox(page, elem)
      case ElementType.Signature:
        return await this.addSignature(page, elem)
      case ElementType.RadioGroup:
        return await this.addRadioGroup(page, elem)
      case ElementType.Dropdown:
        return await this.addDropdown(page, elem)
      case ElementType.OptionList:
        return await this.addOptionList(page, elem)
      case ElementType.Button:
        return await this.addButton(page, elem)
      case ElementType.Image:
        return await this.drawImage(page, elem)
      case ElementType.Text:
        return await this.drawText(page, elem)
    }
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
    if (!img.src) {
      throw new EmptyImageSource()
    }

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

  protected async updatePDFField(pdfField: PDFField, field: Field) {
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
    const pdfFont = await this.getFont(StandardFonts.Helvetica)
    if (pdfFont) {
      pdfField.defaultUpdateAppearances(pdfFont)
    }
  }

  protected async createFieldAppearanceOptions(element: any): Promise<FieldAppearanceOptions> {
    const { x, y, width, height, rotate } = element
    let pdfFont: PDFFont | undefined = undefined
    if (element.font) {
      pdfFont = await this.getFont(element.font)
    }
    return {
      x,
      y,
      width,
      height,
      rotate: degrees(rotate),
      textColor: (element.textColor) ? colorFromHex(element.textColor) : undefined,
      backgroundColor: (element.backgroundColor) ? colorFromHex(element.backgroundColor) : undefined,
      borderColor: (element.borderColor) ? colorFromHex(element.borderColor) : undefined,
      borderWidth: element.borderWidth,
      hidden: element.hidden,
      font: pdfFont,
    }
  }

  protected async addButton(page: PDFPage, button: Button): Promise<void> {
    const form = page.doc.getForm()
    const field = form.createButton(button.name)
    await this.updatePDFField(field, button)

    if (button.fontSize) {
      field.setFontSize(button.fontSize)
    }
    if (button.image) {
      const pdfImg = await this.getImage(button.image)
      if (pdfImg) {
        field.setImage(pdfImg, button.imageAlignment)
      }
    }
    const options = await this.createFieldAppearanceOptions(button)
    field.addToPage(button.text, page, options)
  }

  protected async addCheckBox(page: PDFPage, checkBox: CheckBox): Promise<void> {
    const form = page.doc.getForm()
    const field = form.createCheckBox(checkBox.name)
    await this.updatePDFField(field, checkBox)

    if (checkBox.checked === true) {
      field.check()
    } else if (checkBox.checked === false) {
      field.uncheck()
    }
    const options = await this.createFieldAppearanceOptions(checkBox)
    field.addToPage(page, options)
  }

  protected async addDropdown(page: PDFPage, dropdown: Dropdown): Promise<void> {
    const form = page.doc.getForm()
    const field = form.createDropdown(dropdown.name)
    await this.updatePDFField(field, dropdown)

    if (dropdown.options) {
      field.setOptions(dropdown.options)
    }
    if (dropdown.editable === true) {
      field.enableEditing()
    } else if (dropdown.editable === false) {
      field.disableEditing()
    }
    if (dropdown.multiselect === true) {
      field.enableMultiselect()
    } else if (dropdown.multiselect === false) {
      field.disableMultiselect()
    }
    if (dropdown.selectOnClick === true) {
      field.enableSelectOnClick()
    } else if (dropdown.selectOnClick === false) {
      field.disableSelectOnClick()
    }
    if (dropdown.sorted === true) {
      field.enableSorting()
    } else if (dropdown.sorted === false) {
      field.disableSorting()
    }
    if (dropdown.spellChecked === true) {
      field.enableSpellChecking()
    } else if (dropdown.spellChecked === false) {
      field.disableSpellChecking()
    }
    if (dropdown.selectedOptions) {
      field.select(dropdown.selectedOptions, false)
    }
    if (dropdown.fontSize) {
      field.setFontSize(dropdown.fontSize)
    }
    const options = await this.createFieldAppearanceOptions(dropdown)
    field.addToPage(page, options)
  }

  protected async addOptionList(page: PDFPage, optionList: OptionList): Promise<void> {
    const form = page.doc.getForm()
    const field = form.createOptionList(optionList.name)
    await this.updatePDFField(field, optionList)

    if (optionList.options) {
      field.setOptions(optionList.options)
    }
    if (optionList.multiselect === true) {
      field.enableMultiselect()
    } else if (optionList.multiselect === false) {
      field.disableMultiselect()
    }
    if (optionList.selectOnClick === true) {
      field.enableSelectOnClick()
    } else if (optionList.selectOnClick === false) {
      field.disableSelectOnClick()
    }
    if (optionList.sorted === true) {
      field.enableSorting()
    } else if (optionList.sorted === false) {
      field.disableSorting()
    }
    if (optionList.selectedOptions) {
      field.select(optionList.selectedOptions, false)
    }
    if (optionList.fontSize) {
      field.setFontSize(optionList.fontSize)
    }
    const options = await this.createFieldAppearanceOptions(optionList)
    field.addToPage(page, options)
  }

  protected async addRadioGroup(page: PDFPage, radioGroup: RadioGroup): Promise<void> {
    const form = page.doc.getForm()
    const field = form.createRadioGroup(radioGroup.name)
    this.updatePDFField(field, radioGroup)

    if (radioGroup.options) {
      for (const radioOption of radioGroup.options) {
        const options = await this.createFieldAppearanceOptions(radioOption)
        field.addOptionToPage(radioOption.option, page, options)
      }
    }
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
    const options = await this.createFieldAppearanceOptions(textField)
    field.addToPage(page, options)
  }

  protected async addSignature(page: PDFPage, signature: Signature): Promise<void> {
    const form = page.doc.getForm()
    const nameParts = splitFieldName(signature.name);
    const parent = findOrCreateNonTerminals(form, nameParts.nonTerminal);
    // const sig = PDFAcroSignature.
    const sig = PDFAcroPushButton.create(form.doc.context);
    sig.setPartialName(nameParts.terminal);
    addFieldToParent(parent, [sig, sig.ref], nameParts.terminal);
    const field = PDFButton.of(sig, sig.ref, form.doc);
    this.updatePDFField(field, signature)
    const options = await this.createFieldAppearanceOptions(signature)
    field.addToPage("", page, options)
  }

  protected async drawImage(page: PDFPage, img: Image): Promise<void> {
    const pdfImg = await this.getImage(img)
    const { x, y, width, height, rotate, xSkew, ySkew, opacity, blendMode } = img
    if (pdfImg) {
      page.drawImage(pdfImg, {
        x,
        y,
        width,
        height,
        rotate: degrees(rotate),
        xSkew: xSkew ? degrees(xSkew) : undefined,
        ySkew: ySkew ? degrees(ySkew) : undefined,
        opacity: opacity,
        blendMode: blendMode,
      })
    }
  }

  protected async drawText(page: PDFPage, text: Text): Promise<void> {
    const { value, color, font, size, wordBreaks, x, y, maxWidth, lineHeight, rotate, xSkew, ySkew, opacity, blendMode } = text
    let pdfFont: PDFFont | undefined = undefined
    if (font) {
      pdfFont = await this.getFont(font)
    }
    page.drawText(value, {
      font: pdfFont,
      x,
      y,
      maxWidth,
      lineHeight,
      size,
      color: color ? colorFromHex(color) : undefined,
      rotate: rotate ? degrees(rotate) : undefined,
      xSkew: xSkew ? degrees(xSkew) : undefined,
      ySkew: ySkew ? degrees(ySkew) : undefined,
      opacity,
      blendMode,
      wordBreaks,
    })
  }
}