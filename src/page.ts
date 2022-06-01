import { PDFPage } from "pdf-lib"
import { Size } from "./document"
import { Element } from "./elements/element"

export interface IPage {
  refFileID?: string
  refPageIndex?: number
  elements?: Element[]
  pageSize?: Size
}

export class Page {
  private refFileID?: string
  private refPageIndex?: number
  private elements: Element[]
  public pageSize?: Size

  constructor(data?: IPage) {
    this.refFileID = data?.refFileID
    this.refPageIndex = data?.refPageIndex
    this.elements = data?.elements ? data?.elements : []
    this.pageSize = data?.pageSize
  }

  public static createFromPDFPage(pdfPage: PDFPage, refFileID?: string, refPageIndex?: number): Page {
    return new Page({
      refFileID,
      refPageIndex,
      pageSize: pdfPage.getSize()
    })
  }

  public serialize(): IPage {
    return {
      refFileID: this.refFileID,
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

  public addElement(elem: Element) {
    this.elements.push(elem)
  }

  public deleteElement(idx: number): Element | undefined {
    const deletedElements = this.elements.splice(idx, 1)
    if (deletedElements.length > 0) {
      return deletedElements[0]
    }
    return undefined
  }
}