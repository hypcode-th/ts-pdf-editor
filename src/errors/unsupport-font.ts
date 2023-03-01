export class UnsupportFont extends Error {
  constructor(font: string) {
    const msg = `Font ${font} is not supported`;
    super(msg);
  }
}
