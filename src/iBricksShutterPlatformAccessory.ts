import {Service, PlatformAccessory, CharacteristicValue, PlatformConfig} from 'homebridge';
import {iBricksPlatform} from './iBricksPlatform';
import {iBricksShutter} from './iBricks/iBricksShutter';
import {ShutterResponse} from './models/ShutterResponse';
import {Helper} from './Helper';
import {ShutterRequest} from './models/ShutterRequest';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class iBricksShutterPlatformAccessory {

  private service: Service;
  private iBricksShutter: iBricksShutter;
  private shutterResponse?: ShutterResponse;
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

    this.service = this.accessory.getService(this.platform.Service.WindowCovering) ||
      this.accessory.addService(this.platform.Service.WindowCovering);

    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.description);

    this.iBricksShutter = new iBricksShutter(accessory.context.device.id, config, this.platform);

    // Set characteristics
    this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition)
      .onGet(((value) => this.getData(value, 'shutter')));

    this.service.getCharacteristic(this.platform.Characteristic.PositionState)
      .onGet(((value) => this.getData(value, 'shutterDirection')));

    this.service.getCharacteristic(this.platform.Characteristic.TargetPosition)
      .onGet(((value) => this.getData(value, 'shutterTarget')))
      .onSet(((value) => this.setShutter(value)));

    this.service.getCharacteristic(this.platform.Characteristic.TargetHorizontalTiltAngle)
      .onGet(((value) => this.getData(value, 'lamellaTarget')))
      .onSet(this.setLamella.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.CurrentHorizontalTiltAngle)
      .onGet(((value) => this.getData(value, 'lamella')));

    // Set update interval
    setInterval(() => {
      this.iBricksShutter.getRemoteData().then((data) => {
        if (this.skipNext) {
          this.skipNext = false;
          return;
        }

        this.shutterResponse = data;
        this.service.updateCharacteristic(this.platform.Characteristic.CurrentPosition, data.shutter);
        this.service.updateCharacteristic(this.platform.Characteristic.PositionState, data.shutterDirection);
        this.service.updateCharacteristic(this.platform.Characteristic.TargetPosition, data.shutterTarget);
        this.service.updateCharacteristic(this.platform.Characteristic.CurrentHorizontalTiltAngle, data.lamella);
        this.service.updateCharacteristic(this.platform.Characteristic.TargetHorizontalTiltAngle, data.lamellaTarget);
      });
    }, this.platform.updateInterval);
  }

  async getData(value: CharacteristicValue, property: string) {
    if (!this.shutterResponse) {
      this.platform.log.debug('No data yet, throw error');
      throw Helper.getCommunicationFailureError(this.platform);
    }

    this.platform.log.debug('Shutter getData ->', JSON.stringify(this.shutterResponse));
    return this.shutterResponse[property];
  }

  async setShutter(value: CharacteristicValue) {
    this.skipNext = true;
    await this.iBricksShutter.setRemoteData(new ShutterRequest(undefined, value as number)).then().catch(() => {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    });
  }

  async setLamella(value: CharacteristicValue) {
    this.skipNext = true;
    await this.iBricksShutter.setRemoteData(new ShutterRequest(value as number, undefined)).then().catch(() => {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    });
  }
}
