export class UnsupportMimeType extends Error {
  constructor(mimeType: string) {
    const msg = `A mime type ${mimeType} is not supported`;
    super(msg);
  }
}
