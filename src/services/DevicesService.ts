import {Cello} from '../models/Cello';
import {Relay} from '../models/Relay';
import {LoggerService} from './LoggerService';
import {Shutter} from '../models/Shutter';
import {Director} from '../models/Director';
import {PlatformConfig} from 'homebridge';

export class DevicesService {

  private readonly cellos: Cello[];
  private loggerService: LoggerService;

  private ignoredDevices: { mac: string; channel: number; deviceType: string }[] = [];

  constructor(cellos: Cello[], loggerService: LoggerService, config: PlatformConfig) {
    this.cellos = cellos;
    this.loggerService = loggerService;

    if (!config.ignoreDevices) {
      return;
    }

    for (const ignoredDevice of config.ignoreDevices) {
      const mac = ignoredDevice.macAddress;
      for(const childDevice of ignoredDevice.childDevices) {
        const channel = childDevice.channel as number;
        const deviceType = childDevice.deviceType as string;

        this.ignoredDevices.push({mac, channel, deviceType});
      }
    }

    loggerService.logDebug('DevicesService', `Ignored devices: ${JSON.stringify(this.ignoredDevices)}`);
  }

  public getAllMeteos(): Director[] {
    const directors = this.getAllDirectors(false);
    for (const director of directors) {
      director.id = director.id.replace('DIRECTOR', 'METEO');
    }

    return directors.filter(d => !this.isDisabled(d.mac, d.leftRight, 'meteo'));
  }

  public getAllDirectors(filterDisabled: boolean): Director[] {
    this.loggerService.logDebug(Object.getPrototypeOf(this).getAllDirectors.name,
      `Getting all directors from total of ${this.cellos.length} cellos`);

    const directors: Director[] = [];
    for(const cello of this.cellos) {
      if(cello.hardwareInfo === undefined) {
        this.loggerService.logWarning(Object.getPrototypeOf(this).getAllDirectors.name,
          `Cello ${cello.mac} has no hardware info`);

        continue;
      }

      if(cello.hardwareInfo.H === 2) {
        this.loggerService.logDebug(Object.getPrototypeOf(this).getAllDirectors.name, `Cello ${cello.description} has 2 directors`);
        directors.push(new Director(this.getDirectorId(cello, 1), cello.mac, `${cello.description} - Right`, 1, cello));
        directors.push(new Director(this.getDirectorId(cello, 2), cello.mac, `${cello.description} - Left`, 2, cello));
      } else if(cello.hardwareInfo.H === 1) {
        this.loggerService.logDebug(Object.getPrototypeOf(this).getAllDirectors.name, `Cello ${cello.description} has 1 director`);
        directors.push(new Director(this.getDirectorId(cello, 1), cello.mac, `${cello.description}`, 1, cello));
      }
    }

    if(!filterDisabled) {
      return directors;
    }
    return directors.filter(d => !this.isDisabled(d.mac, d.leftRight, 'director'));
  }

  public getAllShutters(): Shutter[] {
    this.loggerService.logDebug(Object.getPrototypeOf(this).getAllShutters.name,
      `Getting all shutters from total of ${this.cellos.length} cellos`);

    const shutters: Shutter[] = [];
    for(const cello of this.cellos) {
      if(cello.hardwareInfo === undefined) {
        this.loggerService.logWarning(Object.getPrototypeOf(this).getAllShutters.name,
          `Cello ${cello.mac} has no hardware info`);

        continue;
      }

      if(cello.hardwareInfo.S === 2) {
        this.loggerService.logDebug(Object.getPrototypeOf(this).getAllShutters.name, `Cello ${cello.description} has 2 shutters`);
        shutters.push(new Shutter(this.getShutterId(cello, 1), cello.mac, `${cello.description} - Right`, 1, cello));
        shutters.push(new Shutter(this.getShutterId(cello, 2), cello.mac, `${cello.description} - Left`, 2, cello));
      } else if(cello.hardwareInfo.S === 1) {
        this.loggerService.logDebug(Object.getPrototypeOf(this).getAllShutters.name, `Cello ${cello.description} has 1 shutter`);
        shutters.push(new Shutter(this.getShutterId(cello, 1), cello.mac, `${cello.description}`, 1, cello));
      }
    }

    return shutters.filter(d => !this.isDisabled(d.mac, d.leftRight, 'shutter'));
  }

  public getAllRelays(): Relay[] {
    this.loggerService.logDebug(Object.getPrototypeOf(this).getAllRelays.name,
      `Getting all relays from total of ${this.cellos.length} cellos`);

    const relays: Relay[] = [];
    for(const cello of this.cellos) {
      if(cello.hardwareInfo === undefined) {
        this.loggerService.logWarning(Object.getPrototypeOf(this).getAllRelays.name,
          `Cello ${cello.mac} has no hardware info`);

        continue;
      }

      if(cello.hardwareInfo.R === 2) {
        this.loggerService.logDebug(Object.getPrototypeOf(this).getAllRelays.name, `Cello ${cello.description} has 2 relays`);
        relays.push(new Relay(this.getRelayId(cello, 1), cello.mac, `${cello.description} - Right`, 1, cello));
        relays.push(new Relay(this.getRelayId(cello, 2), cello.mac, `${cello.description} - Left`, 2, cello));
      } else if(cello.hardwareInfo.R === 1) {
        this.loggerService.logDebug(Object.getPrototypeOf(this).getAllRelays.name, `Cello ${cello.description} has 1 relays`);
        relays.push(new Relay(this.getRelayId(cello, 1), cello.mac, `${cello.description}`, 1, cello));
      }
    }

    return relays.filter(d => !this.isDisabled(d.mac, d.leftRight, 'relay'));
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