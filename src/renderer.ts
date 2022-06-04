
export class PDFRenderingContext {

  private pdfInstance: any

  private static pdfJS = require('pdfjs-dist/legacy/build/pdf')
  private static pdfjsWorker = require('pdfjs-dist/legacy/build/pdf.worker.min')
  static {
    // console.log(PDFRenderingContext.pdfjsWorker)
    PDFRenderingContext.pdfJS.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.14.305/legacy/build/pdf.worker.min.js' //PDFRenderingContext.pdfjsWorker
  }

  constructor(src: string | Uint8Array | ArrayBuffer) {
    let data = src
    const task = PDFRenderingContext.pdfJS.getDocument({ data })
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