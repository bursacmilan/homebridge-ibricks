import {API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic} from 'homebridge';

import {PLATFORM_NAME, PLUGIN_NAME} from './settings';
import {iBricksLightPlatformAccessory} from './iBricksLightPlatformAccessory';
import {Cello} from './models/Cello';
import {DevicesService} from './services/DevicesService';
import {NetworkInfo} from './models/NetworkInfo';
import {LoggerService} from './services/LoggerService';
import {UdpMessageSender} from './services/UdpMessageSender';
import {MessageGenerator} from './services/MessageGenerator';
import {MessageParser} from './services/MessageParser';
import {UdpServer} from './services/UdpServer';
import {iBricksShutterPlatformAccessory} from './iBricksShutterPlatformAccessory';
import {iBricksDirectorPlatformAccessory} from './iBricksDirectorPlatformAccessory';
import {iBricksMeteoPlatformAccessory} from './iBricksMeteoPlatformAccessory';
import {Device} from './devices/Device';
import {Director} from './devices/Director';
import * as fs from 'fs';

export class iBricksPlatform implements DynamicPlatformPlugin {
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
      this.discoverDevices(config);
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.push(accessory);
  }

  discoverDevices(config: PlatformConfig) {
    // Print config
    this.log.info('Config:', JSON.stringify(config));

    // Init path
    Cello.basePath = this.api.user.storagePath() + '/iBricks/';
    if(!fs.existsSync(Cello.basePath)) {
      fs.mkdirSync(Cello.basePath);
    }

    // Handler objects
    const loggerService = new LoggerService(this.log);
    const networkInfo = new NetworkInfo(config.ipAddress, config.macAddress, config.broadcastAddress);
    const udpMessageSender = new UdpMessageSender(loggerService);
    const messageParser = new MessageParser(udpMessageSender, loggerService);
    const messageGenerator = new MessageGenerator(udpMessageSender, loggerService, networkInfo);

    // UDP Server
    new UdpServer(loggerService, messageParser, networkInfo, udpMessageSender).startAndRun();

    // Send IAMMASTER
    messageGenerator.sendIamMasterBroadcast();

    // Init cellos
    const cellos = Cello.GetAllCellosFromFiles(loggerService);
    const devicesService = new DevicesService(cellos, loggerService, config);

    // Relays
    const relays = devicesService.getAllRelays();
    this.addDevices<Director>(relays, (platform, accessory, relay) => {
      new iBricksLightPlatformAccessory(platform, accessory, messageParser, messageGenerator, relay);
    });

    // Shutters
    const shutters = devicesService.getAllShutters();
    this.addDevices<Director>(shutters, (platform, accessory, shutter) => {
      new iBricksShutterPlatformAccessory(platform, accessory, messageParser, messageGenerator, shutter);
    });

    // Directors
    const directors = devicesService.getAllDirectors(true);
    this.addDevices<Director>(directors, (platform, accessory, director) => {
      new iBricksDirectorPlatformAccessory(platform, accessory, messageParser, messageGenerator, director);
    });

    // Meteos
    const meteos = devicesService.getAllMeteos();
    this.addDevices<Director>(meteos, (platform, accessory, meteo) => {
      new iBricksMeteoPlatformAccessory(platform, accessory, messageParser, messageGenerator, meteo);
    });

    // Reboot if needed
    if(config.reboot) {
      for(const cello of cellos) {
        messageGenerator.rebootCello(cello);
      }
    }
  }

  private addDevices<T>(devices: T[],
    accessoryFactory: (platform: iBricksPlatform, accessory: PlatformAccessory, device: T) => void) {
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
}
