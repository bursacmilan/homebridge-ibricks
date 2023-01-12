/*import {Service, PlatformAccessory, CharacteristicValue, PlatformConfig} from 'homebridge';
import {iBricksPlatform} from './iBricksPlatform';
import {ShutterResponse} from './models/ShutterResponse';
import {Helper} from './Helper';
import {ShutterRequest} from './models/ShutterRequest';
import {IBricksApiService} from './iBricksApiService';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 *//*
export class iBricksShutterPlatformAccessory {

  private service: Service;
  private shutterResponse?: ShutterResponse;
  private skipNext = false;

  constructor(
    private readonly platform: iBricksPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly deviceId: string,
    private readonly config: PlatformConfig,
    private readonly iBricksApiService: IBricksApiService<ShutterResponse, ShutterRequest>,
  ) {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

    this.service = this.accessory.getService(this.platform.Service.WindowCovering) ||
      this.accessory.addService(this.platform.Service.WindowCovering);

    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.description);

    // Set characteristics
    this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition)
      .onGet((() => this.getData('shutter')));

    this.service.getCharacteristic(this.platform.Characteristic.PositionState)
      .onGet((() => this.getData('shutterDirection')));

    this.service.getCharacteristic(this.platform.Characteristic.TargetPosition)
      .onGet((() => this.getData('shutterTarget')))
      .onSet(((value) => this.setData(value, undefined)));

    this.service.getCharacteristic(this.platform.Characteristic.TargetHorizontalTiltAngle)
      .onGet((() => this.getData('lamellaTarget')))
      .onSet(((value) => this.setData(undefined, value)));

    this.service.getCharacteristic(this.platform.Characteristic.CurrentHorizontalTiltAngle)
      .onGet((() => this.getData('lamella')));

    // Set update interval
    setInterval(() => {
      this.iBricksApiService.getRemoteData(accessory.context.device.id).then((data) => {
        if (this.skipNext) {
          this.skipNext = false;
          return;
        }

        this.updateShutterResponse(data);
        this.service.updateCharacteristic(this.platform.Characteristic.CurrentPosition, data.shutter);
        this.service.updateCharacteristic(this.platform.Characteristic.PositionState, data.shutterDirection);
        this.service.updateCharacteristic(this.platform.Characteristic.TargetPosition, data.shutterTarget);
        this.service.updateCharacteristic(this.platform.Characteristic.CurrentHorizontalTiltAngle, data.lamella);
        this.service.updateCharacteristic(this.platform.Characteristic.TargetHorizontalTiltAngle, data.lamellaTarget);
      });
    }, this.platform.updateInterval);
  }

  private async getData(property: string) {
    if (!this.shutterResponse) {
      await this.iBricksApiService.getRemoteData(this.deviceId).then((data) => {
        this.updateShutterResponse(data);

        if(!this.shutterResponse) {
          throw Helper.getCommunicationFailureError(this.platform);
        }
      }).catch(() => {
        throw Helper.getCommunicationFailureError(this.platform);
      });
    }

    this.platform.log.debug('Shutter getData ->', JSON.stringify(this.shutterResponse));
    return this.shutterResponse![property];
  }

  private async setData(shutter?: CharacteristicValue, lamella?: CharacteristicValue) {
    await this.iBricksApiService.getRemoteData(this.deviceId).then((data) => this.updateShutterResponse(data)).catch(() => {
      throw Helper.getCommunicationFailureError(this.platform);
    });

    this.skipNext = true;
    await this.iBricksApiService.setRemoteData(this.deviceId,
      new ShutterRequest(
        (shutter as number) === 100 ? 90 : (lamella as number),
        (shutter as number))).then().catch(() => {
      throw Helper.getCommunicationFailureError(this.platform);
    });
  }

  private updateShutterResponse(data: ShutterResponse) {
    this.shutterResponse = data;
    if (this.shutterResponse.shutter === 100) {
      this.shutterResponse.lamella = 90;
    }
  }
}
*/