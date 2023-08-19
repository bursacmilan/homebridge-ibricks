import {API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic} from 'homebridge';

import {PLATFORM_NAME, PLUGIN_NAME} from './settings';
import {IbricksLightPlatformAccessory} from './ibricks-light-platform-accessory';
import {Cello} from './models/cello';
import {DevicesService} from './services/devices-service';
import {NetworkInfo} from './models/network-info';
import {LoggerService} from './services/logger-service';
import {UdpMessageSender} from './services/udp-message-sender';
import {MessageGenerator} from './services/message-generator';
import {MessageParser} from './services/message-parser';
import {UdpServer} from './services/udp-server';
import {IbricksShutterPlatformAccessory} from './ibricks-shutter-platform-accessory';
import {IbricksDirectorPlatformAccessory} from './ibricks-director-platform-accessory';
import {IbricksMeteoPlatformAccessory} from './ibricks-meteo-platform-accessory';
import * as fs from 'fs';
import address from 'address';
import {Device} from './devices/device';
import {Relay} from './devices/relay';
import {Shutter} from './devices/shutter';
import {Director} from './devices/director';

export class IbricksPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.apiBaseUrl);

    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      void this._discoverDevices(config).then();
    });
  }

  public configureAccessory(accessory: PlatformAccessory): void {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.push(accessory);
  }

  private async _discoverDevices(config: PlatformConfig): Promise<void> {
    // Print config
    this.log.info('Config:', JSON.stringify(config));

    // Init path
    Cello.basePath = this.api.user.storagePath() + '/iBricks/';
    if(!fs.existsSync(Cello.basePath)) {
      fs.mkdirSync(Cello.basePath);
    }

    const macAddress = await this._getMacAddress();
    const ipAddress = address.ip() as string;
    this.log.info(`IP: ${ipAddress}`);
    this.log.info(`MAC: ${macAddress}`);

    // Handler objects
    const loggerService = new LoggerService(this.log);
    const networkInfo = new NetworkInfo(ipAddress, macAddress, '255.255.255.255');
    const udpMessageSender = new UdpMessageSender(loggerService);
    const messageParser = new MessageParser(loggerService);
    const messageGenerator = new MessageGenerator(udpMessageSender, loggerService, networkInfo);

    // UDP Server
    new UdpServer(loggerService, messageParser, networkInfo).startAndRun();

    // Send IAMMASTER
    messageGenerator.sendIamMasterBroadcast();

    // Init cellos
    const cellos = Cello.getAllCellosFromFiles(loggerService);
    const devicesService = new DevicesService(cellos, loggerService, config);

    // Relays
    const relays = devicesService.getAllRelays();
    this._addDevices<Relay>(relays, (platform, accessory, relay) => {
      new IbricksLightPlatformAccessory(platform, accessory, messageParser, messageGenerator, relay);
    });

    // Shutters
    const shutters = devicesService.getAllShutters();
    this._addDevices<Shutter>(shutters, (platform, accessory, shutter) => {
      new IbricksShutterPlatformAccessory(platform, accessory, messageParser, messageGenerator, shutter);
    });

    // Directors
    const directors = devicesService.getAllDirectors(true);
    this._addDevices<Director>(directors, (platform, accessory, director) => {
      new IbricksDirectorPlatformAccessory(platform, accessory, messageParser, messageGenerator, director);
    });

    // Meteos
    const meteos = devicesService.getAllMeteos();
    this._addDevices<Director>(meteos, (platform, accessory, meteo) => {
      new IbricksMeteoPlatformAccessory(platform, accessory, messageParser, meteo);
    });

    // Reboot if needed
    if(config.reboot) {
      for(const cello of cellos) {
        messageGenerator.rebootCello(cello);
      }
    }
  }

  private _addDevices<T>(devices: T[],
    accessoryFactory: (platform: IbricksPlatform, accessory: PlatformAccessory, device: T) => void): void {
    for(const device of devices) {
      const deviceAsBase = device as unknown as Device;

      const uuid = this.api.hap.uuid.generate(deviceAsBase.id);
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
        accessoryFactory(this, existingAccessory, device);
      } else {
        this.log.info('Adding new accessory:', deviceAsBase.id);

        const accessory = new this.api.platformAccessory(deviceAsBase.name, uuid);
        accessory.context.device = device;

        accessoryFactory(this, accessory, device);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }

  private _getMacAddress(): Promise<string> {
    return new Promise((resolve, reject) => {
      address.mac((err, mac) => {
        if (err) {
          return reject(err);
        }

        // Replace all '-' from mac and make to upper
        resolve(mac.replace(/:/g, '').toUpperCase());
      });
    });
  }
}
