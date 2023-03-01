export class EmptyImageSource extends Error {
  constructor() {
    const msg = `The source of the image cannot be empty`;
    super(msg);
  }
}
