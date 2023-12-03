import { Device } from './device';
import { Cello } from '../models/cello';
import { DeviceType } from '../models/device-type';
import { CharacteristicsHelper } from '../characteristics-helper';

export class Relay extends Device {
    private _brightness = 0;

    public isOn = false;
    public hasDimmer = false;

    public get brightness(): number {
        return this._brightness;
    }

    public set brightness(value: number) {
        this._brightness = CharacteristicsHelper.relayBrightnessRound(value * 100);
    }

    public convertBrightnessForCelloValue(x: number): number {
        return x / 100;
    }

    constructor(id: string, mac: string, name: string, leftRight: number, cello: Cello) {
        super(id, mac, name, leftRight, cello, DeviceType.Relay);
        this.leftRight = leftRight;
    }
}
