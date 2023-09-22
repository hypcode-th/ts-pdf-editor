import {
  degrees,
  PageSizes,
  PDFDocument,
  PDFField,
  PDFFont,
  PDFImage,
  PDFPage,
  PDFPageDrawSVGOptions,
  rgb,
  StandardFonts,
} from 'pdf-lib';
import * as fontkit from '@pdf-lib/fontkit';
import { IDocument } from './document';
import { ElementType } from './elements/element';
import { Field } from './elements/fields/field';
import { CheckBox } from './elements/fields/checkbox';
import { colorFromHex, Uint8ArrayToBuffer } from './helper';
import { Button } from './elements/fields/button';
import { Image } from './elements/image';
import { UnsupportMimeType } from './errors/unsupport-mime-type';
import { EmptyImageSource } from './errors/empty-image-source';
import { RadioGroup } from './elements/fields/radio';
import { TextField } from './elements/fields/textfield';
import { Signature } from './elements/fields/signature';
import { FieldAppearanceOptions } from 'pdf-lib/cjs/api/form/PDFField';
import { Dropdown } from './elements/fields/dropdown';
import { OptionList } from './elements/fields/optionlist';
import { Text } from './elements/text';
import { Circle, Ellipse, Line, DrawablePath, Square, SVGPath } from './elements/shape';
import { DateInput } from './elements/fields/dateinput';
import * as moment from 'moment-timezone';

export interface PDFFileGeneratorOption {
  // mapping between custom font name and the font file path or binary of the font file
  customFontMap?: Map<string, string | Uint8Array | ArrayBuffer>;

  // Default font when the font does not exist
  defaultFont?: StandardFonts;
}

export function filterCharSet (v: string, font: PDFFont) {
  const charSet = font.getCharacterSet()
  for (let i = 0; i < v.length; i++) {
    const cp  = v.codePointAt(i)
    if (cp) {
      if (v[i] && !charSet.includes(cp)) {
        v = v.substring(0, i) + '?' + v.substring(i + 1);
      }
    }
  }
  v = v.replace(/[\uE000-\uF8FF]/g, '?')
  // v = v.replace(/[^\w\s!?{}()-;:"'*@#$%&+=]/g, '?')
  return v
}

export class PDFFileGenerator {
  private doc: IDocument;
  private pdfDoc: PDFDocument;
  private fontDict: Map<string, PDFFont>;
  private imageDict: Map<string, PDFImage>;
  private options?: PDFFileGeneratorOption;

  protected constructor(doc: IDocument, pdfDoc: PDFDocument, options?: PDFFileGeneratorOption) {
    this.doc = doc;
    this.pdfDoc = pdfDoc;
    this.fontDict = new Map<string, PDFFont>();
    this.imageDict = new Map<string, PDFImage>();
    this.options = options;
  }

  public static async create(doc: IDocument, options?: PDFFileGeneratorOption): Promise<PDFFileGenerator> {
    // Create an empty PDF document
    const pdfDoc = await PDFDocument.create();

    // Register fontkit
    if (options?.customFontMap) {
      pdfDoc.registerFontkit(fontkit);
    }

    return new PDFFileGenerator(doc, pdfDoc, options);
  }

  public generate = async (): Promise<Buffer> => {
    // Load all reference file
    const fileRefDict = new Map<string, PDFDocument>();
    for (const exf of this.doc.fileReferences) {
      if (!exf.src) continue;
      const exfDoc = await PDFDocument.load(exf.src);
      fileRefDict.set(exf.refId, exfDoc);
    }

    // Process each page
    let pageIndex = 0;
    for (const page of this.doc.pages) {
      let pdfPage: PDFPage | undefined;
      // If the page is a reference to the PDF file
      if (page.refFileId) {
        if (page.refPageIndex === undefined) {
          throw new Error('reference page index is missing');
        }
        if (page.refPageIndex < 0) {
          throw new Error('reference page index must be greater or equal to zero');
        }
        const refDoc = fileRefDict.get(page.refFileId);
        if (!refDoc) {
          throw new Error(`a file reference by the page ${pageIndex} is not found`);
        }
        try {
          const copiedPages = await this.pdfDoc.copyPages(refDoc, [page.refPageIndex]);
          pdfPage = this.pdfDoc.addPage(copiedPages[0]);
        } catch (err) {
          throw err;
        }
      } else if (page.pageSize) {
        const { width, height } = page.pageSize;
        pdfPage = this.pdfDoc.addPage([width, height]);
      } else if (this.doc.defaultPageSize) {
        const { width, height } = this.doc.defaultPageSize;
        pdfPage = this.pdfDoc.addPage([width, height]);
      } else {
        pdfPage = this.pdfDoc.addPage(PageSizes.A4);
      }

      // set the default style of the page
      const font = await this.getFont(page.font ? page.font : StandardFonts.Helvetica);
      pdfPage.setFont(font);
      pdfPage.setFontSize(page.fontSize ? page.fontSize : 16);
      pdfPage.setFontColor(page.textColor ? colorFromHex(page.textColor)! : rgb(0, 0, 0));

      // render elements if any
      if (page.elements) {
        for (const elem of page.elements) {
          await this.createPDFElement(pdfPage, elem);
        }
      }
      pageIndex++;
    }

    const data = await this.pdfDoc.save();
    return Uint8ArrayToBuffer(data);
  };

  protected async createPDFElement(page: PDFPage, elem: any): Promise<void> {
    switch (elem.elemType) {
      case ElementType.TextField:
        return await this.addTextField(page, elem);
      case ElementType.DateInput:
        return await this.addDateInput(page, elem);
      case ElementType.CheckBox:
        return await this.addCheckBox(page, elem);
      case ElementType.Signature:
        return await this.addSignature(page, elem);
      case ElementType.RadioGroup:
        return await this.addRadioGroup(page, elem);
      case ElementType.Dropdown:
        return await this.addDropdown(page, elem);
      case ElementType.OptionList:
        return await this.addOptionList(page, elem);
      case ElementType.Button:
        return await this.addButton(page, elem);
      case ElementType.Image:
        return await this.drawImage(page, elem);
      case ElementType.Text:
        return await this.drawText(page, elem);
      case ElementType.SVGPath:
        return await this.drawSVGPath(page, elem);
      case ElementType.Line:
        return await this.drawLine(page, elem);
      case ElementType.Circle:
        return await this.drawCircle(page, elem);
      case ElementType.Ellipse:
        return await this.drawEllipse(page, elem);
      case ElementType.Rectangle:
        return await this.drawRectangle(page, elem);
      case ElementType.Square:
        return await this.drawSquare(page, elem);
    }
  }

  protected async getFont(fontName: string): Promise<PDFFont> {
    let font = this.fontDict.get(fontName);
    if (font) return font;

    if (Object.values(StandardFonts).includes(fontName as StandardFonts)) {
      font = this.pdfDoc.embedStandardFont(fontName as StandardFonts);
    } else if (this.options?.customFontMap) {
      const fontByte = this.options.customFontMap.get(fontName);
      if (fontByte) {
        font = await this.pdfDoc.embedFont(fontByte);
      }
    }
    if (!font) {
      const defautlFont = this.options?.defaultFont ? this.options.defaultFont : StandardFonts.Helvetica;
      return await this.getFont(defautlFont);
    }
    this.fontDict.set(fontName, font);
    return font;
  }

  protected async getImage(img: Image): Promise<PDFImage> {
    if (!img.src) {
      throw new EmptyImageSource();
    }

    switch (img.mimeType) {
      case 'image/jpg':
      case 'image/jpeg':
        return await this.pdfDoc.embedJpg(img.src);
      case 'image/png':
        return await this.pdfDoc.embedPng(img.src);
      default:
        throw new UnsupportMimeType(img.mimeType);
    }
  }

  protected async updatePDFField(pdfField: PDFField, field: Field) {
    if (field.exported === true) {
      pdfField.enableExporting();
    } else if (field.exported === false) {
      pdfField.disableExporting();
    }
    if (field.readOnly === true) {
      pdfField.enableReadOnly();
    } else if (field.readOnly === false) {
      pdfField.disableReadOnly();
    }
    if (field.required === true) {
      pdfField.enableRequired();
    } else if (field.required === false) {
      pdfField.disableRequired();
    }
    // const pdfFont = await this.getFont(StandardFonts.Helvetica)
    // if (pdfFont) {
    //   pdfField.defaultUpdateAppearances(pdfFont)
    // }
    // const da = pdfField.acroField.getDefaultAppearance() ?? '';
    // const newDa = da + '\n' + setFontAndSize(fontName, fontSize).toString();
    // pdfField.acroField.setDefaultAppearance(newDa);
  }

  protected async createFieldAppearanceOptions(element: any): Promise<FieldAppearanceOptions> {
    const { x, y, width, height, rotate } = element;
    let pdfFont: PDFFont | undefined;
    if (element.font) {
      pdfFont = await this.getFont(element.font);
    }
    return {
      x,
      y,
      width,
      height,
      rotate: degrees(rotate),
      textColor: element.textColor ? colorFromHex(element.textColor) : undefined,
      backgroundColor: element.backgroundColor ? colorFromHex(element.backgroundColor) : undefined,
      borderColor: element.borderColor ? colorFromHex(element.borderColor) : undefined,
      borderWidth: element.borderWidth,
      hidden: element.hidden,
      font: pdfFont,
    } as FieldAppearanceOptions;
  }

  protected async addButton(page: PDFPage, button: Button): Promise<void> {
    const form = page.doc.getForm();
    const field = form.createButton(button.name);
    await this.updatePDFField(field, button);

    // Set font
    const fontName = button.font ? button.font : StandardFonts.Helvetica;
    const pdfFont = await this.getFont(fontName);
    if (pdfFont) {
      field.defaultUpdateAppearances(pdfFont)
      field.updateAppearances(pdfFont);
    }

    // Set font size
    const fontSize = button.fontSize ? button.fontSize : 16;
    field.setFontSize(fontSize);

    if (button.image) {
      const pdfImg = await this.getImage(button.image);
      if (pdfImg) {
        field.setImage(pdfImg, button.imageAlignment);
      }
    }
    const options = await this.createFieldAppearanceOptions(button);
    field.addToPage(button.text, page, options);
  }

  protected async addCheckBox(page: PDFPage, checkBox: CheckBox): Promise<void> {
    const form = page.doc.getForm();
    const field = form.createCheckBox(checkBox.name);
    await this.updatePDFField(field, checkBox);

    if (checkBox.checked === true) {
      field.check();
    } else if (checkBox.checked === false) {
      field.uncheck();
    }
    const options = await this.createFieldAppearanceOptions(checkBox);
    field.addToPage(page, options);
  }

  protected async addDropdown(page: PDFPage, dropdown: Dropdown): Promise<void> {
    const form = page.doc.getForm();
    const field = form.createDropdown(dropdown.name);
    await this.updatePDFField(field, dropdown);

    // Set font
    const fontName = dropdown.font ? dropdown.font : StandardFonts.Helvetica;
    const pdfFont = await this.getFont(fontName);
    if (pdfFont) {
      field.defaultUpdateAppearances(pdfFont)
      field.updateAppearances(pdfFont);
    }

    // Set font size
    const fontSize = dropdown.fontSize ? dropdown.fontSize : 16;
    field.setFontSize(fontSize);

    if (dropdown.options) {
      field.setOptions(dropdown.options);
    }
    if (dropdown.editable === true) {
      field.enableEditing();
    } else if (dropdown.editable === false) {
      field.disableEditing();
    }
    if (dropdown.multiselect === true) {
      field.enableMultiselect();
    } else if (dropdown.multiselect === false) {
      field.disableMultiselect();
    }
    if (dropdown.selectOnClick === true) {
      field.enableSelectOnClick();
    } else if (dropdown.selectOnClick === false) {
      field.disableSelectOnClick();
    }
    if (dropdown.sorted === true) {
      field.enableSorting();
    } else if (dropdown.sorted === false) {
      field.disableSorting();
    }
    if (dropdown.spellChecked === true) {
      field.enableSpellChecking();
    } else if (dropdown.spellChecked === false) {
      field.disableSpellChecking();
    }
    if (dropdown.selectedOptions) {
      field.select(dropdown.selectedOptions, false);
    }
    const options = await this.createFieldAppearanceOptions(dropdown);
    field.addToPage(page, options);
  }

  protected async addOptionList(page: PDFPage, optionList: OptionList): Promise<void> {
    const form = page.doc.getForm();
    const field = form.createOptionList(optionList.name);
    await this.updatePDFField(field, optionList);

    // Set font
    const fontName = optionList.font ? optionList.font : StandardFonts.Helvetica;
    const pdfFont = await this.getFont(fontName);
    if (pdfFont) {
      field.defaultUpdateAppearances(pdfFont)
      field.updateAppearances(pdfFont);
    }

    // Set font size
    const fontSize = optionList.fontSize ? optionList.fontSize : 16;
    field.setFontSize(fontSize);

    if (optionList.options) {
      field.setOptions(optionList.options);
    }
    if (optionList.multiselect === true) {
      field.enableMultiselect();
    } else if (optionList.multiselect === false) {
      field.disableMultiselect();
    }
    if (optionList.selectOnClick === true) {
      field.enableSelectOnClick();
    } else if (optionList.selectOnClick === false) {
      field.disableSelectOnClick();
    }
    if (optionList.sorted === true) {
      field.enableSorting();
    } else if (optionList.sorted === false) {
      field.disableSorting();
    }
    if (optionList.selectedOptions) {
      field.select(optionList.selectedOptions, false);
    }
    const options = await this.createFieldAppearanceOptions(optionList);
    field.addToPage(page, options);
  }

  protected async addRadioGroup(page: PDFPage, radioGroup: RadioGroup): Promise<void> {
    const form = page.doc.getForm();
    const field = form.createRadioGroup(radioGroup.name);
    this.updatePDFField(field, radioGroup);

    if (radioGroup.options) {
      for (const radioOption of radioGroup.options) {
        const options = await this.createFieldAppearanceOptions(radioOption);
        field.addOptionToPage(radioOption.option, page, options);
      }
    }
    if (radioGroup.selectedOption) {
      field.select(radioGroup.selectedOption);
    }
  }

  protected async addDateInput(page: PDFPage, dateInput: DateInput): Promise<void> {
    const form = page.doc.getForm();
    const field = form.createTextField(dateInput.name);
    this.updatePDFField(field, dateInput);

    // Set font
    const fontName = dateInput.font ? dateInput.font : StandardFonts.Helvetica;
    const pdfFont = await this.getFont(fontName);
    if (pdfFont) {
      // field.defaultUpdateAppearances(pdfFont)
      field.updateAppearances(pdfFont);
    }

    // Set font size
    const fontSize = dateInput.fontSize ? dateInput.fontSize : 16;
    field.setFontSize(fontSize);

    if (dateInput.combing === true) {
      field.enableCombing();
    } else if (dateInput.combing === false) {
      field.disableCombing();
    }

    if (dateInput.multiline === true) {
      field.enableMultiline();
    } else if (dateInput.multiline === false) {
      field.disableMultiline();
    }

    if (dateInput.scrolling === true) {
      field.enableScrolling();
    } else if (dateInput.scrolling === false) {
      field.disableScrolling();
    }

    if (dateInput.maxLength) {
      field.setMaxLength(dateInput.maxLength);
    }
    if (dateInput.alignment) {
      field.setAlignment(dateInput.alignment);
    }

    field.disableFileSelection();
    field.disablePassword();
    field.disableRichFormatting();
    field.disableSpellChecking();

    if (dateInput.date) {
      const formatter = dateInput.format ?? 'YYYY/MM/DD HH:mm:ss';
      if (dateInput.timezone) {
        const text = moment(dateInput.date).tz(dateInput.timezone).format(formatter);
        field.setText(pdfFont ? filterCharSet(text, pdfFont) : text);
      } else {
        const text = moment(dateInput.date).utc().format(formatter);
        field.setText(pdfFont ? filterCharSet(text, pdfFont) : text);
      }
    }
    const options = await this.createFieldAppearanceOptions(dateInput);
    field.addToPage(page, options);
  }

  protected async addTextField(page: PDFPage, textField: TextField): Promise<void> {
    const form = page.doc.getForm();
    const field = form.createTextField(textField.name);
    this.updatePDFField(field, textField);

    // Set font
    const fontName = textField.font ? textField.font : StandardFonts.Helvetica;
    const pdfFont = await this.getFont(fontName);
    if (pdfFont) {
      // field.defaultUpdateAppearances(pdfFont)
      field.updateAppearances(pdfFont);
    }

    // Set font size
    const fontSize = textField.fontSize ? textField.fontSize : 16;
    field.setFontSize(fontSize);

    if (textField.combing === true) {
      field.enableCombing();
    } else if (textField.combing === false) {
      field.disableCombing();
    }
    if (textField.fileSelection === true) {
      field.enableFileSelection();
    } else if (textField.fileSelection === false) {
      field.disableFileSelection();
    }
    if (textField.multiline === true) {
      field.enableMultiline();
    } else if (textField.multiline === false) {
      field.disableMultiline();
    }
    if (textField.password === true) {
      field.enablePassword();
    } else if (textField.password === false) {
      field.disablePassword();
    }
    if (textField.richFormatting === true) {
      field.enableRichFormatting();
    } else if (textField.richFormatting === false) {
      field.disableRichFormatting();
    }
    if (textField.scrolling === true) {
      field.enableScrolling();
    } else if (textField.scrolling === false) {
      field.disableScrolling();
    }
    if (textField.spellChecking === true) {
      field.enableSpellChecking();
    } else if (textField.spellChecking === false) {
      field.disableSpellChecking();
    }
    if (textField.maxLength) {
      field.setMaxLength(textField.maxLength);
    }
    if (textField.alignment) {
      field.setAlignment(textField.alignment);
    }
    if (textField.text) {
      field.setText(pdfFont ? filterCharSet(textField.text, pdfFont) : textField.text);
    }
    const options = await this.createFieldAppearanceOptions(textField);
    field.addToPage(page, options);
  }

  protected async addSignature(page: PDFPage, signature: Signature): Promise<void> {
    const { backgroundColor, borderColor, borderWidth, font, fontSize, x, y, rotate, width, height } = signature;

    // const form = page.doc.getForm();
    // const nameParts = splitFieldName(signature.name);
    // const parent = findOrCreateNonTerminals(form, nameParts.nonTerminal);
    // const dict = form.doc.context.obj({
    //   FT: 'Sig',
    //   Kids: [],
    // });
    // const ref = form.doc.context.register(dict);
    // form.acroForm.addField(ref);
    // const sig = PDFAcroSignature.fromDict(dict, ref);
    // sig.setPartialName(nameParts.terminal);
    // addFieldToParent(parent, [sig, sig.ref], nameParts.terminal);
    // const field = PDFSignature.of(sig, sig.ref, form.doc);
    // this.updatePDFField(field, signature);
    // const options = await this.createFieldAppearanceOptions(signature);
    // const widget = createWidget(page, sig, form.doc.context, ref, options);
    // const widgetRef = form.doc.context.register(widget.dict);

    // Add widget to this field
    // sig.addWidget(widgetRef);

    // Set appearance streams for widget
    // const fieldFont = options.font ?? form.getDefaultFont();
    // updateSignatureWidgetAppearance(field, widget, fieldFont);

    // Add widget to the given page
    // page.node.addAnnot(widgetRef);

    // To use with DocuSign SignHere tabs,
    // we will create draw a signature name as text on the widget
    // usign the same color as the background color of the signature
    // to hide the text but the DocuSign still can map the SignHere tab
    // to it (by anchorString is the name of the signature)

    page.drawRectangle({
      x,
      y,
      width,
      height,
      rotate: rotate ? degrees(rotate) : undefined,
      borderColor: borderColor ? colorFromHex(borderColor) : undefined,
      borderWidth,
      color: backgroundColor ? colorFromHex(backgroundColor) : undefined,
    });

    const fontName = font ? font : StandardFonts.Helvetica;
    const pdfFont = await this.getFont(fontName);
    
    const h = height ?? 0;
    const value = signature.signerId ?? signature.name ?? '';
    const fz = fontSize ?? 6;
    const lh = pdfFont?.heightAtSize(fz) ?? 0;

    page.drawText(pdfFont ? filterCharSet(value, pdfFont) : value, {
      font: pdfFont,
      x: x ? x : undefined,
      y: y ? y + h - lh : undefined,
      maxWidth: width,
      lineHeight: lh > 0 ? lh : height,
      size: fontSize ?? 6,
      color: backgroundColor ? colorFromHex(backgroundColor) : undefined,
      rotate: rotate ? degrees(rotate) : undefined,
    });

    // As the PDF-LIB does not allow to create the PDFSignature field,
    // therefore, we use the PDFTextField instead
    // const form = page.doc.getForm()
    // const field = form.createTextField(signature.name)
    // this.updatePDFField(field, signature)
    // const options = await this.createFieldAppearanceOptions(signature)
    // field.addToPage(page, options)
  }

  protected async drawImage(page: PDFPage, img: Image): Promise<void> {
    const pdfImg = await this.getImage(img);
    const { x, y, width, height, rotate, xSkew, ySkew, opacity, blendMode } = img;
    if (pdfImg) {
      page.drawImage(pdfImg, {
        x,
        y,
        width,
        height,
        rotate: rotate ? degrees(rotate) : undefined,
        xSkew: xSkew ? degrees(xSkew) : undefined,
        ySkew: ySkew ? degrees(ySkew) : undefined,
        opacity,
        blendMode,
      });
    }
  }

  protected async drawText(page: PDFPage, text: Text): Promise<void> {
    const {
      value,
      color,
      font,
      size,
      wordBreaks,
      x,
      y,
      maxWidth,
      lineHeight,
      rotate,
      xSkew,
      ySkew,
      opacity,
      blendMode,
    } = text;
    let pdfFont: PDFFont | undefined;
    if (font) {
      pdfFont = await this.getFont(font);
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
    });
  }

  protected async drawCircle(page: PDFPage, circle: Circle): Promise<void> {
    const {
      blendMode,
      borderColor,
      borderDashArray,
      borderDashPhase,
      borderLineCap,
      borderOpacity,
      borderWidth,
      color,
      opacity,
      size,
      x,
      y,
    } = circle;
    page.drawCircle({
      blendMode,
      borderColor: borderColor ? colorFromHex(borderColor) : undefined,
      borderDashArray,
      borderDashPhase,
      borderLineCap,
      borderOpacity,
      borderWidth,
      color: color ? colorFromHex(color) : undefined,
      opacity,
      size,
      x,
      y,
    });
  }

  protected async drawEllipse(page: PDFPage, ellipse: Ellipse): Promise<void> {
    const {
      blendMode,
      borderColor,
      borderDashArray,
      borderDashPhase,
      borderLineCap,
      borderOpacity,
      borderWidth,
      color,
      opacity,
      rotate,
      x,
      xScale,
      y,
      yScale,
    } = ellipse;
    page.drawEllipse({
      blendMode,
      borderColor: borderColor ? colorFromHex(borderColor) : undefined,
      borderDashArray,
      borderDashPhase,
      borderLineCap,
      borderOpacity,
      borderWidth,
      color: color ? colorFromHex(color) : undefined,
      opacity,
      rotate: rotate ? degrees(rotate) : undefined,
      x,
      xScale,
      y,
      yScale,
    });
  }

  protected async drawLine(page: PDFPage, line: Line): Promise<void> {
    const { blendMode, color, dashArray, dashPhase, end, lineCap, opacity, start, thickness } = line;
    page.drawLine({
      blendMode,
      color: color ? colorFromHex(color) : undefined,
      dashArray,
      dashPhase,
      end,
      lineCap,
      opacity,
      start,
      thickness,
    });
  }

  protected async drawRectangle(page: PDFPage, rectangle: DrawablePath): Promise<void> {
    const {
      blendMode,
      borderColor,
      borderDashArray,
      borderDashPhase,
      borderLineCap,
      borderOpacity,
      borderWidth,
      color,
      height,
      opacity,
      rotate,
      width,
      x,
      xSkew,
      y,
      ySkew,
    } = rectangle;
    page.drawRectangle({
      blendMode,
      borderColor: borderColor ? colorFromHex(borderColor) : undefined,
      borderDashArray,
      borderDashPhase,
      borderLineCap,
      borderOpacity,
      borderWidth,
      color: color ? colorFromHex(color) : undefined,
      height,
      opacity,
      rotate: rotate ? degrees(rotate) : undefined,
      width,
      x,
      xSkew: xSkew ? degrees(xSkew) : undefined,
      y,
      ySkew: ySkew ? degrees(ySkew) : undefined,
    });
  }

  protected async drawSquare(page: PDFPage, square: Square): Promise<void> {
    const {
      blendMode,
      borderColor,
      borderDashArray,
      borderDashPhase,
      borderLineCap,
      borderOpacity,
      borderWidth,
      color,
      opacity,
      rotate,
      size,
      x,
      xSkew,
      y,
      ySkew,
    } = square;
    page.drawSquare({
      blendMode,
      borderColor: borderColor ? colorFromHex(borderColor) : undefined,
      borderDashArray,
      borderDashPhase,
      borderLineCap,
      borderOpacity,
      borderWidth,
      color: color ? colorFromHex(color) : undefined,
      opacity,
      rotate: rotate ? degrees(rotate) : undefined,
      size,
      x,
      xSkew: xSkew ? degrees(xSkew) : undefined,
      y,
      ySkew: ySkew ? degrees(ySkew) : undefined,
    });
  }

  protected async drawSVGPath(page: PDFPage, svgPath: SVGPath): Promise<void> {
    if (!svgPath.points || svgPath.points.length === 0) return;
    const svg = svgPath.points.reduce((prev, pt, idx): string => {
      if (idx === 0) {
        return `M ${pt.x},${pt.y}`;
      } else {
        return prev + ` L ${pt.x},${pt.y}`;
      }
    }, '');
    const {
      blendMode,
      borderColor,
      borderDashArray,
      borderDashPhase,
      borderLineCap,
      borderOpacity,
      borderWidth,
      color,
      opacity,
      rotate,
      scale,
      x,
      y,
    } = svgPath;
    const options = {
      blendMode,
      borderColor: borderColor ? colorFromHex(borderColor) : undefined,
      borderDashArray,
      borderDashPhase,
      borderLineCap,
      borderOpacity,
      borderWidth,
      color: color ? colorFromHex(color) : undefined,
      opacity,
      rotate: rotate && !isNaN(rotate) ? degrees(rotate) : undefined,
      scale,
      x: x && !isNaN(x) ? x : undefined,
      y: y && !isNaN(y) ? y : undefined,
    } as PDFPageDrawSVGOptions;
    page.moveTo(0, page.getHeight());
    page.drawSvgPath(svg, options);
  }
}
