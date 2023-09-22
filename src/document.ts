import { PageSizes, PDFDocument, PDFPage, StandardFonts } from "pdf-lib"
import { Md5 } from "ts-md5"
import { IPage, Page } from "./page"
import { PDFFileGenerator, PDFFileGeneratorOption } from "./generator";
import { PDFRenderingContext } from "./renderer";
import { Element } from "./elements/element";

export interface Size {
  width: number
  height: number
}

export interface PDFFileReference {
  refId: string
  src: string | Uint8Array | ArrayBuffer
}

export interface IDocument {
  pages: IPage[]
  fileReferences: PDFFileReference[]

  // The default value
  defaultPageSize?: Size
  defaultFont?: string
  defaultFontSize?: number
}

export class Document {
  private pages: Page[] = []
  private fileReferences: PDFFileReference[] = []

  private renderContextDict: Map<string, PDFRenderingContext> = new Map<string, PDFRenderingContext>()

  // The default page size
  public defaultPageSize: Size
  public defaultFont: string
  public defaultFontSize: number

  public constructor(data?: IDocument) {
    this.pages = (data?.pages) ? data.pages.map((p) => { return new Page(p) }) : []
    this.fileReferences = (data?.fileReferences) ? data.fileReferences : []
    this.defaultPageSize = (data?.defaultPageSize) ? data.defaultPageSize : { width: PageSizes.A4[0], height: PageSizes.A4[1] }
    this.defaultFont = (data?.defaultFont) ? data.defaultFont : StandardFonts.Helvetica
    this.defaultFontSize = (data?.defaultFontSize) ? data.defaultFontSize : 16
  }

  public destroy() {
    for (const value of this.renderContextDict.values()) {
      value.destroy()
    }
    this.renderContextDict.clear()
  }

  public static createNewDocument = (pageSize?: Size): Document => {
    return new Document({
      pages: [],
      fileReferences: [],
      defaultPageSize: pageSize
    })
  }

  public static createFromPDFBinary = async (src: string | Uint8Array, refId?: string): Promise<Document> => {
    let pages: IPage[] = []
    let refFileId: string
    const pdfDoc = await PDFDocument.load(src)
    if (refId) {
      refFileId = refId
    } else {
      const md5 = new Md5()
      if (typeof src === 'string') {
        md5.appendStr(src)
      } else {
        md5.appendByteArray(src)
      }
      refFileId = md5.end(false) as string
    }

    pages = pdfDoc.getPages().map((pdfPage: PDFPage, idx: number) => {
      const size = pdfPage.getSize()
      return {
        refFileId,
        refPageIndex: idx,
        elements: [],
        pageSize: size
      }
    })
    return new Document({
      pages,
      fileReferences: [{ refId: refFileId, src }]
    })
  }

  public serialize(): IDocument {
    return {
      pages: this.pages.map((page) => { return page.serialize() }),
      fileReferences: this.fileReferences
    }
  }

  public static toJSONBuffer = (doc: Document): Buffer => {
    return Buffer.from(JSON.stringify(doc.serialize() as any));
  }

  public static fromJSONBuffer = (jsonBuffer: Buffer): Document => {
    const doc = JSON.parse(jsonBuffer.toString());
    return new Document(doc)
  }

  public generatePDFFile = async (options?: PDFFileGeneratorOption): Promise<Buffer> => {
    const iDoc = this.serialize()
    const generator = await PDFFileGenerator.create(iDoc, options)
    return await generator.generate()
  }

  public getPages(): Page[] {
    return this.pages
  }

  public setPages(pages: Page[]) {
    this.pages = [...pages]
  }

  public getPage(idx: number): Page {
    return this.pages[idx]
  }

  public getPageCount(): number {
    return this.pages.length
  }

  public addPage(page?: Page): Page {
    const p = (page) ? page : new Page({
      pageSize: this.defaultPageSize,
    })
    this.pages.push(p)
    return p
  }

  public insertPage(idx: number, page?: Page): Page {
    const p = (page) ? page : new Page({
      pageSize: this.defaultPageSize,
      font: this.defaultFont,
      fontSize: this.defaultFontSize,
      textColor: '#000000'
    })
    this.pages.splice(idx, 0, p)
    return p
  }

  public deletePage(idx: number): Page | undefined {
    const deletedPages = this.pages.splice(idx, 1)
    if (deletedPages.length > 0) {
      return deletedPages[0]
    }
    return undefined
  }

  public reorderPage(oldIndex: number, newIdx: number) {
    const pages = this.pages.splice(oldIndex, 1)
    if (pages.length > 0) {
      this.pages.splice(newIdx, 0, pages[0])
    }
  }

  public getFileReferences(): PDFFileReference[] {
    return this.fileReferences
  }

  public addFileReference(v: PDFFileReference) {
    this.fileReferences.push(v)
  }

  public changeFileReferenceId(oldRefId: string, newRefId: string) {
    if (oldRefId === newRefId) return
    const idx1 = this.fileReferences.findIndex((v: PDFFileReference) => { 
      return (v.refId === newRefId)
    })
    if (idx1 >= 0) {
      throw new Error('The Ref Id is already in used')
    }
    const idx2 = this.fileReferences.findIndex((v: PDFFileReference) => { 
      return (v.refId === oldRefId)
    })
    if (idx2 < 0) {
      return
    }

    this.fileReferences[idx2].refId = newRefId
    for(let page of this.pages) {
      if (page.getRefFileId() === oldRefId) {
        page.setRefFileId(newRefId)
      }
    }
  }

  protected async getRenderingContext(refFileId: string): Promise<PDFRenderingContext | undefined> {
    let ctx = this.renderContextDict.get(refFileId)
    if (ctx) {
      return ctx
    }
    const refFile = this.fileReferences.find((value, idx) => {
      return value.refId === refFileId
    })
    if (!refFile) return undefined

    ctx = await PDFRenderingContext.create(refFile.src)
    this.renderContextDict.set(refFileId, ctx)
    return ctx
  }

  private renderBlank(page: Page, canvas: HTMLCanvasElement, scale?: number) {
    // Render empty page
    const { width, height } = page.pageSize
    const iHeight = Math.floor(height * (scale || 1))
    const iWidth = Math.floor(width * (scale || 1))
    canvas.height = iHeight
    canvas.width = iWidth
    canvas.style.height = iHeight + 'px'
    canvas.style.width = iWidth + 'px'
    canvas.style.background = '#FFFFFF'
    const context = canvas.getContext('2d')
    if (context) {
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, iWidth, iHeight);
    }
  }

  public async renderPage(pageIndex: number, canvas: HTMLCanvasElement, scale?: number) {
    const page = this.getPage(pageIndex)
    const refFileId = page.getRefFileId()
    const refPageIndex = page.getRefPageIndex()
    let renderingContext: any = null
    if (refFileId && (refPageIndex !== undefined && refPageIndex >= 0)) {
      renderingContext = await this.getRenderingContext(refFileId)
    } 
    if (renderingContext) {
      await renderingContext.renderPage(refPageIndex, canvas, scale)
    } else {
      this.renderBlank(page, canvas, scale)
    }
  }

  public setFieldValue(fieldName: string, value: any) {
    this.pages.forEach((p: Page) => {
      p.setFieldValue(fieldName, value)
    })
  }

  public findFieldsByName(name: string): Element[] {
    return this.pages.reduce<Element[]>((prev: Element[], curr: Page) => {
      const elems = curr.findFieldsByName(name)
      if (elems.length > 0) {
        prev = prev.concat(elems)
      }
      return prev
    }, [] as Element[])
  }
}
