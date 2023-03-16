import {
  AnnotationFlags,
  Color,
  colorToComponents,
  createPDFAcroFields,
  FieldAlreadyExistsError,
  InvalidFieldNamePartError,
  PDFAcroField,
  PDFAcroForm,
  PDFAcroNonTerminal,
  PDFContext,
  PDFForm,
  PDFPage,
  PDFRef,
  PDFWidgetAnnotation,
  rgb,
  rotateRectangle,
  setFillingColor,
  toDegrees,
  findLastMatch,
  grayscale,
  cmyk,
  reduceRotation,
  adjustDimsForRotation,
  rotateInPlace,
  componentsToColor,
  TextPosition,
  layoutCombedText,
  layoutMultilineText,
  layoutSinglelineText,
  drawTextField,
  PDFSignature,
  PDFFont,
  AppearanceProviderFor,
  TextAlignment,
  setFontAndSize,
  drawText,
  normalizeAppearance,
  AppearanceMapping,
  PDFOperator,
  PDFDict,
} from 'pdf-lib';

import { FieldAppearanceOptions } from 'pdf-lib/cjs/api/form/PDFField';

export function Uint8ArrayToBuffer(data: Uint8Array): Buffer {
  return ArrayBuffer.isView(data) ? Buffer.from(data.buffer, data.byteOffset, data.byteLength) : Buffer.from(data);
}

export function colorFromHex(hex: string): Color | undefined {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
  return result
    ? rgb(parseInt(result[1], 16) / 255.0, parseInt(result[2], 16) / 255.0, parseInt(result[3], 16) / 255.0)
    : undefined;
}

export function splitFieldName(fullyQualifiedName: string) {
  if (fullyQualifiedName.length === 0) {
    throw new Error('PDF field names must not be empty strings');
  }

  const parts = fullyQualifiedName.split('.');

  for (let idx = 0, len = parts.length; idx < len; idx++) {
    if (parts[idx] === '') {
      throw new Error(
        `Periods in PDF field names must be separated by at least one character: "${fullyQualifiedName}"`,
      );
    }
  }

  if (parts.length === 1) return { nonTerminal: [], terminal: parts[0] };

  return {
    nonTerminal: parts.slice(0, parts.length - 1),
    terminal: parts[parts.length - 1],
  };
}

export function findOrCreateNonTerminals(form: PDFForm, partialNames: string[]) {
  let nonTerminal: [PDFAcroForm] | [PDFAcroNonTerminal, PDFRef] = [form.acroForm];
  for (let idx = 0, len = partialNames.length; idx < len; idx++) {
    const namePart = partialNames[idx];
    if (!namePart) throw new InvalidFieldNamePartError(namePart);
    const [parent, parentRef] = nonTerminal;
    const res = findNonTerminal(form, namePart, parent);

    if (res) {
      nonTerminal = res;
    } else {
      const node = PDFAcroNonTerminal.create(form.doc.context);
      node.setPartialName(namePart);
      node.setParent(parentRef);
      const nodeRef = form.doc.context.register(node.dict);
      parent.addField(nodeRef);
      nonTerminal = [node, nodeRef];
    }
  }
  return nonTerminal;
}

export function findNonTerminal(
  form: PDFForm,
  partialName: string,
  parent: PDFAcroForm | PDFAcroNonTerminal,
): [PDFAcroNonTerminal, PDFRef] | undefined {
  const fields = parent instanceof PDFAcroForm ? form.acroForm.getFields() : createPDFAcroFields(parent.Kids());

  for (let idx = 0, len = fields.length; idx < len; idx++) {
    const [field, ref] = fields[idx];
    if (field.getPartialName() === partialName) {
      if (field instanceof PDFAcroNonTerminal) return [field, ref];
      throw new FieldAlreadyExistsError(partialName);
    }
  }
  return undefined;
}

export function addFieldToParent(
  [parent, parentRef]: [PDFAcroForm] | [PDFAcroNonTerminal, PDFRef],
  [field, fieldRef]: [PDFAcroField, PDFRef],
  partialName: string,
) {
  const entries = parent.normalizedEntries();
  const fields = createPDFAcroFields('Kids' in entries ? entries.Kids : entries.Fields);
  for (let idx = 0, len = fields.length; idx < len; idx++) {
    if (fields[idx][0].getPartialName() === partialName) {
      throw new FieldAlreadyExistsError(partialName);
    }
  }
  parent.addField(fieldRef);
  field.setParent(parentRef);
}

export function createWidget(
  page: PDFPage,
  field: PDFAcroField,
  context: PDFContext,
  ref: PDFRef,
  options: FieldAppearanceOptions,
): PDFWidgetAnnotation {
  const textColor = options.textColor;
  const backgroundColor = options.backgroundColor;
  const borderColor = options.borderColor;
  const borderWidth = options.borderWidth ? options.borderWidth : 0;
  const degreesAngle = options.rotate ? toDegrees(options.rotate) : 0;
  const x = options.x ? options.x : 0;
  const y = options.y ? options.y : 0;
  const width = (options.width ? options.width : 0) + borderWidth;
  const height = (options.height ? options.height : 0) + borderWidth;
  const hidden = Boolean(options.hidden);
  const pageRef = page.ref;

  // Create a widget for this field
  const widget = PDFWidgetAnnotation.create(context, ref);

  // Set widget properties
  const rect = rotateRectangle({ x, y, width, height }, borderWidth, degreesAngle);
  widget.setRectangle(rect);

  if (pageRef) widget.setP(pageRef);

  const ac = widget.getOrCreateAppearanceCharacteristics();
  if (backgroundColor) {
    ac.setBackgroundColor(colorToComponents(backgroundColor));
  }
  ac.setRotation(degreesAngle);
  if (borderColor) ac.setBorderColor(colorToComponents(borderColor));

  const bs = widget.getOrCreateBorderStyle();
  if (borderWidth !== undefined) bs.setWidth(borderWidth);

  widget.setFlagTo(AnnotationFlags.Print, true);
  widget.setFlagTo(AnnotationFlags.Hidden, hidden);
  widget.setFlagTo(AnnotationFlags.Invisible, false);

  // Set acrofield properties
  if (textColor) {
    const da = field.getDefaultAppearance() ?? '';
    const newDa = da + '\n' + setFillingColor(textColor).toString();
    field.setDefaultAppearance(newDa);
  }

  return widget;
}

const tfRegex = /\/([^\0\t\n\f\r\ ]+)[\0\t\n\f\r\ ]+(\d*\.\d+|\d+)[\0\t\n\f\r\ ]+Tf/;

export const getDefaultFontSize = (field: { getDefaultAppearance(): string | undefined }) => {
  const da = field.getDefaultAppearance() ?? '';
  const daMatch = findLastMatch(da, tfRegex).match ?? [];
  const defaultFontSize = Number(daMatch[2]);
  return isFinite(defaultFontSize) ? defaultFontSize : undefined;
};

const colorRegex =
  /(\d*\.\d+|\d+)[\0\t\n\f\r\ ]*(\d*\.\d+|\d+)?[\0\t\n\f\r\ ]*(\d*\.\d+|\d+)?[\0\t\n\f\r\ ]*(\d*\.\d+|\d+)?[\0\t\n\f\r\ ]+(g|rg|k)/;

export const getDefaultColor = (field: { getDefaultAppearance(): string | undefined }) => {
  const da = field.getDefaultAppearance() ?? '';
  const daMatch = findLastMatch(da, colorRegex).match;

  const [, c1, c2, c3, c4, colorSpace] = daMatch ?? [];

  if (colorSpace === 'g' && c1) {
    return grayscale(Number(c1));
  }
  if (colorSpace === 'rg' && c1 && c2 && c3) {
    return rgb(Number(c1), Number(c2), Number(c3));
  }
  if (colorSpace === 'k' && c1 && c2 && c3 && c4) {
    return cmyk(Number(c1), Number(c2), Number(c3), Number(c4));
  }

  return undefined;
};

const updateDefaultAppearance = (
  field: { setDefaultAppearance(appearance: string): void },
  color: Color,
  font?: PDFFont,
  fontSize: number = 0,
) => {
  const da = [
    setFillingColor(color).toString(),
    setFontAndSize(font?.name ?? 'dummy__noop', fontSize).toString(),
  ].join('\n');
  field.setDefaultAppearance(da);
};

export const defaulSignatureAppearanceProvider: AppearanceProviderFor<PDFSignature> = (
  signature: PDFSignature,
  widget: PDFWidgetAnnotation,
  font: PDFFont,
) => {
  // The `/DA` entry can be at the widget or field level - so we handle both
  const widgetColor = getDefaultColor(widget);
  const fieldColor = getDefaultColor(signature.acroField);
  const widgetFontSize = getDefaultFontSize(widget);
  const fieldFontSize = getDefaultFontSize(signature.acroField);

  const rectangle = widget.getRectangle();
  const ap = widget.getAppearanceCharacteristics();
  const bs = widget.getBorderStyle();
  const text = signature.getName() ?? '';

  const borderWidth = bs?.getWidth() ?? 0;
  const rotation = reduceRotation(ap?.getRotation());
  const { width, height } = adjustDimsForRotation(rectangle, rotation);

  const rotate = rotateInPlace({ ...rectangle, rotation });

  const black = rgb(0, 0, 0);

  const borderColor = componentsToColor(ap?.getBorderColor());
  const normalBackgroundColor = componentsToColor(ap?.getBackgroundColor());

  let textLines: TextPosition[];
  let fontSize: number;

  const bounds = {
    x: borderWidth,
    y: borderWidth,
    width: width - (borderWidth) * 2,
    height: height - (borderWidth) * 2,
  };
  const layout = layoutSinglelineText(text, {
    alignment: TextAlignment.Center,
    fontSize: widgetFontSize ?? fieldFontSize,
    font,
    bounds,
  });
  textLines = [layout.line];
  fontSize = layout.fontSize;

  // Update font size and color
  const textColor = widgetColor ?? fieldColor ?? black;
  if (widgetColor || widgetFontSize !== undefined) {
    updateDefaultAppearance(widget, textColor, font, fontSize);
  } else {
    updateDefaultAppearance(signature.acroField, textColor, font, fontSize);
  }

  const options = {
    x: 0 + borderWidth / 2,
    y: 0 + borderWidth / 2,
    width: width - borderWidth,
    height: height - borderWidth,
    borderWidth: borderWidth ?? 0,
    borderColor,
    textColor,
    font: font.name,
    fontSize,
    color: normalBackgroundColor,
    textLines,
    padding: 0,
  };

  return [...rotate, ...drawTextField(options)];
};

export function updateSignatureWidgetAppearance(
  signature: PDFSignature,
  widget: PDFWidgetAnnotation,
  font: PDFFont,
  provider?: AppearanceProviderFor<PDFSignature>,
) {
  const apProvider = provider ?? defaulSignatureAppearanceProvider;
  const appearances = normalizeAppearance(apProvider(signature, widget, font));
  updateWidgetAppearanceWithFont(signature, widget, font, appearances);
}

function updateWidgetAppearanceWithFont(
  signature: PDFSignature,
  widget: PDFWidgetAnnotation,
  font: PDFFont,
  { normal, rollover, down }: AppearanceMapping<PDFOperator[]>,
) {
  updateWidgetAppearances(widget, {
    normal: createSignatureAppearanceStream(signature, widget, normal, font),
    rollover: rollover && createSignatureAppearanceStream(signature, widget, rollover, font),
    down: down && createSignatureAppearanceStream(signature, widget, down, font),
  });
}

function createSignatureAppearanceStream(
  signature: PDFSignature,
  widget: PDFWidgetAnnotation,
  appearance: PDFOperator[],
  font?: PDFFont,
): PDFRef {
  const { context } = signature.acroField.dict;
  const { width, height } = widget.getRectangle();

  // TODO: Do we need to do this...?
  // if (font) {
  //   this.foo(font, widget.dict);
  //   this.foo(font, this.doc.getForm().acroForm.dict);
  // }
  // END TODO

  const Resources = font && { Font: { [font.name]: font.ref } };
  const stream = context.formXObject(appearance, {
    Resources,
    BBox: context.obj([0, 0, width, height]),
    Matrix: context.obj([1, 0, 0, 1, 0, 0]),
  });
  const streamRef = context.register(stream);

  return streamRef;
}

function updateWidgetAppearances(
  widget: PDFWidgetAnnotation,
  { normal, rollover, down }: AppearanceMapping<PDFRef | PDFDict>,
) {
  widget.setNormalAppearance(normal);

  if (rollover) {
    widget.setRolloverAppearance(rollover);
  } else {
    widget.removeRolloverAppearance();
  }

  if (down) {
    widget.setDownAppearance(down);
  } else {
    widget.removeDownAppearance();
  }
}