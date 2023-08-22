import { IbricksPlatform } from './ibricks-platform';
import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { MessageParser } from './services/message-parser';
import { MessageGenerator } from './services/message-generator';
import { InternalPlatformAccessory } from './internal-platform-accessory';
import { CelloEvent } from './models/cello-event';
import { Shutter } from './devices/shutter';

export class IbricksShutterPlatformAccessory extends InternalPlatformAccessory {
    protected readonly service: Service;

    constructor(
        platform: IbricksPlatform,
        accessory: PlatformAccessory,
        messageParser: MessageParser,
        private readonly _messageGenerator: MessageGenerator,
        private readonly _shutter: Shutter,
    ) {
        super(accessory, platform, messageParser, `Cello Shutter ${_shutter.leftRight === 1 ? 'Right' : 'Left'}`, _shutter);

        this.service = accessory.getService(platform.Service.WindowCovering) || accessory.addService(platform.Service.WindowCovering);

        this.service.setCharacteristic(platform.Characteristic.Name, _shutter.name);

        this._disableLamellaIfNeeded();
        this.subscribeToCharacteristics();
        this.setInitialLocalValues();

        this.getCelloEvents().subscribe(celloEvent => {
            if (celloEvent.event === 'ST') {
                this._handleStEvent(celloEvent);
            } else if (celloEvent.event === 'HL') {
                this._handleHlEvent(celloEvent);
            } else if (celloEvent.event === 'UP') {
                this._handleUpEvent();
            } else if (celloEvent.event === 'DN') {
                this._handleDnEvent();
            }
        });
    }

    private _handleDnEvent(): void {
        this._shutter.positionState = 0;
        this._shutter.targetPosition = 0;

        this.updateCharacteristic(this.platform.Characteristic.TargetPosition, this._shutter.targetPosition);
        this.updateCharacteristic(this.platform.Characteristic.PositionState, this._shutter.positionState);
    }

    private _handleUpEvent(): void {
        this._shutter.targetPosition = 1;
        this._shutter.positionState = 1;

        this.updateCharacteristic(this.platform.Characteristic.TargetPosition, this._shutter.targetPosition);
        this.updateCharacteristic(this.platform.Characteristic.PositionState, this._shutter.positionState);
    }

    private _handleHlEvent(celloEvent: CelloEvent): void {
        this._shutter.currentPosition = this._shutter.leftRight === 1 ? celloEvent.cello.shutterRight : celloEvent.cello.shutterLeft;
        this.updateCharacteristic(this.platform.Characteristic.CurrentPosition, this._shutter.currentPosition);

        if (this._shutter.lamellaDisabled) {
            return;
        }

        const positionLamella = this.isRightDevice() ? celloEvent.cello.lamellaRight : celloEvent.cello.lamellaLeft;
        this._shutter.currentLamella = positionLamella;
        this._shutter.targetLamella = positionLamella;
        this.updateCharacteristic(this.platform.Characteristic.CurrentHorizontalTiltAngle, this._shutter.currentLamella);
        this.updateCharacteristic(this.platform.Characteristic.TargetHorizontalTiltAngle, this._shutter.targetLamella);
    }

    private _handleStEvent(celloEvent: CelloEvent): void {
        const position = this.isRightDevice() ? celloEvent.cello.shutterRight : celloEvent.cello.shutterLeft;
        this._shutter.targetPosition = position;
        this._shutter.currentPosition = position;
        this._shutter.positionState = 2;

        this.updateCharacteristic(this.platform.Characteristic.TargetPosition, this._shutter.targetPosition);
        this.updateCharacteristic(this.platform.Characteristic.CurrentPosition, this._shutter.currentPosition);
        this.updateCharacteristic(this.platform.Characteristic.PositionState, this._shutter.positionState);

        if (this._shutter.lamellaDisabled) {
            return;
        }

        const positionLamella = this.isRightDevice() ? celloEvent.cello.lamellaRight : celloEvent.cello.lamellaLeft;
        this._shutter.targetLamella = positionLamella;
        this._shutter.currentLamella = positionLamella;
        this.updateCharacteristic(this.platform.Characteristic.CurrentHorizontalTiltAngle, this._shutter.currentLamella);
        this.updateCharacteristic(this.platform.Characteristic.TargetHorizontalTiltAngle, this._shutter.targetLamella);
    }

    protected setInitialLocalValues(): void {
        const position = this.isRightDevice() ? this._shutter.cello.shutterRight : this._shutter.cello.shutterLeft;
        this._shutter.currentPosition = position;
        this._shutter.targetPosition = position;
        this._shutter.positionState = 2;

        const lamellaPosition = this.isRightDevice() ? this._shutter.cello.lamellaRight : this._shutter.cello.lamellaLeft;
        this._shutter.currentLamella = lamellaPosition;
        this._shutter.targetLamella = lamellaPosition;
    }

    protected subscribeToCharacteristics(): void {
        this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition).onGet(this._getCurrentPosition.bind(this));

        this.service.getCharacteristic(this.platform.Characteristic.PositionState).onGet(this._getPositionState.bind(this));

        this.service
            .getCharacteristic(this.platform.Characteristic.TargetPosition)
            .onSet(this._setTargetPosition.bind(this))
            .onGet(this._getTargetPosition.bind(this));

        if (this._shutter.lamellaDisabled) {
            return;
        }

        this.service
            .getCharacteristic(this.platform.Characteristic.TargetHorizontalTiltAngle)
            .onSet(this._setTargetLamella.bind(this))
            .onGet(this._getTargetLamella.bind(this));

        this.service.getCharacteristic(this.platform.Characteristic.CurrentHorizontalTiltAngle).onGet(this._getCurrentLamella.bind(this));
    }

    private _disableLamellaIfNeeded(): void {
        const settingDisabled = this.platform.config.disableLamella as string[];
        if (!(settingDisabled && settingDisabled.includes(this._shutter.mac))) {
            return;
        }

        this._shutter.lamellaDisabled = true;
        this.platform.log.warn('Lamella disabled for ' + this._shutter.name);
    }

    private _getCurrentPosition(): number {
        return this._shutter.currentPosition;
    }

    private _getPositionState(): number {
        return this._shutter.positionState;
    }

    private _getTargetPosition(): number {
        return this._shutter.targetPosition;
    }

    private _setTargetPosition(value: CharacteristicValue): void {
        this._shutter.targetPosition = this._shutter.convertPositionForCelloValue(value as number);

        if (this._shutter.currentPosition < this._shutter.targetPosition) {
            this._shutter.positionState = 1;
        } else if (this._shutter.currentPosition > this._shutter.targetPosition) {
            this._shutter.positionState = 0;
        }

        const closeLamella = !this._shutter.lamellaDisabled && this._shutter.targetPosition === 0;
        this._messageGenerator.setShutter(
            this._shutter.cello,
            this._shutter.leftRight,
            this._shutter.convertPositionForCelloValue(this._shutter.targetPosition),
            closeLamella ? this._shutter.convertLamellaForCelloValue(-90) : -1,
        );
    }

    private _getTargetLamella(): number {
        return this._shutter.targetLamella;
    }

    private _setTargetLamella(value: CharacteristicValue): void {
        this._shutter.targetLamella = this._shutter.convertLamellaForCelloValue(value as number);
        this._messageGenerator.setShutter(
            this._shutter.cello,
            this._shutter.leftRight,
            -1,
            this._shutter.convertLamellaForCelloValue(this._shutter.targetLamella),
        );
    }

    private _getCurrentLamella(): number {
        return this._shutter.currentLamella;
    }
}
