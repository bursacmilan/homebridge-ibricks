export class HardwareInfo {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public R: number;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public S: number;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public H: number;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public D: number;

  constructor(r: number, s: number, h: number, d: number) {
    this.R = r;
    this.S = s;
    this.H = h;
    this.D = d;
  }
}