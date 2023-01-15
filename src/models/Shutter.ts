import {Device} from './Device';
import {Cello} from './Cello';

export class Shutter extends Device {
  public leftRight: number;

  constructor(id: string, mac: string, name: string, leftRight: number, cello: Cello) {
    super(id, mac, name, cello);
    this.leftRight = leftRight;
  }
}