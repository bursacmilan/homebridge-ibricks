/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
import {iBricksPlatform} from './iBricksPlatform';
import {PlatformAccessory, Service} from 'homebridge';
import {MessageParser} from './services/MessageParser';
import {MessageGenerator} from './services/MessageGenerator';
import {DeviceType} from './models/DeviceType';
import {Director} from './devices/Director';

export class iBricksMeteoPlatformAccessory {

  private service: Service;
  private currentTemperature = 0;

  constructor(
    private readonly platform: iBricksPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly messageParser: MessageParser,
    private readonly messageGenerator: MessageGenerator,
    private readonly director: Director,
  ) {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'iBricks')
      .setCharacteristic(this.platform.Characteristic.Model, `Cello meteo ${this.director.leftRight === 1 ? 'Right' : 'Left'}`)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.director.cello.mac);

    this.service = this.accessory.getService(this.platform.Service.TemperatureSensor) ||
      this.accessory.addService(this.platform.Service.TemperatureSensor);

    this.service.setCharacteristic(this.platform.Characteristic.Name, director.name);

    // Set characteristics
    this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.getCurrentTemperature.bind(this));

    // Set initial state
    this.currentTemperature = this.director.leftRight === 1 ?
      this.director.cello.currentTemperatureRight : this.director.cello.currentTemperatureLeft;

    // Subscribe to changes
    this.messageParser.celloEvent.subscribe((celloEvent) => {
      if (celloEvent.deviceType !== DeviceType.Director ||
        celloEvent.cello.mac !== this.director.mac || celloEvent.leftRight !== this.director.leftRight) {
        return;
      }

      this.currentTemperature = this.director.leftRight === 1 ?
        celloEvent.cello.currentTemperatureRight : celloEvent.cello.currentTemperatureLeft;

      this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, this.currentTemperature);
    });
  }

  private getCurrentTemperature(): number {
    return this.currentTemperature;
  }
}
