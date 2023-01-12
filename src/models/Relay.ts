import {Device} from './Device';

export class Relay extends Device {
  public leftRight: number;

  constructor(id: string, name: string, leftRight: number) {
    super(id, name);
    this.leftRight = leftRight;
  }
}