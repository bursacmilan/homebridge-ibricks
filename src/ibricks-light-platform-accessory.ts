import {Service, PlatformAccessory, CharacteristicValue} from 'homebridge';
import {IbricksPlatform} from './ibricks-platform';
import {MessageParser} from './services/message-parser';
import {MessageGenerator} from './services/message-generator';
import {Relay} from './devices/relay';
import {InternalPlatformAccessory} from './internal-platform-accessory';
import {CelloEvent} from './models/cello-event';

export class IbricksLightPlatformAccessory extends InternalPlatformAccessory {
  protected service: Service;

  constructor(
    platform: IbricksPlatform,
    accessory: PlatformAccessory,
    messageParser: MessageParser,
    private readonly _messageGenerator: MessageGenerator,
    private readonly _relay: Relay,
  ) {
    super(accessory, platform, messageParser, `Cello Relay ${_relay.leftRight === 1 ? 'Right' : 'Left'}`, _relay);

    this.service = accessory.getService(this.platform.Service.Lightbulb) || accessory.addService(this.platform.Service.Lightbulb);
    this.service.setCharacteristic(this.platform.Characteristic.Name, this._relay.name);

    this._enableDimmerIfNeeded();
    this.subscribeToCharacteristics();
    this.setInitialLocalValues();

    // Subscribe to changes
    this.getCelloEvents().subscribe(celloEvent => {
      if (!this._relay.hasDimmer) {
        this._handleRelay(celloEvent, platform);
        return;
      }

      this._handleDimmer(celloEvent, platform);
    });
  }

  private _handleDimmer(celloEvent: CelloEvent, platform: IbricksPlatform): void {
    this._relay.brightness = this.isRightDevice() ? celloEvent.cello.dimmerRight : celloEvent.cello.dimmerLeft;
    this._relay.isOn = this._relay.brightness > 0;

    platform.log.debug(`Relay ${this._relay.name} changed to ${this._relay.isOn ? 'on' : 'off'} and brightness ${this._relay.brightness}`);

    this.service.updateCharacteristic(this.platform.Characteristic.On, this._relay.isOn);
    this.service.updateCharacteristic(this.platform.Characteristic.Brightness, this._relay.brightness);
  }

  private _handleRelay(celloEvent: CelloEvent, platform: IbricksPlatform): void {
    this._relay.isOn = this.isRightDevice() ? celloEvent.cello.relayRight : celloEvent.cello.relayLeft;

    platform.log.debug(`Relay ${this._relay.name} changed to ${this._relay.isOn ? 'on' : 'off'}`);
    this.service.updateCharacteristic(this.platform.Characteristic.On, this._relay.isOn);
  }

  private _enableDimmerIfNeeded(): void {
    if (this._relay.cello.hardwareInfo && this._relay.cello.hardwareInfo.D > 0) {
      this._relay.hasDimmer = true;
    }
  }

  protected subscribeToCharacteristics(): void {
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this._setIsOn.bind(this))
      .onGet(this._getIsOn.bind(this));

    if (this._relay.hasDimmer) {
      this.platform.log.info(`Cello ${this._relay.cello.mac} has dimmer`);
      this.service.getCharacteristic(this.platform.Characteristic.Brightness)
        .onSet(this._setBrightness.bind(this))
        .onGet(this._getBrightness.bind(this));
    }
  }

  protected setInitialLocalValues(): void {
    if (!this._relay.hasDimmer) {
      this._relay.isOn = this.isRightDevice() ? this._relay.cello.relayRight : this._relay.cello.relayLeft;
    } else {
      this._relay.brightness = this.isRightDevice() ? this._relay.cello.dimmerRight : this._relay.cello.dimmerLeft;
      this._relay.isOn = this._relay.brightness > 0;
    }
  }

  private _setIsOn(value: CharacteristicValue): void {
    if (!this._relay.hasDimmer) {
      this._relay.isOn = value as boolean;
      this._messageGenerator.setRelay(this._relay.cello, this._relay.leftRight, this._relay.isOn);
      return;
    }

    this._relay.isOn = value as boolean;
    if (this._relay.isOn) {
      return;
    }

    this._messageGenerator.setDimmer(this._relay.cello, this._relay.leftRight, this._relay.isOn ? 1 : 0);
  }

  private _getIsOn(): boolean {
    return this._relay.isOn;
  }

  private _setBrightness(value: CharacteristicValue): void {
    this._relay.brightness = this._relay.convertBrightnessForCelloValue(value as number);
    this._messageGenerator.setDimmer(this._relay.cello, this._relay.leftRight, this._relay.convertBrightnessForCelloValue(this._relay.brightness));
  }

  private _getBrightness(): number {
    return this._relay.brightness;
  }
}
