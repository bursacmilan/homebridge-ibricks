/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
import {iBricksPlatform} from './iBricksPlatform';
import {CharacteristicValue, PlatformAccessory, Service} from 'homebridge';
import {MessageParser} from './services/MessageParser';
import {MessageGenerator} from './services/MessageGenerator';
import {DeviceType} from './models/DeviceType';
import {Director} from './devices/Director';

export class iBricksDirectorPlatformAccessory {

  private readonly service: Service;
  private currentTemperature = 0;
  private targetTemperature = 0;
  private heatingCoolingState = 3;

  constructor(
    private readonly platform: iBricksPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly messageParser: MessageParser,
    private readonly messageGenerator: MessageGenerator,
    private readonly director: Director,
  ) {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'iBricks')
      .setCharacteristic(this.platform.Characteristic.Model, `Cello director ${this.director.leftRight === 1 ? 'Right' : 'Left'}`)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.director.cello.mac);

    this.service = this.accessory.getService(this.platform.Service.Thermostat) ||
      this.accessory.addService(this.platform.Service.Thermostat);

    this.service.setCharacteristic(this.platform.Characteristic.Name, director.name);

    // Set characteristics
    this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.getCurrentTemperature.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits)
      .onGet((() => 0));

    this.service.getCharacteristic(this.platform.Characteristic.TargetTemperature)
      .onSet(this.setTargetTemperature.bind(this))
      .onGet(this.getTargetTemperature.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState)
      .onGet((() => 3));

    this.service.getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
      .onGet((() => 3));

    // Init heatingCoolingState
    const configHeatingCoolingStateString = platform.config.directorTargetHeatingCoolingState as string;
    if(configHeatingCoolingStateString) {
      switch (configHeatingCoolingStateString) {
        case 'Off':
          this.heatingCoolingState = 0;
          break;
        case 'Heat':
          this.heatingCoolingState = 1;
          break;
        case 'Cool':
          this.heatingCoolingState = 2;
          break;
        case 'Auto':
          this.heatingCoolingState = 3;
          break;
        default:
          this.heatingCoolingState = 3;
          break;
      }
    }

    this.platform.log.info(
      `Director ${this.director.leftRight === 1 ? 'Right' : 'Left'} heatingCoolingState ${this.heatingCoolingState}`);

    // Set initial state
    this.currentTemperature = this.director.leftRight === 1 ?
      this.director.cello.currentTemperatureRight : this.director.cello.currentTemperatureLeft;

    this.targetTemperature = this.director.leftRight === 1 ?
      this.director.cello.targetTemperatureRight : this.director.cello.targetTemperatureLeft;

    // Subscribe to changes
    this.messageParser.celloEvent.subscribe((celloEvent) => {
      if (celloEvent.deviceType !== DeviceType.Director ||
        celloEvent.cello.mac !== this.director.mac || celloEvent.leftRight !== this.director.leftRight) {
        return;
      }

      this.currentTemperature = this.director.leftRight === 1 ?
        celloEvent.cello.currentTemperatureRight : celloEvent.cello.currentTemperatureLeft;

      this.targetTemperature = this.director.leftRight === 1 ?
        celloEvent.cello.targetTemperatureRight : celloEvent.cello.targetTemperatureLeft;

      this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, this.currentTemperature);
      this.service.updateCharacteristic(this.platform.Characteristic.TargetTemperature, this.targetTemperature);
    });

    // Interval updates
    setInterval(() => {
      this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState, this.heatingCoolingState);
      this.service.updateCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState, this.heatingCoolingState);
    }, 1500);
  }

  private getCurrentTemperature(): number {
    return this.currentTemperature;
  }

  private getTargetTemperature(): number {
    return this.targetTemperature;
  }

  private setTargetTemperature(value: CharacteristicValue): void {
    this.targetTemperature = value as number;
    this.messageGenerator.setDirector(this.director.cello, this.director.leftRight, value as number);
  }
}
