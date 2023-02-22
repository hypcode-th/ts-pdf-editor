
export class PDFRenderingContext {

  private pdfInstance: any

  private static pdfJS = require('pdfjs-dist/legacy/build/pdf')
  private static pdfjsWorker = require('pdfjs-dist/legacy/build/pdf.worker.min')
  static {
    const workerSrc = process.env.PDFJS_WORKER_SRC
    PDFRenderingContext.pdfJS.GlobalWorkerOptions.workerSrc = (workerSrc) ? workerSrc : 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/legacy/build/pdf.worker.min.js'
    //PDFRenderingContext.pdfJS.GlobalWorkerOptions.workerSrc = PDFRenderingContext.pdfjsWorker
  }

  private constructor(pdfInstance: any) {
    this.pdfInstance = pdfInstance
  }

  public static create = async (src: string | Uint8Array | ArrayBuffer): Promise<PDFRenderingContext> => {
    let data = src
    const task = PDFRenderingContext.pdfJS.getDocument({ data })
    let promise = new Promise<PDFRenderingContext>((resolve, reject) => {
      task.promise.then(
        (pdf: any) => {
          resolve(new PDFRenderingContext(pdf))
        },
        function (reason: any) {
          console.error(reason)
          reject(reason)
        }
      )
    })
    return await promise
  }

  public getPDFInstance(): any {
    return this.pdfInstance
  }

  public destroy() {
    this.pdfInstance.destroy()
    this.pdfInstance = undefined
  }

  public async getPage(idx: number): Promise<any> {
    let promise = new Promise<PDFRenderingContext>((resolve, reject) => {
      this.pdfInstance!.getPage(idx + 1).then(
        (page: any) => {
          resolve(page)
        }, function (reason: any) {
          console.error(reason)
          reject(reason)
        }
      )
    })
    return await promise
  }

  public async renderPage(idx: number, canvas: HTMLCanvasElement, scale?: number) {
    if (!canvas) return
    const page = await this.getPage(idx)
    var viewport = page.getViewport({ scale })
    const context = canvas.getContext('2d')
    canvas.height = Math.floor(viewport.height)
    canvas.width = Math.floor(viewport.width)
    canvas.style.height = Math.floor(viewport.height) + 'px'
    canvas.style.width = Math.floor(viewport.width) + 'px'
    let promise = new Promise((resolve, reject) => {
      page.render({
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
  }
}