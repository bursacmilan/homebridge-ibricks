import { PlatformAccessory, Service } from 'homebridge';
import { CharacteristicValue, WithUUID } from 'hap-nodejs/dist/types';
import { Characteristic } from 'hap-nodejs/dist/lib/Characteristic';
import { IbricksPlatform } from './ibricks-platform';
import { CelloEvent } from './models/cello-event';
import { filter, Observable } from 'rxjs';
import { MessageParser } from './services/message-parser';
import { Device } from './devices/device';

export abstract class InternalPlatformAccessory {
    protected abstract readonly service: Service;
    protected constructor(
        private readonly _accessory: PlatformAccessory,
        protected readonly platform: IbricksPlatform,
        private readonly _messageParser: MessageParser,
        model: string,
        private readonly _device: Device,
    ) {
        const accessoryInformationService = this._accessory.getService(this.platform.Service.AccessoryInformation);
        if (!accessoryInformationService) {
            throw new Error('AccessoryInformationService not found');
        }

        accessoryInformationService
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'iBricks')
            .setCharacteristic(this.platform.Characteristic.Model, model)
            .setCharacteristic(this.platform.Characteristic.SerialNumber, _device.cello.mac);
    }

    protected abstract subscribeToCharacteristics(): void;
    protected abstract setInitialLocalValues(): void;

    protected updateCharacteristic<
        T extends WithUUID<{
            new (): Characteristic;
        }>,
    >(name: string | T, value: CharacteristicValue): Service {
        return this.service.updateCharacteristic(name, value);
    }

    protected checkIsThisDevice(celloEvent: CelloEvent): boolean {
        return !(
            celloEvent.deviceType !== this._device.deviceType ||
            celloEvent.cello.mac !== this._device.mac ||
            celloEvent.leftRight !== this._device.leftRight
        );
    }

    protected isRightDevice(): boolean {
        return this._device.leftRight === 1;
    }

    protected getCelloEvents(): Observable<CelloEvent> {
        return this._messageParser.celloEvent.pipe(filter(e => this.checkIsThisDevice(e)));
    }
}
