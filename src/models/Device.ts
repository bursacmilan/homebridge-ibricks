import {Cello} from './Cello';

export class Device {
  public id: string;
  public mac: string;
  public name: string;
  public cello: Cello;

  constructor(id: string, mac: string, name: string, cello: Cello) {
    this.id = id;
    this.name = name;
    this.mac = mac;
    this.cello = cello;
  }
}