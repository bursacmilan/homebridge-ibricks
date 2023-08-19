import {IbricksPlatform} from './ibricks-platform';
import {PlatformAccessory, Service} from 'homebridge';
import {MessageParser} from './services/message-parser';
import {InternalPlatformAccessory} from './internal-platform-accessory';
import {Director} from './devices/director';

export class IbricksMeteoPlatformAccessory extends InternalPlatformAccessory {

  protected readonly service: Service;

  constructor(
    platform: IbricksPlatform,
    accessory: PlatformAccessory,
    messageParser: MessageParser,
    private readonly _director: Director,
  ) {

    super(accessory, platform, messageParser, `Cello meteo ${_director.leftRight === 1 ? 'Right' : 'Left'}`, _director);

    this.service = accessory.getService(this.platform.Service.TemperatureSensor) || accessory.addService(this.platform.Service.TemperatureSensor);
    this.service.setCharacteristic(this.platform.Characteristic.Name, _director.name);

    this.subscribeToCharacteristics();
    this.setInitialLocalValues();

    this.getCelloEvents().subscribe(celloEvent => {
      this._director.currentTemperature = this.isRightDevice() ?
        celloEvent.cello.currentTemperatureRight : celloEvent.cello.currentTemperatureLeft;

      this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, this._director.currentTemperature);
    });
  }

  protected subscribeToCharacteristics(): void {
    this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this._getCurrentTemperature.bind(this));
  }

  protected setInitialLocalValues(): void {
    this._director.currentTemperature = this.isRightDevice() ?
      this._director.cello.currentTemperatureRight : this._director.cello.currentTemperatureLeft;
  }

  private _getCurrentTemperature(): number {
    return this._director.currentTemperature;
  }
}
