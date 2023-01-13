import {Device} from './Device';

export class Relay extends Device {
  public leftRight: number;

  constructor(id: string, mac: string, name: string, leftRight: number) {
    super(id, mac, name);
    this.leftRight = leftRight;
  }
}