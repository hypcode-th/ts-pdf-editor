import { Document, IDocument } from './document';
import { ElementType } from './elements/element';
import { DateStampProperties, Signature, Stamp } from './elements/fields/signature';

export type DocuSignFont =
  | 'Default'
  | 'ArialNarrow'
  | 'Arial'
  | 'Calibri'
  | 'CourierNew'
  | 'Garamond'
  | 'Georgia'
  | 'Helvetica'
  | 'LucidaConsole'
  | 'MSGothic'
  | 'MSMincho'
  | 'OCR-A'
  | 'Tahoma'
  | 'TimesNewRoman'
  | 'Trebuchet'
  | 'Verdana';

export type DocuSignFontColor =
  | 'Black'
  | 'BrightBlue'
  | 'BrightRed'
  | 'DarkGreen'
  | 'DarkRed'
  | 'Gold'
  | 'Green'
  | 'NavyBlue'
  | 'Purple'
  | 'White';

export type DocuSignFontSize =
  | 'Size7'
  | 'Size8'
  | 'Size9'
  | 'Size10'
  | 'Size11'
  | 'Size12'
  | 'Size14'
  | 'Size16'
  | 'Size18'
  | 'Size20'
  | 'Size22'
  | 'Size24'
  | 'Size26'
  | 'Size28'
  | 'Size36'
  | 'Size48'
  | 'Size72';

export interface DocuSignDateStampProperties {
  dateAreaHeight?: string;
  dateAreaWidth?: string;
  dateAreaX?: string;
  dateAreaY?: string;
}
export interface DocuSignStamp {
  // stamp properties
  customField?: string;
  dateStampProperties?: DocuSignDateStampProperties;
  disallowUserResizeStamp?: 'true' | 'false';
  externalID?: string;
  imageBase64?: string;
  imageType?: 'stamp_image' | 'signature_image' | 'initials_image';
  phoneticName?: string;
  signatureName?: string;
  stampFormat?: 'NameHanko' | 'NameDateHanko';
  stampImageUri?: string;
  stampSizeMM?: string;
}
export interface DocuSignTab {
  anchorAllowWhiteSpaceInCharacters?: 'true' | 'false'; // true is the default value
  anchorCaseSensitive?: 'true' | 'false'; // false is the default value
  anchorHorizontalAlignment?: 'left' | 'right' | undefined; // left is the default value
  anchorIgnoreIfNotPresent?: 'true' | 'false'; // true is the default value
  anchorMatchWholeWord?: 'true' | 'false'; // false is the default value
  anchorString?: string; // Anchor string for DocuSign
  anchorUnits?: 'pixels' | 'inches' | 'mms' | 'cms'; // default is pixels
  anchorXOffset?: string;
  anchorYOffset?: string;
  bold?: 'true' | 'false';
  caption?: string;
  documentId?: string;
  font?: DocuSignFont;
  fontColor?: DocuSignFontColor;
  fontSize?: DocuSignFontSize;
  height?: string;
  isSealSignTab?: 'true' | 'false';
  italic?: 'true' | 'false';
  optional?: 'true' | 'false';
  recipientId?: string;
  scaleValue?: string;
  stamp?: DocuSignStamp;
  stampType?: 'signature' | 'stamp';
  status?: 'active' | 'signed' | 'declined' | 'na';
  tabGroupLabels?: string[];
  tabId?: string;
  tabLabel?: string;
  tabOrder?: string;
  tabType?: 'signHere' | 'initialHere' | 'dateSigned';
  tooltip?: string;
  width?: string;
  xPosition?: string;
  yPosition?: string;
}

export interface DocuSignSigner {
  name?: string;
  recipientId?: string;
  tabs?: DocuSignSignerTabs;
}

export interface DocuSignSignerTabs {
  dateSignedTabs?: DocuSignTab[];
  initialHereTabs?: DocuSignTab[];
  signHereTabs?: DocuSignTab[];
}

export interface CreateDocuSignTabOptions {
  // Document ID
  documentId?: string;

  // Set xPosition and yPosition of tab with the x and y of the element
  useElementPosition?: boolean;

  // Set width and height of tab with the width and height of the element
  // Not applicable for signHere tab
  useElementSize?: boolean;

  // DocuSign font to override the PDF element font
  // For tabType = 'dateSigned' only
  font?: DocuSignFont;

  // DocuSign fontColor to override the PDF element textColor
  // For tabType = 'dateSigned' only
  fontColor?:
    | 'Auto' // Auto choose color from textColor HSV
    | 'BW' // Auto choose Black or White based on color's value (V of HSV)
    | DocuSignFontColor;

  // DocuSign fontSize to override the PDF element fontSize
  // For tabType = 'dateSigned' only
  fontSize?: DocuSignFontSize;

  // DocuSign bold font style
  // For tabType = 'dateSigned' only
  bold?: boolean;

  // DocuSign italic font style
  // For tabType = 'dateSigned' only
  italic?: boolean;

  // Automatically generate anchorString when it is undefined or empty.
  // If the value is 'id' then, the anchorString will be the id of the element (UUID)
  // If the value is 'name', the anchorString will be the name of the element.
  // If the value is undefined, the anchorString remains undefined or empty.
  autoGenerateAnchorStringWhenEmpty?: 'id' | 'name';
}

const docuSignTabFonts = [
  'Default',
  'ArialNarrow',
  'Arial',
  'Calibri',
  'CourierNew',
  'Garamond',
  'Georgia',
  'Helvetica',
  'LucidaConsole',
  'MSGothic',
  'MSMincho',
  'OCR-A',
  'Tahoma',
  'TimesNewRoman',
  'Trebuchet',
  'Verdana',
];

const isItalicFont = (font?: string): boolean => {
  if (!font) return false;
  const lfont = font.toLowerCase();
  return lfont.includes('italic') || lfont.includes('oblique');
};

const isBoldFont = (font?: string): boolean => {
  if (!font) return false;
  const lfont = font.toLowerCase();
  return lfont.includes('bold');
};

const fontToDocuSignTabFont = (font?: string): DocuSignFont => {
  if (font) {
    const lfont = font.toLowerCase().replace(/\s/g, '');
    for (const fname of docuSignTabFonts) {
      const lfname = fname.toLowerCase();
      if (lfont.includes(lfname)) {
        return fname as DocuSignFont;
      }
    }
  }
  return 'Default';
};

const fontSizeToDocuSignTabFontSize = (fontSize?: number): DocuSignFontSize => {
  if (fontSize === undefined || fontSize === null) {
    return 'Size14';
  }
  if (fontSize < 7.5) {
    return 'Size7';
  } else if (fontSize < 8.5) {
    return 'Size8';
  } else if (fontSize < 9.5) {
    return 'Size9';
  } else if (fontSize < 10.5) {
    return 'Size10';
  } else if (fontSize < 11.5) {
    return 'Size11';
  } else if (fontSize < 13) {
    return 'Size12';
  } else if (fontSize < 15) {
    return 'Size14';
  } else if (fontSize < 17) {
    return 'Size16';
  } else if (fontSize < 19) {
    return 'Size18';
  } else if (fontSize < 21) {
    return 'Size20';
  } else if (fontSize < 23) {
    return 'Size22';
  } else if (fontSize < 25) {
    return 'Size24';
  } else if (fontSize < 27) {
    return 'Size26';
  } else if (fontSize < 32) {
    return 'Size28';
  } else if (fontSize < 42) {
    return 'Size36';
  } else if (fontSize < 42) {
    return 'Size36';
  } else if (fontSize < 60) {
    return 'Size48';
  } else {
    return 'Size72';
  }
};

const colorHexToBlackOrWhite = (hex?: string): DocuSignFontColor => {
  if (!hex) return 'Black';
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
  if (!result || result.length < 4) return 'Black';
  const red = parseInt(result[1], 16) / 255.0;
  const green = parseInt(result[2], 16) / 255.0;
  const blue = parseInt(result[3], 16) / 255.0;
  const v = Math.max(red, green, blue);
  return v > 0.5 ? 'White' : 'Black';
};

const colorHexToDocuSignTabTextColor = (hex?: string): DocuSignFontColor => {
  if (!hex) return 'Black';
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
  if (!result || result.length < 4) return 'Black';
  const red = parseInt(result[1], 16) / 255.0;
  const green = parseInt(result[2], 16) / 255.0;
  const blue = parseInt(result[3], 16) / 255.0;
  let rr: number;
  let gg: number;
  let bb: number;
  let h: number = 0;
  let s: number = 0;
  let v: number = 0;

  v = Math.max(red, green, blue);
  const diff = v - Math.min(red, green, blue);
  const diffc = (c: number) => (v - c) / 6 / diff + 1 / 2;
  const percentRoundFn = (num: number) => Math.round(num * 100) / 100;
  if (diff === 0) {
    h = s = 0;
  } else {
    s = diff / v;
    rr = diffc(red);
    gg = diffc(green);
    bb = diffc(blue);

    if (red === v) {
      h = bb - gg;
    } else if (green === v) {
      h = 1 / 3 + rr - bb;
    } else if (blue === v) {
      h = 2 / 3 + gg - rr;
    }
    if (h < 0) {
      h += 1;
    } else if (h > 1) {
      h -= 1;
    }
  }
  h = Math.round(h * 360);
  s = percentRoundFn(s * 100);
  v = percentRoundFn(v * 100);

  if (s < 10 || h === 0) {
    return v > 50 ? 'White' : 'Black';
  } else if (h <= 30 || h > 330) {
    return v > 50 ? 'BrightRed' : 'DarkRed';
  } else if (h > 30 || h <= 90) {
    return 'Gold';
  } else if (h > 90 || h <= 180) {
    return v > 50 ? 'Green' : 'DarkGreen';
  } else if (h > 180 || h <= 270) {
    return v > 50 ? 'BrightBlue' : 'NavyBlue';
  } else if (h > 270 || h <= 330) {
    return 'Purple';
  }
  return v > 50 ? 'White' : 'Black';
};

const toBooleanString = (v?: boolean): 'true' | 'false' | undefined => {
  if (v === undefined) return undefined;
  return v ? 'true' : 'false';
};

const toIntegerNumberString = (v?: number): string | undefined => {
  if (v === undefined) return undefined;
  return `${Math.round(v)}`;
};

const toFloatNumberString = (v?: number, dp?: number): string | undefined => {
  if (v === undefined) return undefined;
  return `${v.toFixed(dp ?? 2)}`;
};

const createDateStampProperties = (ds?: DateStampProperties): DocuSignDateStampProperties | undefined => {
  if (!ds || Object.entries(ds).length === 0) return undefined;
  return {
    dateAreaHeight: toIntegerNumberString(ds.dateAreaHeight),
    dateAreaWidth: toIntegerNumberString(ds.dateAreaWidth),
    dateAreaX: toIntegerNumberString(ds.dateAreaX),
    dateAreaY: toIntegerNumberString(ds.dateAreaY),
  };
};

const createDocuSignStamp = (st?: Stamp): DocuSignStamp | undefined => {
  if (!st || Object.entries(st).length === 0) return undefined;
  return {
    customField: st.customField,
    dateStampProperties: createDateStampProperties(st.dateStampProperties),
    disallowUserResizeStamp: toBooleanString(st.disallowUserResizeStamp),
    externalID: st.externalID,
    imageBase64: st.imageBase64,
    imageType: st.imageType,
    phoneticName: st.phoneticName,
    signatureName: st.signatureName,
    stampFormat: st.stampFormat,
    stampImageUri: st.stampImageUri,
    stampSizeMM: toIntegerNumberString(st.stampSizeMM),
  };
};

export const createDocuSignTab = (s: Signature, options?: CreateDocuSignTabOptions): DocuSignTab => {
  let font = undefined as DocuSignFont | undefined;
  let fontSize = undefined as DocuSignFontSize | undefined;
  let fontColor = undefined as DocuSignFontColor | undefined;
  let bold = undefined as boolean | undefined;
  let italic = undefined as boolean | undefined;
  if (s.tabType === 'dateSigned') {
    font = options?.font ?? fontToDocuSignTabFont(s.font);
    fontSize = options?.fontSize ?? fontSizeToDocuSignTabFontSize(s.fontSize);
    if (options?.fontColor) {
      switch (options.fontColor) {
        case 'Auto':
          fontColor = colorHexToDocuSignTabTextColor(s.textColor);
          break;
        case 'BW':
          fontColor = colorHexToBlackOrWhite(s.textColor);
          break;
        default:
          fontColor = options.fontColor;
          break;
      }
    } else {
      fontColor = colorHexToDocuSignTabTextColor(s.textColor);
    }
    bold = options?.bold !== undefined ? options.bold : isBoldFont(s.font);
    italic = options?.italic !== undefined ? options.italic : isItalicFont(s.font);
  }
  return {
    anchorAllowWhiteSpaceInCharacters: toBooleanString(s.anchorAllowWhiteSpaceInCharacters === false),
    anchorCaseSensitive: toBooleanString(s.anchorCaseSensitive),
    anchorHorizontalAlignment: s.anchorHorizontalAlignment,
    anchorIgnoreIfNotPresent: toBooleanString(s.anchorIgnoreIfNotPresent),
    anchorMatchWholeWord: toBooleanString(s.anchorMatchWholeWord),
    anchorString: s.anchorString ? s.anchorString : s.id,
    anchorUnits: s.anchorUnits,
    anchorXOffset: toIntegerNumberString(s.anchorXOffset),
    anchorYOffset: toIntegerNumberString(s.anchorYOffset),
    caption: s.caption,
    isSealSignTab: s.tabType === 'signHere' || s.tabType === undefined ? toBooleanString(s.isSealSignTab) : undefined,
    optional: toBooleanString(s.required !== true),
    documentId: options?.documentId,
    recipientId: s.recipientId,
    scaleValue: toFloatNumberString(s.scaleValue, 2),
    stamp: createDocuSignStamp(s.stamp),
    stampType: s.tabType === 'signHere' || s.tabType === undefined ? s.stampType : undefined,
    status: s.status,
    tabGroupLabels: s.tabGroupLabels,
    tabId: s.tabId,
    tabLabel: s.tabLabel,
    tabOrder: toIntegerNumberString(s.tabOrder),
    tabType: s.tabType,
    tooltip: s.tooltip,
    height: options?.useElementSize === true && s.tabType !== 'signHere' ? toIntegerNumberString(s.height) : undefined,
    width: options?.useElementSize === true && s.tabType !== 'signHere' ? toIntegerNumberString(s.width) : undefined,
    xPosition: options?.useElementPosition === true ? toIntegerNumberString(s.x) : undefined,
    yPosition: options?.useElementPosition === true ? toIntegerNumberString(s.y) : undefined,
    font,
    fontColor,
    fontSize,
    bold: toBooleanString(bold),
    italic: toBooleanString(italic),
  };
};

const addTabToSigner = (signer: any, tab: any) => {
  switch (tab.tabType) {
    case 'signHere':
      if (!signer.tabs.signHereTabs) {
        signer.tabs.signHereTabs = [tab];
      } else {
        signer.tabs.signHereTabs.push(tab);
      }
      break;
    case 'initialHere':
      if (!signer.tabs.initialHereTabs) {
        signer.tabs.initialHereTabs = [tab];
      } else {
        signer.tabs.initialHereTabs.push(tab);
      }
      break;
    case 'dateSigned':
      if (!signer.tabs.dateSignedTabs) {
        signer.tabs.dateSignedTabs = [tab];
      } else {
        signer.tabs.dateSignedTabs.push(tab);
      }
      break;
    default:
      break;
  }
};

export interface ExtractSignersOptions extends CreateDocuSignTabOptions {
  recipientIds?: string[]; // Extract for specified recipient ids only
  fieldNames?: string[]; // Extract the tabs for specified field names only
}

export const extractSigners = (pdfDoc: Document, options?: ExtractSignersOptions): DocuSignSigner[] => {
  const result = [] as DocuSignSigner[];
  const signatureFields = pdfDoc.findElementsByElemType(ElementType.Signature);
  const signers = new Map<string, DocuSignSigner>();
  const unknownSigners = new Map<string, DocuSignSigner>();
  const filterByRecipientIds = options?.recipientIds && options.recipientIds.length > 0;
  const filterByFieldNames = options?.fieldNames && options.fieldNames.length > 0;
  if (signatureFields && signatureFields.length > 0) {
    for (const field of signatureFields) {
      const signatureField = field as Signature;
      const recipientId = signatureField.recipientId;
      const fieldName = signatureField.name;
      if (filterByRecipientIds && (!recipientId || !options.recipientIds!.includes(recipientId))) {
        continue;
      }
      if (filterByFieldNames && (!fieldName || !options.fieldNames!.includes(fieldName))) {
        continue;
      }
      const tab = createDocuSignTab(signatureField, options);
      if (tab.recipientId) {
        let signer = signers.get(tab.recipientId);
        if (!signer) {
          signer = {
            recipientId: tab.recipientId,
            tabs: {} as DocuSignSignerTabs,
          } as DocuSignSigner;
          signers.set(tab.recipientId, signer);
        }
        addTabToSigner(signer, tab);
      } else {
        let signer = unknownSigners.get(signatureField.name);
        if (!signer) {
          signer = {
            name: signatureField.name,
            tabs: {} as DocuSignSignerTabs,
          } as DocuSignSigner;
          unknownSigners.set(signatureField.name, signer);
        }
        addTabToSigner(signer, tab);
      }
    }
  }
  result.push(...signers.values());
  result.push(...unknownSigners.values());
  return result;
};
