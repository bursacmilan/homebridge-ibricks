import {Cello} from '../models/cello';
import {DeviceType} from '../models/device-type';

export class Device {

  public id: string;
  public mac: string;
  public name: string;
  public cello: Cello;
  public leftRight: number;
  public deviceType: DeviceType;

  constructor(id: string, mac: string, name: string, leftRight: number, cello: Cello, deviceType: DeviceType) {
    this.id = id;
    this.name = name;
    this.mac = mac;
    this.cello = cello;
    this.leftRight = leftRight;
    this.deviceType = deviceType;
  }
}