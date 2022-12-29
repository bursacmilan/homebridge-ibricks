import {Service, PlatformAccessory, CharacteristicValue, PlatformConfig} from 'homebridge';
import {iBricksRelay} from './iBricks/iBricksRelay';
import {iBricksPlatform} from './iBricksPlatform';
import {RelayRequest} from './models/RelayRequest';
import {RelayResponse} from './models/RelayResponse';
import {Helper} from './Helper';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class iBricksLightPlatformAccessory {

  private service: Service;
  private iBricksRelay: iBricksRelay;
  private relayResponse?: RelayResponse;
  private skipNext = false;

  constructor(
    private readonly platform: iBricksPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly deviceId: string,
    private readonly config: PlatformConfig,
  ) {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.description);

    this.iBricksRelay = new iBricksRelay(accessory.context.device.id, config, this.platform);

    // Set characteristics
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setIsOn.bind(this))
      .onGet(this.getIsOn.bind(this));

    // Interval update
    setInterval(() => {
      this.iBricksRelay.getRemoteData().then((data) => {
        if (this.skipNext) {
          this.skipNext = false;
          return;
        }

        this.relayResponse = data;
        this.service.updateCharacteristic(this.platform.Characteristic.On, data.isOn);
      });
    }, platform.updateInterval);
  }

  async setIsOn(value: CharacteristicValue) {
    this.iBricksRelay.setRemoteData(new RelayRequest(value as boolean)).then().catch(() => {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    });
  }

  async getIsOn(): Promise<CharacteristicValue> {
    if (!this.relayResponse) {
      this.platform.log.debug('No data yet, throw error');
      throw Helper.getCommunicationFailureError(this.platform);
    }

    this.platform.log.debug('Relay getIsOn ->', JSON.stringify(this.relayResponse));
    return this.relayResponse?.isOn;
  }
}
