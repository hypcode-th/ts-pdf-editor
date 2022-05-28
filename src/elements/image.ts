import { PDFDocument, PDFImage, PDFPage, PDFPageDrawImageOptions } from 'pdf-lib'
import { UnsupportMimeType } from '../errors'
import { Element } from './element'

export interface Image extends Element {
  src: string | Uint8Array | ArrayBuffer
  mimeType: string
  drawOption?: PDFPageDrawImageOptions
}

export async function embededImage(doc: PDFDocument, img: Image): Promise<PDFImage> {
  switch (img.mimeType) {
  case 'image/jpg':
  case 'image/jpeg':
    return await doc.embedJpg(img.src)
  case 'image/png':
    return await doc.embedPng(img.src)
  default:
    throw new UnsupportMimeType(img.mimeType)
  }
}

export async function drawOnPage(page: PDFPage, img: Image): Promise<void> {
  const pdfImg = await embededImage(page.doc, img)
  if (pdfImg) {
    page.drawImage(pdfImg, img.drawOption)
  }
}