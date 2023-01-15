/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
import {iBricksPlatform} from './iBricksPlatform';
import {CharacteristicValue, PlatformAccessory, Service} from 'homebridge';
import {MessageParser} from './services/MessageParser';
import {MessageGenerator} from './services/MessageGenerator';
import {Shutter} from './models/Shutter';
import {DeviceType} from './models/DeviceType';

export class iBricksShutterPlatformAccessory {

  private service: Service;
  private currentPosition = 0;
  private targetPosition = 0;
  private positionState = 2;
  private targetLamella = 0;
  private currentLamella = 0;
  private lamellaDisabled = false;

  constructor(
    private readonly platform: iBricksPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly messageParser: MessageParser,
    private readonly messageGenerator: MessageGenerator,
    private readonly shutter: Shutter,
  ) {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'iBricks')
      .setCharacteristic(this.platform.Characteristic.Model, `Cello Shutter ${this.shutter.leftRight === 1 ? 'Right' : 'Left'}`)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.shutter.cello.mac);

    this.service = this.accessory.getService(this.platform.Service.WindowCovering) ||
      this.accessory.addService(this.platform.Service.WindowCovering);

    this.service.setCharacteristic(this.platform.Characteristic.Name, this.shutter.name);

    // Set lamella disabled
    const settingDisabled = this.platform.config.disableLamella as string[];
    if(settingDisabled && settingDisabled.includes(this.shutter.mac)) {
      this.lamellaDisabled = true;
      this.platform.log.warn('Lamella disabled for ' + this.shutter.name);
    }

    // Set characteristics
    this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition)
      .onGet(this.getCurrentPosition.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.PositionState)
      .onGet(this.getPositionState.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetPosition)
      .onSet(this.setTargetPosition.bind(this))
      .onGet(this.getTargetPosition.bind(this));

    if(!this.lamellaDisabled) {
      this.service.getCharacteristic(this.platform.Characteristic.TargetHorizontalTiltAngle)
        .onSet(this.setTargetLamella.bind(this))
        .onGet(this.getTargetLamella.bind(this));

      this.service.getCharacteristic(this.platform.Characteristic.CurrentHorizontalTiltAngle)
        .onGet(this.getCurrentLamella.bind(this));
    }

    // Set initial state
    this.currentPosition = this.shutter.leftRight === 1 ? this.shutter.cello.shutterRight : this.shutter.cello.shutterLeft;
    this.targetPosition = this.currentPosition;
    this.positionState = 2;

    this.currentLamella = this.shutter.leftRight === 1 ? this.shutter.cello.lamellaRight : this.shutter.cello.lamellaLeft;
    this.targetLamella = this.currentLamella;

    // Subscribe to changes
    this.messageParser.celloEvent.subscribe((celloEvent) => {
      if (celloEvent.deviceType !== DeviceType.Shutter ||
        celloEvent.cello.mac !== this.shutter.mac || celloEvent.leftRight !== this.shutter.leftRight) {
        return;
      }

      if(celloEvent.event === 'ST') {
        const position = this.shutter.leftRight === 1 ? celloEvent.cello.shutterRight : celloEvent.cello.shutterLeft;
        this.targetPosition = position;
        this.currentPosition = position;
        this.positionState = 2;

        this.service.updateCharacteristic(this.platform.Characteristic.TargetPosition, Math.floor(this.targetPosition * 100));
        this.service.updateCharacteristic(this.platform.Characteristic.CurrentPosition, Math.floor(this.currentPosition * 100));
        this.service.updateCharacteristic(this.platform.Characteristic.PositionState, this.positionState);

        if(!this.lamellaDisabled) {
          const positionLamella = this.shutter.leftRight === 1 ? celloEvent.cello.lamellaRight : celloEvent.cello.lamellaLeft;
          this.targetLamella = positionLamella;
          this.currentLamella = positionLamella;

          this.service.updateCharacteristic(this.platform.Characteristic.CurrentHorizontalTiltAngle,
            Math.floor((this.currentLamella * 180) - 90));

          this.service.updateCharacteristic(this.platform.Characteristic.TargetHorizontalTiltAngle,
            Math.floor((this.targetLamella * 180) - 90));
        }
      } else if(celloEvent.event === 'HL') {
        this.currentPosition = this.shutter.leftRight === 1 ? celloEvent.cello.shutterRight : celloEvent.cello.shutterLeft;
        this.service.updateCharacteristic(this.platform.Characteristic.CurrentPosition, Math.floor(this.currentPosition * 100));

        if(!this.lamellaDisabled) {
          this.currentLamella = this.shutter.leftRight === 1 ? celloEvent.cello.lamellaRight : celloEvent.cello.lamellaLeft;
          this.service.updateCharacteristic(this.platform.Characteristic.CurrentHorizontalTiltAngle,
            Math.floor((this.currentLamella * 180) - 90));
        }
      } else if(celloEvent.event === 'UP') {
        this.positionState = 1;
        this.targetPosition = 1;

        this.service.updateCharacteristic(this.platform.Characteristic.TargetPosition, this.targetPosition * 100);
        this.service.updateCharacteristic(this.platform.Characteristic.PositionState, this.positionState);
      } else if(celloEvent.event === 'DN') {
        this.positionState = 0;
        this.targetPosition = 0;

        this.service.updateCharacteristic(this.platform.Characteristic.TargetPosition, this.targetPosition * 100);
        this.service.updateCharacteristic(this.platform.Characteristic.PositionState, this.positionState);
      }
    });
  }

  private getCurrentPosition(): number {
    return Math.floor(this.currentPosition * 100);
  }

  private getPositionState(): number {
    return this.positionState;
  }

  private getTargetPosition(): number {
    return Math.floor(this.targetPosition * 100);
  }

  private setTargetPosition(value: CharacteristicValue): void {
    this.targetPosition = value as number / 100;

    if(this.currentPosition < this.targetPosition) {
      this.positionState = 1;
    } else if(this.currentPosition > this.targetPosition) {
      this.positionState = 0;
    }

    this.messageGenerator.setShutter(this.shutter.cello, this.shutter.leftRight, this.targetPosition, -1);
  }

  private getTargetLamella(): number {
    return Math.floor((this.targetLamella * 180) - 90);
  }

  private setTargetLamella(value: CharacteristicValue): void {
    this.targetLamella = ((value as number) + 90) / 180;
    this.messageGenerator.setShutter(this.shutter.cello, this.shutter.leftRight, -1, this.targetLamella);
  }

  private getCurrentLamella(): number {
    return Math.floor((this.currentLamella * 180) - 90);
  }
}