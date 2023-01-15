import {Service, PlatformAccessory, CharacteristicValue} from 'homebridge';
import {iBricksPlatform} from './iBricksPlatform';
import {MessageParser} from './services/MessageParser';
import {MessageGenerator} from './services/MessageGenerator';
import {Relay} from './devices/Relay';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class iBricksLightPlatformAccessory {

  private isOn = false;
  private brightness = 0;
  private readonly hasDimmer: boolean = false;
  private readonly service: Service;

  constructor(
    private readonly platform: iBricksPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly messageParser: MessageParser,
    private readonly messageGenerator: MessageGenerator,
    private readonly relay: Relay,
  ) {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'iBricks')
      .setCharacteristic(this.platform.Characteristic.Model, `Cello Relay ${this.relay.leftRight === 1 ? 'Right' : 'Left'}`)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.relay.cello.mac);

    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
    this.service.setCharacteristic(this.platform.Characteristic.Name, this.relay.name);

    if(this.relay.cello.hardwareInfo && this.relay.cello.hardwareInfo.D > 0) {
      this.hasDimmer = true;
    }

    // Set characteristics
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setIsOn.bind(this))
      .onGet(this.getIsOn.bind(this));

    if(this.hasDimmer) {
      this.platform.log.info(`Cello ${this.relay.cello.mac} has dimmer`);
      this.service.getCharacteristic(this.platform.Characteristic.Brightness)
        .onSet(this.setBrightness.bind(this))
        .onGet(this.getBrightness.bind(this));
    }

    // Set initial state
    if(!this.hasDimmer) {
      this.isOn = this.relay.leftRight === 1 ? this.relay.cello.relayRight : this.relay.cello.relayLeft;
    } else {
      this.brightness = this.relay.leftRight === 1 ? this.relay.cello.dimmerRight : this.relay.cello.dimmerLeft;
      this.isOn = this.brightness > 0;
    }

    // Subscribe to changes
    messageParser.celloChangedEvent.subscribe((cello) => {
      if (cello.mac !== this.accessory.context.device.mac) {
        return;
      }

      if(!this.hasDimmer) {
        this.isOn = this.relay.leftRight === 1 ? cello.relayRight : cello.relayLeft;

        platform.log.debug(`Relay ${this.relay.name} changed to ${this.isOn ? 'on' : 'off'}`);
        this.service.updateCharacteristic(this.platform.Characteristic.On, this.isOn);
        return;
      }

      this.brightness = this.relay.leftRight === 1 ? cello.dimmerRight : cello.dimmerLeft;
      this.isOn = this.brightness > 0;

      platform.log.debug(`Relay ${this.relay.name} changed to ${this.isOn ? 'on' : 'off'} and brightness ${this.brightness}`);

      this.service.updateCharacteristic(this.platform.Characteristic.On, this.isOn);
      this.service.updateCharacteristic(this.platform.Characteristic.Brightness, Math.floor(this.brightness * 100));
    });
  }

  async setIsOn(value: CharacteristicValue) {
    if(!this.hasDimmer) {
      this.isOn = value as boolean;
      this.messageGenerator.setRelay(this.relay.cello, this.relay.leftRight, this.isOn);
      return;
    }

    this.isOn = value as boolean;
    if(this.isOn) {
      return;
    }

    this.messageGenerator.setDimmer(this.relay.cello, this.relay.leftRight, this.isOn ? 1 : 0);
  }

  async getIsOn(): Promise<CharacteristicValue> {
    return this.isOn;
  }

  async setBrightness(value: CharacteristicValue) {
    this.brightness = value as number / 100;
    this.messageGenerator.setDimmer(this.relay.cello, this.relay.leftRight, this.brightness);
  }

  async getBrightness(): Promise<CharacteristicValue> {
    return Math.floor(this.brightness * 100);
  }
}
