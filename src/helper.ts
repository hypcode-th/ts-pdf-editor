import { adjustDimsForRotation, AnnotationFlags, AppearanceProviderFor, cmyk, Color, colorToComponents, componentsToColor, createPDFAcroFields, defaultTextFieldAppearanceProvider, drawButton, drawTextField, FieldAlreadyExistsError, findLastMatch, grayscale, InvalidFieldNamePartError, normalizeAppearance, PDFAcroField, PDFAcroForm, PDFAcroNonTerminal, PDFContext, PDFFont, PDFForm, PDFField, PDFPage, PDFRef, PDFSignature, PDFWidgetAnnotation, reduceRotation, rgb, rotateInPlace, rotateRectangle, Rotation, setFillingColor, TextPosition, toDegrees, PDFOperator, AppearanceMapping } from "pdf-lib";
import { FieldAppearanceOptions } from "pdf-lib/cjs/api/form/PDFField";

export function Uint8ArrayToBuffer(data: Uint8Array): Buffer {
  return ArrayBuffer.isView(data) ? Buffer.from(data.buffer, data.byteOffset, data.byteLength) : Buffer.from(data)
}

export function colorFromHex(hex: string): Color | undefined {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
  return result ? rgb(
    parseInt(result[1], 16) / 255.0,
    parseInt(result[2], 16) / 255.0,
    parseInt(result[3], 16) / 255.0
  ) : undefined;
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
};

export function findOrCreateNonTerminals(form: PDFForm, partialNames: string[]) {
  let nonTerminal: [PDFAcroForm] | [PDFAcroNonTerminal, PDFRef] = [
    form.acroForm,
  ];
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
};

export function findNonTerminal(
  form: PDFForm,
  partialName: string,
  parent: PDFAcroForm | PDFAcroNonTerminal,
): [PDFAcroNonTerminal, PDFRef] | undefined {
  const fields =
    parent instanceof PDFAcroForm
      ? form.acroForm.getFields()
      : createPDFAcroFields(parent.Kids());

  for (let idx = 0, len = fields.length; idx < len; idx++) {
    const [field, ref] = fields[idx];
    if (field.getPartialName() === partialName) {
      if (field instanceof PDFAcroNonTerminal) return [field, ref];
      throw new FieldAlreadyExistsError(partialName);
    }
  }
  return undefined;
};

export function addFieldToParent(
  [parent, parentRef]: [PDFAcroForm] | [PDFAcroNonTerminal, PDFRef],
  [field, fieldRef]: [PDFAcroField, PDFRef],
  partialName: string,
) {
  const entries = parent.normalizedEntries();
  const fields = createPDFAcroFields(
    'Kids' in entries ? entries.Kids : entries.Fields,
  );
  for (let idx = 0, len = fields.length; idx < len; idx++) {
    if (fields[idx][0].getPartialName() === partialName) {
      throw new FieldAlreadyExistsError(partialName);
    }
  }
  parent.addField(fieldRef);
  field.setParent(parentRef);
};

export function createWidget(page: PDFPage, field: PDFAcroField, context: PDFContext, ref: PDFRef, options: FieldAppearanceOptions): PDFWidgetAnnotation {
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
  const rect = rotateRectangle(
    { x, y, width, height },
    borderWidth,
    degreesAngle,
  );
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
