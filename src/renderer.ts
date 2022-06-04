import * as fs from 'fs';

const pdfJS = require('pdfjs-dist/legacy/build/pdf')
const pdfjsWorker = require('pdfjs-dist/legacy/build/pdf.worker.entry')

pdfJS.GlobalWorkerOptions.workerSrc = pdfjsWorker

export class PDFRenderingContext {

  private pdfInstance: any

  constructor(src: string | Uint8Array | ArrayBuffer) {
    let data = src
    if ((typeof data === 'string') && (data.startsWith("https://") || data.startsWith("http://"))) {
      data = fs.readFileSync(data)
    }
    const task = pdfJS.getDocument({ data })
    task.promise.then(
      (pdf: any) => {
        this.pdfInstance = pdf
      },
      function (reason: any) {
        console.error(reason)
      }
    )
  }

  public getPDFInstance(): any {
    return this.pdfInstance
  }

  public destroy() {
    this.pdfInstance.destroy()
    this.pdfInstance = undefined
  }

  public async renderPage(idx: number, canvas: HTMLCanvasElement, scale?: number) {
    if (!canvas) return
    // the PDS.js use 1-based page index. Therefore, we getPage with idx + 1
    this.pdfInstance?.getPage(idx + 1).then(async (page: any) => {
      var viewport = page.getViewport({ scale })
      const context = canvas.getContext('2d')
      canvas.height = Math.floor(viewport.height)
      canvas.width = Math.floor(viewport.width)
      canvas.style.height = Math.floor(viewport.height) + 'px'
      canvas.style.width = Math.floor(viewport.width) + 'px'
      let promise = new Promise((resolve, reject) => {
        const task = page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise
          .then(() => {
            resolve(null)
          })
          .catch((err: any) => {
            reject(err)
          })
      });
      await promise
    })
  }
}