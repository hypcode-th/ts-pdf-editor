import { Size } from "./document"
import { Element } from "./elements/element"
import { StandardFonts } from "pdf-lib"

export interface IPage {
  refFileId?: string
  refPageIndex?: number
  elements?: Element[]
  pageSize: Size
  font?: string 
  fontSize?: number
  textColor?: string
}

export class Page {
  private refFileId?: string
  private refPageIndex?: number
  private elements: Element[]
  public pageSize: Size
  public font: string 
  public fontSize: number
  public textColor: string

  constructor(data: IPage) {
    this.refFileId = data?.refFileId
    this.refPageIndex = data?.refPageIndex
    this.elements = data?.elements ? data?.elements : []
    this.pageSize = data?.pageSize
    this.font = (data?.font) ? data.font : StandardFonts.Helvetica
    this.fontSize = (data?.fontSize) ? data.fontSize : 16
    this.textColor = (data.textColor) ? data.textColor : '#000000'
  }

  public serialize(): IPage {
    return {
      refFileId: this.refFileId,
      refPageIndex: this.refPageIndex, 
      elements: this.elements,
      pageSize: this.pageSize,
      font: this.font,
      fontSize: this.fontSize,
      textColor: this.textColor
    }
  }

  public getElements(): Element[] {
    return this.elements
  }

  public getElement(idx: number): Element {
    return this.elements[idx]
  }

  public findElementIndex(elem: Element): number {
    return this.elements.findIndex((e) => { return Object.is(elem, e) })
  }

  public addElement(elem: Element): number {
    return this.elements.push(elem)
  }

  public deleteElement(idx: number): Element | undefined {
    const deletedElements = this.elements.splice(idx, 1)
    if (deletedElements.length > 0) {
      return deletedElements[0]
    }
    return undefined
  }

  public getRefFileId(): string | undefined {
    return this.refFileId
  }

  public getRefPageIndex(): number | undefined {
    return this.refPageIndex
  }

  public deleteElements(shouldDelete: (elem: Element, idx: number) => boolean) {
    this.elements = this.elements.filter((value, index) => {
      return !shouldDelete(value, index)
    })
  }

  public addElements(elements: Element[]) {
    this.elements = this.elements.concat(elements)
  }
}