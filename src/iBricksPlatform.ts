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

    // Handler objects
    Cello.basePath = this.api.user.storagePath() + '/iBricks/';
    const loggerService = new LoggerService(this.log);
    const networkInfo = new NetworkInfo(config.ipAddress, config.macAddress, config.broadcastAddress);
    const udpMessageSender = new UdpMessageSender(loggerService);
    const messageParser = new MessageParser(udpMessageSender, loggerService);
    const messageGenerator = new MessageGenerator(udpMessageSender, loggerService, networkInfo);

    // UDP Server
    new UdpServer(loggerService, messageParser, networkInfo, udpMessageSender).startAndRun();

    // Send IAMMASTER
    messageGenerator.sendIamMasterBroadcast();

    const cellos = Cello.GetAllCellosFromFiles(loggerService);

    // Relays
    const relays = new DevicesService(cellos, loggerService, config).getAllRelays();

    for(const relay of relays) {
      const uuid = this.api.hap.uuid.generate(relay.id);
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
        new iBricksLightPlatformAccessory(this, existingAccessory, messageParser, messageGenerator, relay);
      } else {
        this.log.info('Adding new accessory:', relay.id);

        const accessory = new this.api.platformAccessory(relay.name, uuid);
        accessory.context.device = relay;

        new iBricksLightPlatformAccessory(this, accessory, messageParser, messageGenerator, relay);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }

    // Shutters
    const shutters = new DevicesService(cellos, loggerService, config).getAllShutters();

    for(const shutter of shutters) {
      const uuid = this.api.hap.uuid.generate(shutter.id);
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
        new iBricksShutterPlatformAccessory(this, existingAccessory, messageParser, messageGenerator, shutter);
      } else {
        this.log.info('Adding new accessory:', shutter.id);

        const accessory = new this.api.platformAccessory(shutter.name, uuid);
        accessory.context.device = shutter;

        new iBricksShutterPlatformAccessory(this, accessory, messageParser, messageGenerator, shutter);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }

    // Directors
    const directors = new DevicesService(cellos, loggerService, config).getAllDirectors(true);

    for(const director of directors) {
      const uuid = this.api.hap.uuid.generate(director.id);
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
        new iBricksDirectorPlatformAccessory(this, existingAccessory, messageParser, messageGenerator, director);
      } else {
        this.log.info('Adding new accessory:', director.id);

        const accessory = new this.api.platformAccessory(director.name, uuid);
        accessory.context.device = director;

        new iBricksDirectorPlatformAccessory(this, accessory, messageParser, messageGenerator, director);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }

    // Meteos
    const meteos = new DevicesService(cellos, loggerService, config).getAllMeteos();

    for(const meteo of meteos) {
      const uuid = this.api.hap.uuid.generate(meteo.id);
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
        new iBricksMeteoPlatformAccessory(this, existingAccessory, messageParser, messageGenerator, meteo);
      } else {
        this.log.info('Adding new accessory:', meteo.id);

        const accessory = new this.api.platformAccessory(meteo.name, uuid);
        accessory.context.device = meteo;

        new iBricksMeteoPlatformAccessory(this, accessory, messageParser, messageGenerator, meteo);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }

    // Reboot if needed
    if(config.reboot) {
      for(const cello of cellos) {
        messageGenerator.rebootCello(cello);
      }
    }
  }
/*
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
  }*/
}
