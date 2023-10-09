import { Document, IDocument } from './document';
import { ElementType } from './elements/element';
import { Signature } from './elements/fields/signature';

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

export interface DocuSignTabOptions {
  // Document ID
  documentId?: string

  // Set xPosition and yPosition of tab with the x and y of the element
  useElementPosition?: boolean;

  // Set width and height of tab with the width and height of the element
  useElementSize?: boolean;

  // DocuSign font to override the PDF element font
  // For tabType = 'dateSigned' only
  font?: DocuSignFont

  // DocuSign fontColor to override the PDF element textColor
  // For tabType = 'dateSigned' only
  fontColor?:
    | 'Auto' // Auto choose color from textColor HSV
    | 'BW' // Auto choose Black or White based on color's value (V of HSV)
    | DocuSignFontColor 

  // DocuSign fontSize to override the PDF element fontSize
  // For tabType = 'dateSigned' only
  fontSize?: DocuSignFontSize

  // DocuSign bold font style
  // For tabType = 'dateSigned' only
  bold?: boolean;

  // DocuSign italic font style
  // For tabType = 'dateSigned' only
  italic?: boolean;
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
  
  const fontToDocuSignTabFont = (font?: string): string => {
    if (font) {
      const lfont = font.toLowerCase().replace(/\s/g, '');
      for (const fname of docuSignTabFonts) {
        const lfname = fname.toLowerCase();
        if (lfont.includes(lfname)) {
          return fname;
        }
      }
    }
    return 'Default';
  };
  
  const fontSizeToDocuSignTabFontSize = (fontSize?: number): string => {
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
  
  const colorHexToBlackOrWhite = (hex?: string): string => {
    if (!hex) return 'Black';
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
    if (!result || result.length < 4) return 'Black';
    const red = parseInt(result[1], 16) / 255.0;
    const green = parseInt(result[2], 16) / 255.0;
    const blue = parseInt(result[3], 16) / 255.0;
    const v = Math.max(red, green, blue);
    return v > 0.5 ? 'White' : 'Black';
  };
  
  const colorHexToDocuSignTabTextColor = (hex?: string): string => {
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
  
  const toBooleanString = (v?: boolean): string | undefined => {
    if (v === undefined) return undefined;
    return v ? 'true' : 'false';
  };
  
  const toIntegerNumberString = (v?: number): string | undefined => {
    if (v === undefined) return undefined;
    return `${Math.round(v)}`;
  };
  

export const createDocuSignTab = (s: Signature, options?: DocuSignTabOptions): any => {
  let font = undefined as string | undefined;
  let fontSize = undefined as string | undefined;
  let fontColor = undefined as string | undefined;
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
    anchorXOffset: s.anchorXOffset,
    anchorYOffset: s.anchorYOffset,
    caption: s.caption,
    isSealSignTab: toBooleanString(s.isSealSignTab),
    optional: toBooleanString(s.optional),
    documentId: options?.documentId,
    recipientId: s.recipientId,
    recipientIdGuid: s.recipientIdGuid,
    scaleValue: s.scaleValue,
    stampType: s.tabType === 'signHere' || s.tabType === undefined ? s.stampType : undefined,
    status: s.status,
    tabGroupLabels: s.tabGroupLabels,
    tabId: s.tabId,
    tabLabel: s.tabLabel,
    tabOrder: s.tabOrder,
    tabType: s.tabType,
    tooltip: s.tooltip,
    height: options?.useElementSize === true ? toIntegerNumberString(s.height) : undefined,
    width: options?.useElementSize === true ? toIntegerNumberString(s.width) : undefined,
    xPosition: options?.useElementPosition === true ? toIntegerNumberString(s.x) : undefined,
    yPosition: options?.useElementPosition === true ? toIntegerNumberString(s.y) : undefined,
    font,
    fontColor,
    fontSize,
    bold,
    italic,
  } as any;
};

const addTabToSigner = (signer: any, tab: any) => {
  switch (tab.tabType) {
    case 'signHere':
      if (!signer.tabs.signHereTabs) {
        signer.signHereTabs = [] as any[]
      }
      signer.signHereTabs.push(tab)
      break;
    case 'initialHere':
      if (!signer.initialHereTabs) {
        signer.initialHereTabs = [] as any[]
      }
      signer.initialHereTabs.push(tab)
      break;
    case 'dateSigned':
      if (!signer.dateSignedTabs) {
        signer.dateSignedTabs = [] as any[]
      }
      signer.dateSignedTabs.push(tab)
      break;
    default:
      break;
  }
}

export const extractSigners = (pdfDoc: Document, options?: DocuSignTabOptions): any[] => {
  const result = [] as any[]
  const signatureFields = pdfDoc.findElementsByElemType(ElementType.Signature)
  const signers = new Map<string, any>()
  const unknownSigners = new Map<string, any>()
  if (signatureFields && signatureFields.length > 0) {
    for (const field of signatureFields) {
      const signatureField = field as Signature
      const tab = createDocuSignTab(signatureField, options)
      if (tab.recipientId) {
        let signer = signers.get(tab.recipientId)
        if (!signer) {
          signer = {
            recipientId: tab.recipientId,
            tabs: [] as any,
          }
          signers.set(tab.recipientId, signer)
        } 
        addTabToSigner(signer, tab)
      } else {
        let signer = unknownSigners.get(signatureField.name)
        if (!signer) {
          signer = {
            name: signatureField.name,
            tabs: [] as any,
          }
          unknownSigners.set(signatureField.name, signer)
        } 
        addTabToSigner(signer, tab)
      }
    }
  }
  result.push(...signers.values())
  result.push(...unknownSigners.values())
  return result
}