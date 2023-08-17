/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
import {iBricksPlatform} from './iBricksPlatform';
import {CharacteristicValue, PlatformAccessory, Service} from 'homebridge';
import {MessageParser} from './services/MessageParser';
import {MessageGenerator} from './services/MessageGenerator';
import {DeviceType} from './models/DeviceType';
import {Shutter} from './devices/Shutter';
import {CharacteristicsHelper} from './CharacteristicsHelper';

export class iBricksShutterPlatformAccessory {

  private readonly service: Service;
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
    const position = this.shutter.leftRight === 1 ? this.shutter.cello.shutterRight : this.shutter.cello.shutterLeft;
    this.currentPosition = CharacteristicsHelper.windowCoveringPositionRound(position * 100);
    this.targetPosition = this.currentPosition;
    this.positionState = 2;

    const lamellaPosition = this.shutter.leftRight === 1 ? this.shutter.cello.lamellaRight : this.shutter.cello.lamellaLeft;
    this.currentLamella = CharacteristicsHelper.lamellaTiltAngleRound((lamellaPosition * 180) -90);
    this.targetLamella = this.currentLamella;

    // Subscribe to changes
    this.messageParser.celloEvent.subscribe((celloEvent) => {
      if (celloEvent.deviceType !== DeviceType.Shutter ||
        celloEvent.cello.mac !== this.shutter.mac || celloEvent.leftRight !== this.shutter.leftRight) {
        return;
      }

      if(celloEvent.event === 'ST') {
        const position = this.shutter.leftRight === 1 ? celloEvent.cello.shutterRight : celloEvent.cello.shutterLeft;
        this.targetPosition = CharacteristicsHelper.windowCoveringPositionRound(position * 100);
        this.currentPosition = CharacteristicsHelper.windowCoveringPositionRound(position * 100);
        this.positionState = 2;

        this.service.updateCharacteristic(this.platform.Characteristic.TargetPosition, this.targetPosition);
        this.service.updateCharacteristic(this.platform.Characteristic.CurrentPosition, this.currentPosition);
        this.service.updateCharacteristic(this.platform.Characteristic.PositionState, this.positionState);

        if(!this.lamellaDisabled) {
          const positionLamella = this.shutter.leftRight === 1 ? celloEvent.cello.lamellaRight : celloEvent.cello.lamellaLeft;
          this.targetLamella = CharacteristicsHelper.lamellaTiltAngleRound((positionLamella * 180) - 90);
          this.currentLamella = CharacteristicsHelper.lamellaTiltAngleRound((positionLamella * 180) - 90);

          this.service.updateCharacteristic(this.platform.Characteristic.CurrentHorizontalTiltAngle, this.currentLamella);
          this.service.updateCharacteristic(this.platform.Characteristic.TargetHorizontalTiltAngle, this.targetLamella);
        }
      } else if(celloEvent.event === 'HL') {
        const position = this.shutter.leftRight === 1 ? celloEvent.cello.shutterRight : celloEvent.cello.shutterLeft;
        this.currentPosition = CharacteristicsHelper.windowCoveringPositionRound(position * 100);

        this.service.updateCharacteristic(this.platform.Characteristic.CurrentPosition, this.currentPosition);

        if(!this.lamellaDisabled) {
          const positionLamella = this.shutter.leftRight === 1 ? celloEvent.cello.lamellaRight : celloEvent.cello.lamellaLeft;
          this.currentLamella = CharacteristicsHelper.lamellaTiltAngleRound((positionLamella * 180) - 90);
          this.targetLamella = this.currentLamella;

          this.service.updateCharacteristic(this.platform.Characteristic.CurrentHorizontalTiltAngle, this.currentLamella);
          this.service.updateCharacteristic(this.platform.Characteristic.TargetHorizontalTiltAngle, this.targetLamella);
        }
      } else if(celloEvent.event === 'UP') {
        this.targetPosition = 100;
        this.positionState = 1;

        this.service.updateCharacteristic(this.platform.Characteristic.TargetPosition, this.targetPosition);
        this.service.updateCharacteristic(this.platform.Characteristic.PositionState, this.positionState);
      } else if(celloEvent.event === 'DN') {
        this.positionState = 0;
        this.targetPosition = 0;

        this.service.updateCharacteristic(this.platform.Characteristic.TargetPosition, this.targetPosition);
        this.service.updateCharacteristic(this.platform.Characteristic.PositionState, this.positionState);
      }
    });
  }

  private getCurrentPosition(): number {
    return this.currentPosition;
  }

  private getPositionState(): number {
    return this.positionState;
  }

  private getTargetPosition(): number {
    return this.targetPosition;
  }

  private setTargetPosition(value: CharacteristicValue): void {
    this.targetPosition = value as number;

    if(this.currentPosition < this.targetPosition) {
      this.positionState = 1;
    } else if(this.currentPosition > this.targetPosition) {
      this.positionState = 0;
    }

    this.messageGenerator.setShutter(this.shutter.cello, this.shutter.leftRight, this.targetPosition / 100, -1);
  }

  private getTargetLamella(): number {
    return this.targetLamella;
  }

  private setTargetLamella(value: CharacteristicValue): void {
    this.targetLamella = value as number;
    this.messageGenerator.setShutter(this.shutter.cello, this.shutter.leftRight, -1, (this.targetLamella + 90) / 180);
  }

  private getCurrentLamella(): number {
    return this.currentLamella;
  }
}