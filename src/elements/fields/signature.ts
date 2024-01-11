import { Field } from './field';

export interface DateStampProperties {
  dateAreaHeight?: number;
  dateAreaWidth?: number;
  dateAreaX?: number;
  dateAreaY?: number;
}
export interface Stamp {
  // stamp properties
  customField?: string;
  dateStampProperties?: DateStampProperties;
  disallowUserResizeStamp?: boolean;
  externalID?: string;
  imageBase64?: string;
  imageType?: 'stamp_image' | 'signature_image' | 'initials_image';
  phoneticName?: string;
  signatureName?: string;
  stampFormat?: 'NameHanko' | 'NameDateHanko';
  stampImageUri?: string;
  stampSizeMM?: number;
}

export interface Signature extends Field {
  anchorStringFont?: string; // Helvetica is the default font
  anchorStringFontSize?: number; // Default is 2

  // =====================================================================================================
  // The following attributes are the attributes of the DocuSign signHere, initailHere and dateSigned tabs
  // =====================================================================================================
  anchorAllowWhiteSpaceInCharacters?: boolean; // true is the default value
  anchorCaseSensitive?: boolean; // false is the default value
  anchorHorizontalAlignment?: 'left' | 'right'; // left is the default value
  anchorIgnoreIfNotPresent?: boolean; // true is the default value
  anchorMatchWholeWord?: boolean; // false is the default value
  anchorString: string; // Anchor string for DocuSign
  anchorUnits?: 'pixels' | 'inches' | 'mms' | 'cms'; // default is pixels
  anchorXOffset?: number;
  anchorYOffset?: number;
  caption?: string;
  isSealSignTab?: boolean;
  recipientId?: string;
  recipientIdGuid?: string;
  scaleValue?: number;
  stampType?: 'signature' | 'stamp';
  status?: 'active' | 'signed' | 'declined' | 'na';
  tabGroupLabels?: string[];
  tabId?: string;
  tabLabel?: string;
  tabOrder?: number;
  tabType?: 'signHere' | 'initialHere' | 'dateSigned';
  tooltip?: string;
  stamp?: Stamp;

  // option to create as text field
  textFieldMode?: boolean;
}
