import {Cello} from './cello';
import {DeviceType} from './device-type';

export class CelloEvent {
  public cello: Cello;
  public event: string;
  public deviceType: DeviceType;
  public leftRight: number;

  constructor(cello: Cello, event: string, deviceType: DeviceType, leftRight: number) {
    this.cello = cello;
    this.event = event;
    this.deviceType = deviceType;
    this.leftRight = leftRight;
  }
}