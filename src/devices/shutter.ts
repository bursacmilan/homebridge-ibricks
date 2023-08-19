import {Device} from './device';
import {Cello} from '../models/cello';
import {CharacteristicsHelper} from '../characteristics-helper';
import {DeviceType} from '../models/device-type';

export class Shutter extends Device {

  private _currentPosition = 0;
  private _targetPosition = 0;
  private _targetLamella = 0;
  private _currentLamella = 0;

  public positionState = 2;
  public lamellaDisabled = false;

  public get currentLamella(): number {
    return this._currentLamella;
  }

  public set currentLamella(value: number) {
    this._currentLamella = CharacteristicsHelper.lamellaTiltAngleRound((value * 180) - 90);
  }

  public get targetLamella(): number {
    return this._targetLamella;
  }

  public set targetLamella(value: number) {
    this._targetLamella = CharacteristicsHelper.lamellaTiltAngleRound((value * 180) - 90);
  }

  public get currentPosition(): number {
    return this._currentPosition;
  }

  public set currentPosition(value: number) {
    this._currentPosition = CharacteristicsHelper.windowCoveringPositionRound(value * 100);
  }

  public get targetPosition(): number {
    return this._targetPosition;
  }

  public set targetPosition(value: number) {
    this._targetPosition = CharacteristicsHelper.windowCoveringPositionRound(value * 100);
  }

  public convertPositionForCelloValue(x: number): number {
    return x / 100;
  }

  public convertLamellaForCelloValue(x: number): number {
    return (x + 90) / 180;
  }

  constructor(id: string, mac: string, name: string, leftRight: number, cello: Cello) {
    super(id, mac, name, leftRight, cello, DeviceType.Shutter);
    this.leftRight = leftRight;
  }
}