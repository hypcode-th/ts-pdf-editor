import { Field } from "./field";

export interface Signature extends Field {
  anchorStringFont?: string // Helvetica is the default font
  anchorStringFontSize?: number // Default is 2
  
  // =====================================================================================================
  // The following attributes are the attributes of the DocuSign signHere, initailHere and dateSigned tabs
  // =====================================================================================================

  anchorAllowWhiteSpaceInCharacters?: boolean // true is the default value
  anchorCaseSensitive?: boolean // false is the default value
  anchorHorizontalAlignment?: 'left' | 'right' | undefined // left is the default value
  anchorIgnoreIfNotPresent?: boolean // true is the default value
  anchorMatchWholeWord?: boolean // false is the default value
  anchorString: string // Anchor string for DocuSign
  anchorUnits?: 'pixels' | 'inches' | 'mms' | 'cms' | undefined // default is pixels
  anchorXOffset?: number
  anchorYOffset?: number
  caption?: string
  isSealSignTab?: boolean
  recipientId?: string
  recipientIdGuid?: string

  // Scales the size of the tab. 
  // This field accepts values from 0.5 to 2.0, 
  // where 0.5 is half the normal size, 1.0 is normal size, 
  // and 2.0 is twice the normal size.
  scaleValue?: number

  stampType?: 'signature' | 'stamp' | undefined

  status?: 'active' | 'signed' | 'declined' | 'na' | undefined

  tabGroupLabels?: string[]

  tabId?: string

  tabLabel?: string

  tabOrder?: number

  tabType?: 'signHere' | 'initialHere' | 'dateSigned' | undefined

  tooltip?: string
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
  if (!font) return false 
  const lfont = font.toLowerCase()
  return lfont.includes('italic') || lfont.includes('oblique')
}

const isBoldFont = (font?: string): boolean => {
  if (!font) return false 
  const lfont = font.toLowerCase()
  return lfont.includes('bold')
}

const fontToDocuSignTabFont = (
  font?: string,
): string => {
  if (font) {
    const lfont = font.toLowerCase().replace(/\s/g, '');
    for (const fname of docuSignTabFonts) {
      const lfname = fname.toLowerCase()
      if (lfont.includes(lfname)) {
        return fname
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
  if (!hex) return 'Black'
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(
    hex,
  );
  if (!result || result.length < 4) return 'Black'
  const red = parseInt(result[1], 16) / 255.0;
  const green = parseInt(result[2], 16) / 255.0;
  const blue = parseInt(result[3], 16) / 255.0;
  const v = Math.max(red, green, blue);
  return (v > 0.5) ? 'White' : 'Black'
}

const colorHexToDocuSignTabTextColor = (hex?: string): string => {
  if (!hex) return 'Black'
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(
    hex,
  );
  if (!result || result.length < 4) return 'Black'
  const red = parseInt(result[1], 16) / 255.0;
  const green = parseInt(result[2], 16) / 255.0;
  const blue = parseInt(result[3], 16) / 255.0;
  var rr: number;
  var gg: number;
  var bb: number;
  var h: number = 0;
  var s: number = 0;
  var v: number = 0;

  v = Math.max(red, green, blue);
  const diff = v - Math.min(red, green, blue);
  const diffc = (c: number) => (v - c) / 6 / diff + 1 / 2;
  const percentRoundFn = (num: number) => Math.round(num * 100) / 100;
  if (diff == 0) {
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
  if (v === undefined) return undefined
  return (v) ? 'true' : 'false'
}

const toIntegerNumberString = (v?: number): string | undefined => {
  if (v === undefined) return undefined
  return `${Math.round(v)}`
}

export interface CreateDocuSignTabOptions {
  // Set xPosition and yPosition of tab with the x and y of the element
  useElementPosition?: boolean

  // Set width and height of tab with the width and height of the element
  useElementSize?: boolean

  // Auto select DocuSign fontColor from the text color (HEX)
  // Otherwise, the fontColor will be 'Black' or 'White' depends on the color's value (V of HSV)
  autoFontColor?: boolean 
}

export const createDocuSignTab = (s: Signature, options?: CreateDocuSignTabOptions): any => {
  let font = undefined as string | undefined 
  let fontSize = undefined as string | undefined 
  let fontColor = undefined as string | undefined
  let bold = undefined as boolean | undefined
  let italic = undefined as boolean | undefined 
  if (s.tabType === 'dateSigned') {
    font = fontToDocuSignTabFont(s.font)
    fontSize = fontSizeToDocuSignTabFontSize(s.fontSize)
    fontColor = (options?.autoFontColor === true) 
    ? colorHexToDocuSignTabTextColor(s.textColor) 
    : colorHexToBlackOrWhite(s.textColor)
    bold = isBoldFont(s.font)
    italic = isItalicFont(s.font)
  }
  return {
    anchorAllowWhiteSpaceInCharacters: toBooleanString(s.anchorAllowWhiteSpaceInCharacters === false),
    anchorCaseSensitive: toBooleanString(s.anchorCaseSensitive),
    anchorHorizontalAlignment: s.anchorHorizontalAlignment,
    anchorIgnoreIfNotPresent: toBooleanString(s.anchorIgnoreIfNotPresent),
    anchorMatchWholeWord: toBooleanString(s.anchorMatchWholeWord),
    anchorString: (s.anchorString) ? s.anchorString : s.id,
    anchorUnits: s.anchorUnits, 
    anchorXOffset: s.anchorXOffset,
    anchorYOffset: s.anchorYOffset,
    caption: s.caption,
    isSealSignTab: toBooleanString(s.isSealSignTab),
    recipientId: s.recipientId,
    recipientIdGuid: s.recipientIdGuid,
    scaleValue: s.scaleValue,
    stampType: (s.tabType === 'signHere' || s.tabType === undefined) ? s.stampType : undefined, 
    status: s.status,
    tabGroupLabels: s.tabGroupLabels,
    tabId: s.tabId, 
    tabLabel: s.tabLabel, 
    tabOrder: s.tabOrder,
    tabType: s.tabType,
    tooltip: s.tooltip,
    height: (options?.useElementSize === true) ? toIntegerNumberString(s.height) : undefined,
    width: (options?.useElementSize === true) ? toIntegerNumberString(s.width) : undefined,
    xPosition: (options?.useElementPosition === true) ? toIntegerNumberString(s.x) : undefined,
    yPosition: (options?.useElementPosition === true) ? toIntegerNumberString(s.y) : undefined,
    font,
    fontColor,
    fontSize,
    bold,
    italic,
  } as any
}