import {IbricksPlatform} from './ibricks-platform';
import {CharacteristicValue, PlatformAccessory, Service} from 'homebridge';
import {MessageParser} from './services/message-parser';
import {MessageGenerator} from './services/message-generator';
import {InternalPlatformAccessory} from './internal-platform-accessory';
import {Director} from './devices/director';

export class IbricksDirectorPlatformAccessory extends InternalPlatformAccessory {
  protected readonly service: Service;

  constructor(
    platform: IbricksPlatform,
    accessory: PlatformAccessory,
    messageParser: MessageParser,
    private readonly _messageGenerator: MessageGenerator,
    private readonly _director: Director,
  ) {
    super(accessory, platform, messageParser, `Cello director ${_director.leftRight === 1 ? 'Right' : 'Left'}`, _director);

    this.service = accessory.getService(this.platform.Service.Thermostat) || accessory.addService(this.platform.Service.Thermostat);
    this.service.setCharacteristic(this.platform.Characteristic.Name, _director.name);

    this.subscribeToCharacteristics()
    this._initHeatingCoolingState(platform);
    this.setInitialLocalValues();
    this._setupIntervalUpdates();

    this.getCelloEvents().subscribe(celloEvent => {
      this._director.currentTemperature = this.isRightDevice() ?
        celloEvent.cello.currentTemperatureRight : celloEvent.cello.currentTemperatureLeft;

      this._director.targetTemperature = this.isRightDevice() ?
        celloEvent.cello.targetTemperatureRight : celloEvent.cello.targetTemperatureLeft;

      this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, this._director.currentTemperature);
      this.service.updateCharacteristic(this.platform.Characteristic.TargetTemperature, this._director.targetTemperature);
    });
  }

  private _setupIntervalUpdates(): void {
    setInterval(() => {
      this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState, this._director.heatingCoolingState);
      this.service.updateCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState, this._director.heatingCoolingState);
    }, 1500);
  }

  private _initHeatingCoolingState(platform: IbricksPlatform): void {
    let configHeatingCoolingStateString = platform.config.directorTargetHeatingCoolingState as string;
    if (!configHeatingCoolingStateString) {
      configHeatingCoolingStateString = 'Auto';
    }

    switch (configHeatingCoolingStateString) {
      case 'Off':
        this._director.heatingCoolingState = 0;
        break;
      case 'Heat':
        this._director.heatingCoolingState = 1;
        break;
      case 'Cool':
        this._director.heatingCoolingState = 2;
        break;
      case 'Auto':
        this._director.heatingCoolingState = 3;
        break;
      default:
        this._director.heatingCoolingState = 3;
        break;
    }

    this.platform.log.info(
      `Director ${this.isRightDevice() ? 'Right' : 'Left'} heatingCoolingState ${this._director.heatingCoolingState}`);
  }

  protected subscribeToCharacteristics(): void {
    this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this._getCurrentTemperature.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits)
      .onGet((() => 0));

    this.service.getCharacteristic(this.platform.Characteristic.TargetTemperature)
      .onSet(this._setTargetTemperature.bind(this))
      .onGet(this._getTargetTemperature.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState)
      .onGet((() => 3));

    this.service.getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
      .onGet((() => 3));
  }

  protected setInitialLocalValues(): void {
    this._director.currentTemperature = this._director.leftRight === 1 ?
      this._director.cello.currentTemperatureRight : this._director.cello.currentTemperatureLeft;

    this._director.targetTemperature = this._director.leftRight === 1 ?
      this._director.cello.targetTemperatureRight : this._director.cello.targetTemperatureLeft;
  }

  private _getCurrentTemperature(): number {
    return this._director.currentTemperature;
  }

  private _getTargetTemperature(): number {
    return this._director.targetTemperature;
  }

  private _setTargetTemperature(value: CharacteristicValue): void {
    this._director.targetTemperature = value as number;
    this._messageGenerator.setDirector(this._director.cello, this._director.leftRight, value as number);
  }
}
