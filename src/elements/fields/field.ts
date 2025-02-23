import { StyledElement } from '../element';
import { DocuSignTabData } from './docusign';

export interface Field extends StyledElement {
  name: string;
  exported?: boolean;
  readOnly?: boolean;
  required?: boolean;

  tab?: DocuSignTabData;
}
