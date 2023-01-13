import {Cello} from '../models/Cello';
import {Relay} from '../models/Relay';
import {LoggerService} from './LoggerService';

export class DevicesService {

  private readonly cellos: Cello[];
  private loggerService: LoggerService;

  constructor(cellos: Cello[], loggerService: LoggerService) {
    this.cellos = cellos;
    this.loggerService = loggerService;
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
        relays.push(new Relay(this.getRelayId(cello, 1), cello.mac, `${cello.description} - Right`, 1));
        relays.push(new Relay(this.getRelayId(cello, 2), cello.mac, `${cello.description} - Left`, 2));
      } else if(cello.hardwareInfo.R === 1) {
        this.loggerService.logDebug(Object.getPrototypeOf(this).getAllRelays.name, `Cello ${cello.description} has 1 relays`);
        relays.push(new Relay(this.getRelayId(cello, 1), cello.mac, `${cello.description}`, 1));
      }
    }

    return relays;
  }

  private getRelayId(cello: Cello, leftRight: number): string {
    return `RELAY-${cello.mac}-${leftRight}`;
  }
}