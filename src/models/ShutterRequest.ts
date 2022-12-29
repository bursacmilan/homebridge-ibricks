export class ShutterRequest {
  public lamella?: number;
  public shutter?: number;

  constructor(lamella?: number, shutter?: number) {
    this.lamella = lamella;
    this.shutter = shutter;

    if(this.lamella) {
      this.lamella = Math.round(((this.lamella + 90) / 180 * 100));
    }
  }
}