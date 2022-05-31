export class UnsupportMimeType extends Error {
  constructor(mimeType: string) {
    const msg = `A mime type ${mimeType} is not supported`;
    super(msg);
  }
}

export class UnsupportFont extends Error {
  constructor(font: string) {
    const msg = `Font ${font} is not supported`;
    super(msg);
  }
}

export class EmptyImageSource extends Error {
  constructor() {
    const msg = `The source of the image cannot be empty`;
    super(msg);
  }
}