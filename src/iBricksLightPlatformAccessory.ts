import {Service, PlatformAccessory, CharacteristicValue} from 'homebridge';
import {iBricksPlatform} from './iBricksPlatform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class iBricksLightPlatformAccessory {

  private isOn = false;
  private service: Service;

  constructor(
    private readonly platform: iBricksPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.description);

    // Set characteristics
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setIsOn.bind(this))
      .onGet(this.getIsOn.bind(this));

    // Interval update
    /*setInterval(() => {
      this.iBricksApiService.getRemoteData(this.deviceId).then((data) => {
        if (this.skipNext) {
          this.skipNext = false;
          return;
        }

        this.relayResponse = data;
        this.service.updateCharacteristic(this.platform.Characteristic.On, data.isOn);
      });
    }, platform.updateInterval);*/
  }

  async setIsOn(value: CharacteristicValue) {
    this.isOn = value as boolean;
    /*this.iBricksApiService.setRemoteData(this.deviceId, new RelayRequest(value as boolean)).then().catch(() => {
      throw Helper.getCommunicationFailureError(this.platform);
    });*/
  }

  async getIsOn(): Promise<CharacteristicValue> {
    return this.isOn;
  }
}
