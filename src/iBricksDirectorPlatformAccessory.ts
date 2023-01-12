/*
import {Service, PlatformAccessory, CharacteristicValue, PlatformConfig} from 'homebridge';

import {iBricksPlatform} from './iBricksPlatform';
import {DirectorResponse} from './models/DirectorResponse';
import {Helper} from './Helper';
import {DirectorRequest} from './models/DirectorRequest';
import {IBricksApiService} from './iBricksApiService';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 *//*
export class iBricksDirectorPlatformAccessory {

  private service: Service;
  private directorResponse?: DirectorResponse;
  private skipNext = false;

  constructor(
    private readonly platform: iBricksPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly deviceId: string,
    private readonly config: PlatformConfig,
    private readonly iBricksApiService: IBricksApiService<DirectorResponse, DirectorRequest>,
  ) {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

    this.service = this.accessory.getService(this.platform.Service.Thermostat) ||
      this.accessory.addService(this.platform.Service.Thermostat);

    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.description);

    // Set characteristics
    this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet((() => this.getData('currentTemperature')));

    this.service.getCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits)
      .onGet((() => 0));

    this.service.getCharacteristic(this.platform.Characteristic.TargetTemperature)
      .onGet((() => this.getData('targetTemperature')))
      .onSet(this.setRemoteData.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState)
      .onGet((() => 1));

    this.service.getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
      .onGet((() => 1));

    // Interval updates
    setInterval(() => {
      this.iBricksApiService.getRemoteData(this.deviceId).then((data) => {
        if (this.skipNext) {
          this.skipNext = false;
          return;
        }

        this.directorResponse = data;
        this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, data.currentTemperature);
        this.service.updateCharacteristic(this.platform.Characteristic.TargetTemperature, data.targetTemperature);
        this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState, 1);
        this.service.updateCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState, 1);
      });
    }, this.platform.updateInterval);
  }

  private async getData(property: string) {
    if (!this.directorResponse) {
      this.platform.log.debug('No data yet, throw error');
      throw Helper.getCommunicationFailureError(this.platform);
    }

    this.platform.log.debug('Director getData ->', JSON.stringify(this.directorResponse));
    return this.directorResponse[property];
  }

  async setRemoteData(value: CharacteristicValue) {
    try {
      await this.iBricksApiService.setRemoteData(this.deviceId, new DirectorRequest(value as number));
    } catch {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }
}
*/