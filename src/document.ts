import { PageSizes, PDFDocument, PDFPage } from "pdf-lib"
import { Md5 } from "ts-md5"
import { IPage, Page } from "./page"
import * as fontkit from '@pdf-lib/fontkit';
import * as fs from 'fs';
import { PDFFileGenerator, PDFFileGeneratorOption } from "./context";

export interface Size {
  width: number
  height: number
}

export interface PDFFileReference {
  refID: string
  src: string | Uint8Array | ArrayBuffer
}

export interface IDocument {
  pages: IPage[]
  fileReferences: PDFFileReference[]

  // The default page size
  pageSize?: Size
}

export class Document {
  private pages: Page[]
  private fileReferences: PDFFileReference[]

  // The default page size
  private pageSize: Size

  private constructor(data?: IDocument) {
    this.pages = (data?.pages) ? data.pages.map((p) => { return new Page(p) }) : []
    this.fileReferences = (data?.fileReferences) ? data.fileReferences : []
    this.pageSize = (data?.pageSize) ? data.pageSize : { width: PageSizes.A4[0], height: PageSizes.A4[1] }
  }

  public static createNewDocument = (pageSize?: Size): Document => {
    return new Document({
      pages: [],
      fileReferences: [],
      pageSize
    })
  }

  public static createFromPDFBinary = async (src: string | Uint8Array, refID?: string): Promise<Document> => {
    let pages: IPage[] = []
    let refFileID: string
    const pdfDoc = await PDFDocument.load(src)
    if (refID) {
      refFileID = refID
    } else {
      let md5 = new Md5()
      if (typeof src === 'string') {
        md5.appendStr(src)
      } else {
        md5.appendByteArray(src)
      }
      refFileID = md5.end(false) as string
    }
    
    pages = pdfDoc.getPages().map((pdfPage: PDFPage, idx: number) => {
      return Page.createFromPDFPage(pdfPage, refFileID, idx).serialize()
    })
    return new Document({
      pages,
      fileReferences: [{ refID: refFileID, src }]
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
    return new Document(doc.pages)
  }

  public generatePDFFile = async (options?: PDFFileGeneratorOption): Promise<Buffer> => {
    const generator = await PDFFileGenerator.create(this.serialize(), options)
    return await generator.generate()
  }
}
