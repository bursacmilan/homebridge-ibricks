import {IBricksApiRequest} from './iBricksApiRequest';

export class ShutterRequest extends IBricksApiRequest {
  public lamella?: number;
  public shutter?: number;

  constructor(lamella?: number, shutter?: number) {
    super();

    this.lamella = lamella;
    this.shutter = shutter;

    if(this.lamella) {
      this.lamella = Math.round(((this.lamella + 90) / 180 * 100));
    }
  }
}