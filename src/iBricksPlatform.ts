import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { iBricksLightPlatformAccessory } from './iBricksLightPlatformAccessory';
import axios from 'axios';
import {iBricksDirectorPlatformAccessory} from './iBricksDirectorPlatformAccessory';
import {iBricksShutterPlatformAccessory} from './iBricksShutterPlatformAccessory';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
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

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.discoverDevices(config);
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.push(accessory);
  }

  discoverDevices(config: PlatformConfig) {
    axios.get(config.apiBaseUrl + '/Devices/all?className=relay')
      .then((response) => {
        const data = response.data;
        console.log('Devices loaded from remote API: ' + JSON.stringify(data));

        for (const device of data) {
          console.log('Adding device with id ' + device.id);

          const uuid = this.api.hap.uuid.generate(device.id);
          const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

          if (existingAccessory) {
            this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
            new iBricksLightPlatformAccessory(this, existingAccessory, device.id, config);
          } else {
            this.log.info('Adding new accessory:', device.id);

            const accessory = new this.api.platformAccessory(device.description, uuid);
            accessory.context.device = device;

            new iBricksLightPlatformAccessory(this, accessory, device.id, config);
            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
          }
        }
      })
      .catch((error) => {
        console.error(error);
      });

    axios.get(config.apiBaseUrl + '/Devices/all?className=director')
      .then((response) => {
        const data = response.data;
        console.log('Devices loaded from remote API: ' + JSON.stringify(data));

        for (const device of data) {
          console.log('Adding device with id ' + device.id);

          const uuid = this.api.hap.uuid.generate(device.id);
          const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

          if (existingAccessory) {
            this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
            new iBricksDirectorPlatformAccessory(this, existingAccessory, device.id, config);
          } else {
            this.log.info('Adding new accessory:', device.id);

            const accessory = new this.api.platformAccessory(device.description, uuid);
            accessory.context.device = device;

            new iBricksDirectorPlatformAccessory(this, accessory, device.id, config);
            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
          }
        }
      })
      .catch((error) => {
        console.error(error);
      });

    axios.get(config.apiBaseUrl + '/Devices/all?className=shutter')
      .then((response) => {
        const data = response.data;
        console.log('Devices loaded from remote API: ' + JSON.stringify(data));

        for (const device of data) {
          console.log('Adding device with id ' + device.id);

          const uuid = this.api.hap.uuid.generate(device.id);
          const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

          if (existingAccessory) {
            this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
            new iBricksShutterPlatformAccessory(this, existingAccessory, device.id, config);
          } else {
            this.log.info('Adding new accessory:', device.id);

            const accessory = new this.api.platformAccessory(device.description, uuid);
            accessory.context.device = device;

            new iBricksShutterPlatformAccessory(this, accessory, device.id, config);
            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
          }
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }
}
