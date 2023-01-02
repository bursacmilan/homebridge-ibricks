import {API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic} from 'homebridge';

import {PLATFORM_NAME, PLUGIN_NAME} from './settings';
import {iBricksLightPlatformAccessory} from './iBricksLightPlatformAccessory';
import axios from 'axios';
import {iBricksDirectorPlatformAccessory} from './iBricksDirectorPlatformAccessory';
import {iBricksShutterPlatformAccessory} from './iBricksShutterPlatformAccessory';
import {IBricksApiService} from './iBricksApiService';
import {ShutterResponse} from './models/ShutterResponse';
import {RelayRequest} from './models/RelayRequest';
import {RelayResponse} from './models/RelayResponse';
import {DirectorResponse} from './models/DirectorResponse';
import {DirectorRequest} from './models/DirectorRequest';
import {ShutterRequest} from './models/ShutterRequest';

export class iBricksPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  public readonly accessories: PlatformAccessory[] = [];
  public readonly updateInterval = 1500;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.apiBaseUrl);

    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      this.discoverDevices(config);
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.push(accessory);
  }

  discoverDevices(config: PlatformConfig) {
    // Director
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const iBricksApiServiceRelay = new IBricksApiService<RelayResponse, RelayRequest>(this, config, 'Relais', () => { });

    this.addDevices(config, 'relay',
      (platform, accessory, deviceId) =>
        new iBricksLightPlatformAccessory(this, accessory, deviceId, config, iBricksApiServiceRelay));

    // Director
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const iBricksApiServiceDirector = new IBricksApiService<DirectorResponse, DirectorRequest>(this, config, 'Directors', () => { });

    this.addDevices(config, 'director',
      (platform, accessory, deviceId) =>
        new iBricksDirectorPlatformAccessory(this, accessory, deviceId, config, iBricksApiServiceDirector));

    // Shutter
    const iBricksApiServiceShutter = new IBricksApiService<ShutterResponse, ShutterRequest>(this, config, 'Shutter',
      (response: ShutterResponse) => {
        response.lamellaTarget = Math.round((response.lamellaTarget / 100 * 180) - 90);
        response.lamella = Math.round((response.lamella / 100 * 180) - 90);
      });

    this.addDevices(config, 'shutter',
      (platform, accessory, deviceId) =>
        new iBricksShutterPlatformAccessory(this, accessory, deviceId, config, iBricksApiServiceShutter));
  }

  private addDevices(config: PlatformConfig, device: string,
    accessoryFactory: (platform: iBricksPlatform, accessory: PlatformAccessory, deviceId: string) => void) {

    axios.get(config.apiBaseUrl + `/Devices/all?className=${device}`)
      .then((response) => {
        const data = response.data;

        for (const device of data) {
          const uuid = this.api.hap.uuid.generate(device.id);
          const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

          if (existingAccessory) {
            this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
            accessoryFactory(this, existingAccessory, device.id);
          } else {
            this.log.info('Adding new accessory:', device.id);

            const accessory = new this.api.platformAccessory(device.description, uuid);
            accessory.context.device = device;

            accessoryFactory(this, accessory, device.id);
            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
          }
        }
      })
      .catch((error) => {
        this.log.error(error);
      });
  }
}
