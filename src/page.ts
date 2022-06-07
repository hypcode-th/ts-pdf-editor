import { Size } from "./document"
import { Element } from "./elements/element"
import { Document } from "./document"
import { PDFRenderingContext } from "./renderer"

export interface IPage {
  refFileId?: string
  refPageIndex?: number
  elements?: Element[]
  pageSize: Size
}

export class Page {
  private refFileId?: string
  private refPageIndex?: number
  private elements: Element[]
  public pageSize: Size

  constructor(data: IPage) {
    this.refFileId = data?.refFileId
    this.refPageIndex = data?.refPageIndex
    this.elements = data?.elements ? data?.elements : []
    this.pageSize = data?.pageSize
  }

  public serialize(): IPage {
    return {
      refFileId: this.refFileId,
      refPageIndex: this.refPageIndex, 
      elements: this.elements,
      pageSize: this.pageSize
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
}