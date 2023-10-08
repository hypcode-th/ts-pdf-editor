import { Size } from './document';
import { Element, ElementType } from './elements/element';
import { StandardFonts } from 'pdf-lib';

export interface IPage {
  refFileId?: string;
  refPageIndex?: number;
  elements?: Element[];
  pageSize: Size;
  font?: string;
  fontSize?: number;
  textColor?: string;
}

export class Page {
  public refFileId?: string;
  public refPageIndex?: number;
  public elements: Element[];
  public pageSize: Size;
  public font: string;
  public fontSize: number;
  public textColor: string;

  constructor(data: IPage) {
    this.refFileId = data?.refFileId;
    this.refPageIndex = data?.refPageIndex;
    this.pageSize = data?.pageSize;
    this.font = data?.font ? data.font : StandardFonts.Helvetica;
    this.fontSize = data?.fontSize ? data.fontSize : 16;
    this.textColor = data.textColor ? data.textColor : '#000000';

    // Convert type of not correct
    const elements = data?.elements ? data?.elements : [];
    this.elements = elements.map((elem: any) => {
      if (elem.elemType === ElementType.DateInput && typeof elem.date === 'string') {
        return { ...elem, date: new Date(elem.date) };
      }
      return elem;
    });
  }

  public serialize(): IPage {
    return {
      refFileId: this.refFileId,
      refPageIndex: this.refPageIndex,
      elements: this.elements,
      pageSize: this.pageSize,
      font: this.font,
      fontSize: this.fontSize,
      textColor: this.textColor,
    };
  }

  public getElements(): Element[] {
    return this.elements;
  }

  public getElement(idx: number): Element {
    return this.elements[idx];
  }

  public findElementIndex(elem: Element): number {
    return this.elements.findIndex((e) => {
      return Object.is(elem, e);
    });
  }

  public addElement(elem: Element): number {
    return this.elements.push(elem);
  }

  public deleteElement(idx: number): Element | undefined {
    const deletedElements = this.elements.splice(idx, 1);
    if (deletedElements.length > 0) {
      return deletedElements[0];
    }
    return undefined;
  }

  public getRefFileId(): string | undefined {
    return this.refFileId;
  }

  public setRefFileId(refId: string | undefined) {
    this.refFileId = refId;
  }

  public getRefPageIndex(): number | undefined {
    return this.refPageIndex;
  }

  public deleteElements(shouldDelete: (elem: Element, idx: number) => boolean) {
    this.elements = this.elements.filter((value, index) => {
      return !shouldDelete(value, index);
    });
  }

  public addElements(elements: Element[]) {
    this.elements = this.elements.concat(elements);
  }

  public findFieldsByName(name: string): Element[] {
    return this.elements.filter((e) => (e as any).name === name);
  }

  public setFieldValue(fieldName: string, value: any) {
    if (!this.elements || this.elements.length === 0) return;
    for (const elem of this.elements) {
      if ((elem as any).name === fieldName) {
        switch (elem.elemType) {
          case ElementType.TextField:
            (elem as any).text = `${value}`;
            break;
          case ElementType.DateInput:
            (elem as any).date = new Date(value);
            break;
          case ElementType.RadioGroup:
            (elem as any).selectedOption = value;
            break;
          case ElementType.Signature:
            (elem as any).anchorString = value;
            break;
          case ElementType.CheckBox:
            if (typeof value === 'boolean') {
              (elem as any).checked = value;
            } else if (typeof value === 'string') {
              (elem as any).checked = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
            } else if (typeof value === 'number') {
              (elem as any).checked = value !== 0;
            }
            break;
          case ElementType.OptionList:
          case ElementType.Dropdown:
            if (Array.isArray(value)) {
              (elem as any).selectedOptions = value.map((v) => `${v}`);
            } else if (typeof value === 'string') {
              (elem as any).selectedOptions = `${value}`.split(',').map((v) => v.trim());
            } else {
              (elem as any).selectedOptions = [`${value}`];
            }
            break;
          default:
            break;
        }
      }
    }
  }
}
