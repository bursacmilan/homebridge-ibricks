import { Device } from './device';
import { Cello } from '../models/cello';
import { DeviceType } from '../models/device-type';

export class Director extends Device {
    public currentTemperature = 0;
    public targetTemperature = 0;
    public heatingCoolingState = 3;

    constructor(id: string, mac: string, name: string, leftRight: number, cello: Cello) {
        super(id, mac, name, leftRight, cello, DeviceType.Director);
        this.leftRight = leftRight;
    }
}
