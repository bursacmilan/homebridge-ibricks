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
    // Handler objects
    Cello.basePath = config.filePath;
    const loggerService = new LoggerService(this.log);
    const networkInfo = new NetworkInfo(config.ipAddress, config.macAddress, config.broadcastAddress);
    const udpMessageSender = new UdpMessageSender(loggerService);
    const messageParser = new MessageParser(udpMessageSender, loggerService);
    const messageGenerator = new MessageGenerator(udpMessageSender, loggerService, networkInfo);

    // UDP Server
    new UdpServer(loggerService, messageParser, networkInfo, udpMessageSender).startAndRun();

    // Send IAMMASTER
    messageGenerator.sendIamMasterBroadcast();

    // Relays
    const cellos = Cello.GetAllCellosFromFiles(loggerService);
    const relays = new DevicesService(cellos, loggerService).getAllRelays();

    for(const relay of relays) {
      const uuid = this.api.hap.uuid.generate(relay.id);
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
        new iBricksLightPlatformAccessory(this, existingAccessory);
      } else {
        this.log.info('Adding new accessory:', relay.id);

        const accessory = new this.api.platformAccessory(relay.name, uuid);
        accessory.context.device = relay;

        new iBricksLightPlatformAccessory(this, accessory);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
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
