import {Cello} from '../models/Cello';
import {Relay} from '../models/Relay';

export class DevicesService {

  private readonly cellos: Cello[];

  constructor(cellos: Cello[]) {
    this.cellos = cellos;
  }

  public getAllRelays(): Relay[] {
    const relays: Relay[] = [];
    for(const cello of this.cellos) {
      if(cello.hardwareInfo === undefined) {
        continue;
      }

      if(cello.hardwareInfo.R === 2) {
        relays.push(new Relay(cello.mac, `${cello.description} - Right`, 1));
        relays.push(new Relay(cello.mac, `${cello.description} - Left`, 2));
      } else if(cello.hardwareInfo.R === 1) {
        relays.push(new Relay(cello.mac, `${cello.description}`, 1));
      }
    }

    return relays;
  }
}