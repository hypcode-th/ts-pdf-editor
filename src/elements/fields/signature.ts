import { Field } from './field';

export interface Signature extends Field {
  anchorStringFont?: string; // Helvetica is the default font
  anchorStringFontSize?: number; // Default is 2

  // =====================================================================================================
  // The following attributes are the attributes of the DocuSign signHere, initailHere and dateSigned tabs
  // =====================================================================================================

  anchorAllowWhiteSpaceInCharacters?: boolean; // true is the default value
  anchorCaseSensitive?: boolean; // false is the default value
  anchorHorizontalAlignment?: 'left' | 'right' | undefined; // left is the default value
  anchorIgnoreIfNotPresent?: boolean; // true is the default value
  anchorMatchWholeWord?: boolean; // false is the default value
  anchorString: string; // Anchor string for DocuSign
  anchorUnits?: 'pixels' | 'inches' | 'mms' | 'cms' | undefined; // default is pixels
  anchorXOffset?: number;
  anchorYOffset?: number;
  caption?: string;
  isSealSignTab?: boolean;
  recipientId?: string;
  recipientIdGuid?: string;
  optional?: boolean;

  // Scales the size of the tab.
  // This field accepts values from 0.5 to 2.0,
  // where 0.5 is half the normal size, 1.0 is normal size,
  // and 2.0 is twice the normal size.
  scaleValue?: number;

  stampType?: 'signature' | 'stamp' | undefined;

  status?: 'active' | 'signed' | 'declined' | 'na' | undefined;

  tabGroupLabels?: string[];

  tabId?: string;

  tabLabel?: string;

  tabOrder?: number;

  tabType?: 'signHere' | 'initialHere' | 'dateSigned' | undefined;

  tooltip?: string;
}


