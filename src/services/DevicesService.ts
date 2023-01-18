import {Cello} from '../models/Cello';
import {LoggerService} from './LoggerService';
import {PlatformConfig} from 'homebridge';
import {Director} from '../devices/Director';
import {Shutter} from '../devices/Shutter';
import {Relay} from '../devices/Relay';
import {DeviceType} from '../models/DeviceType';

export class DevicesService {

  private readonly cellos: Cello[];
  private readonly loggerService: LoggerService;
  private readonly ignoredDevices: { mac: string; channel: number; deviceType: string }[] = [];

  constructor(cellos: Cello[], loggerService: LoggerService, config: PlatformConfig) {
    this.cellos = cellos;
    this.loggerService = loggerService;
    this.initIgnoredDevices(config, loggerService);
  }

  public getAllMeteos(): Director[] {
    this.loggerService.logDebug(Object.getPrototypeOf(this).getAllMeteos.name,
      `Getting all meteos from total of ${this.cellos.length} cellos`);

    const directors = this.getAllDirectors(false);
    for (const director of directors) {
      director.id = director.id.replace('DIRECTOR', 'METEO');
    }

    return directors.filter(d => !this.isDisabled(d.mac, d.leftRight, 'meteo'));
  }

  public getAllDirectors(filterDisabled: boolean): Director[] {
    this.loggerService.logDebug(Object.getPrototypeOf(this).getAllShutters.name,
      `Getting all directors from total of ${this.cellos.length} cellos`);

    const directors = this.getAllOfT<Director>((cello, leftRight) =>
      new Shutter(this.getDirectorId(cello, leftRight), cello.mac,
        `${cello.description} - ${leftRight === 1 ? 'Right' : 'Left'}`,
        leftRight, cello), DeviceType.Director, 'H');

    if (!filterDisabled) {
      return directors;
    }

    return directors.filter(d => !this.isDisabled(d.mac, d.leftRight, 'director'));
  }

  public getAllShutters(): Shutter[] {
    this.loggerService.logDebug(Object.getPrototypeOf(this).getAllShutters.name,
      `Getting all shutters from total of ${this.cellos.length} cellos`);

    const shutters = this.getAllOfT<Shutter>((cello, leftRight) =>
      new Shutter(this.getShutterId(cello, leftRight), cello.mac,
        `${cello.description} - ${leftRight === 1 ? 'Right' : 'Left'}`,
        leftRight, cello), DeviceType.Shutter, 'S');

    return shutters.filter(d => !this.isDisabled(d.mac, d.leftRight, 'shutter'));
  }

  public getAllRelays(): Relay[] {
    this.loggerService.logDebug(Object.getPrototypeOf(this).getAllRelays.name,
      `Getting all relays from total of ${this.cellos.length} cellos`);

    const relays = this.getAllOfT<Relay>((cello, leftRight) =>
      new Relay(this.getRelayId(cello, leftRight), cello.mac,
        `${cello.description} - ${leftRight === 1 ? 'Right' : 'Left'}`,
        leftRight, cello), DeviceType.Relay, 'R');

    return relays.filter(d => !this.isDisabled(d.mac, d.leftRight, 'relay'));
  }

  private initIgnoredDevices(config: PlatformConfig, loggerService: LoggerService) {
    if (!config.ignoreDevices) {
      return;
    }

    for (const ignoredDevice of config.ignoreDevices) {
      const mac = ignoredDevice.macAddress;
      for (const childDevice of ignoredDevice.childDevices) {
        const channel = childDevice.channel as number;
        const deviceType = childDevice.deviceType as string;

        this.ignoredDevices.push({mac, channel, deviceType});
      }
    }

    loggerService.logDebug('DevicesService', `Ignored devices: ${JSON.stringify(this.ignoredDevices)}`);
  }

  private getAllOfT<T>(factory: (cello: Cello, leftRight: number) => T, deviceType: DeviceType, hardwareInfoProperty: string): T[] {
    this.loggerService.logDebug(Object.getPrototypeOf(this).getAllOfT.name,
      `Getting all ${deviceType} from total of ${this.cellos.length} cellos`);

    const devices: T[] = [];
    for (const cello of this.cellos) {
      if (cello.hardwareInfo === undefined) {
        this.loggerService.logWarning(Object.getPrototypeOf(this).getAllOfT.name,
          `Cello ${cello.mac} has no hardware info`);

        continue;
      }

      if (cello.hardwareInfo[hardwareInfoProperty] as number === 2) {
        this.loggerService.logDebug(Object.getPrototypeOf(this).getAllOfT.name, `Cello ${cello.description} has 2 ${deviceType}s`);
        devices.push(factory(cello, 1));
        devices.push(factory(cello, 2));
      } else if (cello.hardwareInfo[hardwareInfoProperty] as number === 1) {
        this.loggerService.logDebug(Object.getPrototypeOf(this).getAllOfT.name, `Cello ${cello.description} has 1 ${deviceType}`);
        devices.push(factory(cello, 1));
      } else {
        this.loggerService.logDebug(Object.getPrototypeOf(this).getAllOfT.name, `Cello ${cello.description} has no ${deviceType}`);
      }
    }

    return devices;
  }

  private getRelayId(cello: Cello, leftRight: number): string {
    return `RELAY-${cello.mac}-${leftRight}`;
  }

  private getDirectorId(cello: Cello, leftRight: number): string {
    return `DIRECTOR-${cello.mac}-${leftRight}`;
  }

  private getShutterId(cello: Cello, leftRight: number): string {
    return `SHUTTER-${cello.mac}-${leftRight}`;
  }

  private isDisabled(mac: string, channel: number, type: string): boolean {
    return this.ignoredDevices.filter((i) => i.mac === mac && i.channel === channel && i.deviceType === type).length > 0;
  }
}