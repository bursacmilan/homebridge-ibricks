import {UdpMessageSender} from './UdpMessageSender';
import {LoggerService} from './LoggerService';
import {Cello} from '../models/Cello';
import {HardwareInfo} from '../models/HardwareInfo';
import {Subject} from 'rxjs';
import {CelloEvent} from '../models/CelloEvent';
import {DeviceType} from '../models/DeviceType';

//.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=453|E|YHELO|IP=192.168.3.250|DESC=Buero+%2D+T1
//.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=474|E|LRCHG|CH=1|ST=0
//.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=456|E|YINFO|T=TouchInfo|V=Fields=FIELDS
// eslint-disable-next-line max-len
//.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=460|E|YINFO|T=DebugInfo|V=Hardware=1R1S1H/1803;Firmware=2.2.44.PROD;StartupTime=08h20m;SSID=Bursac - Lakic,D0:21:F9:D5:C9:88;Mode=802.11n;RSSI=44%(-78);FreeHeap=13872;Temp=21.15;TempCalc=21.15;TempAdj=0.00;TempF=28.25;TempB=29.44;TempExt=n/a;Spiffs=600;Dip=00;Valve=0;ValveP=0.00;DirSoll=19.50;DirIst=21.15;Relais=1;Shutter=0.08%,100.00%
// eslint-disable-next-line max-len
//.KISS|AF=8CAAB5FAABBE|AT=0000000CLOUD|N=729|E|YINFO|T=DebugInfo|V=Hardware=DIM_GL/1915;Firmware=2.2.0.PROD;StartupTime=08h16m;SSID=Bursac - Lakic,D0:21:F9:D5:C9:88;RSSI=48%(-76);FreeHeap=16568;Temp=24.78;TempCalc=24.78;TempAdj=n/a;TempF=32.44;TempB=42.94;TempExt=n/a;Spiffs=210;Dip=00(255);DimValue=0.00
//.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=1974|Z|N=5057016|OK
//.KISS|AF=989096BE40C7|AT=000000000000|N=1149760|C|YHELO|IP=192.168.3.84|MASTER=1|X=C2BD

//.KISS|AF=D8BFC0C3C37F|AT=0000000CLOUD|N=6025|E|LRCHG|CH=1|ST=1
//.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=3108|E|ASCHG|CH=1|CMD=HL|H=0.826|L=0.000
export class MessageParser {

  private udpMessageSender: UdpMessageSender;
  private loggerService: LoggerService;
  public celloChangedEvent: Subject<Cello> = new Subject<Cello>();
  public celloEvent: Subject<CelloEvent> = new Subject<CelloEvent>();

  constructor(udpMessageSender: UdpMessageSender, loggerService: LoggerService) {
    this.udpMessageSender = udpMessageSender;
    this.loggerService = loggerService;
  }

  public parse(data: string) {
    this.loggerService.logDebug(Object.getPrototypeOf(this).parse.name, `Parsing message: ${data}`);
    const splittedData = data.split('|').map(d => this.getCleanedData(d));

    if (data.indexOf('YHELO') !== -1) {
      this.parseYHELO(splittedData);
    } else if (data.indexOf('YINFO') !== -1 && data.indexOf('V=Hardware') !== -1) {
      this.parseYINFO_DebugInfo(splittedData);
    } else if (data.indexOf('|Z|') !== -1 && (data.match('/|N|/g') || []).length === 2) {
      //this.parseACTION_RESPONSE(splittedData);
    } else if (data.indexOf('|E|LRCHG|') !== -1 || data.indexOf('|E|LDCHG|') !== -1) {
      this.parseRELAY_CHANGE(splittedData);
    } else if (data.indexOf('|E|ASCHG|') !== -1) {
      this.parseSHUTTER_CHANGE(splittedData);
    } else if(data.indexOf('|E|SICHG|') !== -1 || data.indexOf('|E|BDCHG|') !== -1) {
      this.parseDIRECTOR_CHANGE(splittedData);
    }
  }

  //.KISS|AF=F4CFA2DB6626|AT=0000000CLOUD|N=698|E|SICHG|T=TEMP|CH=1|U=CEL|V=21.51 (CURRENT)
  //.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=7|E|BDCHG|CH=1|U=CEL|V=18.00 (TARGET)
  private parseDIRECTOR_CHANGE(data: string[]): void {
    let af = '';
    let ch = 0;
    let current: number | undefined = undefined;
    let target: number | undefined = undefined;

    for (const messagePart of data) {
      const splittedMessagePart = messagePart.split('=');
      switch (splittedMessagePart[0]) {
        case 'AF':
          af = splittedMessagePart[1];
          break;
        case 'V':
          if (data.filter(d => d.indexOf('SICHG') !== -1).length > 0) {
            current = +splittedMessagePart[1];
          } else {
            target = +splittedMessagePart[1];
          }
          break;
        case 'CH':
          ch = +splittedMessagePart[1];
          break;
      }
    }

    const cello = Cello.GetCelloFromFile(Cello.GetFilePath(af));
    if (cello === undefined) {
      this.loggerService.logWarning(Object.getPrototypeOf(this).parseDIRECTOR_CHANGE.name, `Cello with AF: ${af} not found`);
      return;
    }

    this.loggerService.logWarning(Object.getPrototypeOf(this).parseDIRECTOR_CHANGE.name,
      `AF: ${af} CH: ${ch} current: ${current} target: ${target}`);

    if (ch === 1) {
      cello.currentTemperatureRight = current !== undefined ? current : cello.currentTemperatureRight;
      cello.targetTemperatureRight = target !== undefined ? target : cello.targetTemperatureRight;
    } else if (ch === 2) {
      cello.currentTemperatureLeft = current !== undefined ? current : cello.currentTemperatureLeft;
      cello.targetTemperatureLeft = target !== undefined ? target : cello.targetTemperatureLeft;
    }

    cello.SaveToFile();
    this.celloEvent.next(new CelloEvent(cello, '', DeviceType.Director, ch));
  }

  //.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=3108|E|ASCHG|CH=1|CMD=HL|H=0.826|L=0.000
  private parseSHUTTER_CHANGE(data: string[]): void {
    let af = '';
    let ch = 0;
    let h = 0;
    let l = 0;
    let cmd = '';

    for (const messagePart of data) {
      const splittedMessagePart = messagePart.split('=');
      switch (splittedMessagePart[0]) {
        case 'AF':
          af = splittedMessagePart[1];
          break;
        case 'H':
          h = +splittedMessagePart[1];
          break;
        case 'L':
          l = +splittedMessagePart[1];
          break;
        case 'CH':
          ch = +splittedMessagePart[1];
          break;
        case 'CMD':
          cmd = splittedMessagePart[1];
          break;
      }
    }

    const cello = Cello.GetCelloFromFile(Cello.GetFilePath(af));
    if (cello === undefined) {
      this.loggerService.logWarning(Object.getPrototypeOf(this).parseSHUTTER_CHANGE.name, `Cello with AF: ${af} not found`);
      return;
    }

    this.loggerService.logWarning(Object.getPrototypeOf(this).parseSHUTTER_CHANGE.name,
      `AF: ${af} H: ${h} CH: ${ch} CMD: ${cmd}`);

    if (cmd === 'UP' || cmd === 'DN') {
      this.celloEvent.next(new CelloEvent(cello, cmd, DeviceType.Shutter, ch));
      return;
    }

    if (cmd !== 'HL' && cmd !== 'ST') {
      this.loggerService.logWarning(Object.getPrototypeOf(this).parseSHUTTER_CHANGE.name, `Unknown command: ${cmd}`);
      return;
    }

    if (ch === 1) {
      cello.shutterRight = h;
      cello.lamellaRight = l;
    } else if (ch === 2) {
      cello.shutterLeft = h;
      cello.lamellaLeft = l;
    }

    cello.SaveToFile();
    this.celloEvent.next(new CelloEvent(cello, cmd, DeviceType.Shutter, ch));
  }

  //.KISS|AF=8CAAB5FAABBE|AT=0000000CLOUD|N=727|E|LDCHG|CH=1|V=0.000
  private parseRELAY_CHANGE(data: string[]): void {
    let af = '';
    let st = '';
    let ch: string | undefined = undefined;
    let v: number | undefined = undefined;

    for (const messagePart of data) {
      const splittedMessagePart = messagePart.split('=');
      switch (splittedMessagePart[0]) {
        case 'AF':
          af = splittedMessagePart[1];
          break;
        case 'ST':
          st = splittedMessagePart[1];
          break;
        case 'V':
          v = +splittedMessagePart[1];
          break;
        case 'CH':
          ch = splittedMessagePart[1];
          break;
      }
    }

    const cello = Cello.GetCelloFromFile(Cello.GetFilePath(af));
    if (cello === undefined) {
      this.loggerService.logWarning(Object.getPrototypeOf(this).parseYINFO_DebugInfo.name, `Cello with AF: ${af} not found`);
      return;
    }

    this.loggerService.logWarning('RELAY', `AF: ${af} ST: ${st} CH: ${ch} V: ${v}`);
    if (ch === '1') {
      cello.relayRight = st === '1';
      cello.dimmerRight = v !== undefined ? v : cello.dimmerRight;
    } else if (ch === '2') {
      cello.relayLeft = st === '1';
      cello.dimmerLeft = v !== undefined ? v : cello.dimmerLeft;
    }

    cello.SaveToFile();
    this.celloChangedEvent.next(cello);
  }

  // Command response
  /*
  private parseACTION_RESPONSE(data: string[]): void {
    this.loggerService.logDebug(Object.getPrototypeOf(this).parseACTION_RESPONSE.name, 'Parsing ACTION_RESPONSE');

    const nounce = data.filter(d => d.startsWith('N='))[1];
    const nounceSplitted = nounce.split('=');

    this.loggerService.logDebug(Object.getPrototypeOf(this).parseACTION_RESPONSE.name, `Nounce: ${nounceSplitted[1]}`);
    this.udpMessageSender.removeRequestByNounce(+nounceSplitted[1]);
  }*/

  // Response from IAMMASTER (Registering device)
  private parseYHELO(data: string[]): void {
    this.loggerService.logDebug(Object.getPrototypeOf(this).parseYHELO.name, 'Parsing YHELO');

    let af = '';
    let ip = '';
    let desc = '';

    for (const messagePart of data) {
      const splittedMessagePart = messagePart.split('=');
      switch (splittedMessagePart[0]) {
        case 'AF':
          af = splittedMessagePart[1];
          break;
        case 'IP':
          ip = splittedMessagePart[1];
          break;
        case 'DESC':
          desc = this.urlDecode(splittedMessagePart[1]);
          break;
      }
    }

    this.loggerService.logDebug(Object.getPrototypeOf(this).parseYHELO.name, `AF: ${af}, IP: ${ip}, DESC: ${desc}`);
    Cello.CreateCelloAndSafeOnFileSystem(desc, ip, af);
  }

  // Hardwareinfo from a device
  private parseYINFO_DebugInfo(data) {
    this.loggerService.logDebug(Object.getPrototypeOf(this).parseYINFO_DebugInfo.name, 'Parsing YINFO_DebugInfo');

    let af = '';
    let v = '';

    for (const messagePart of data) {
      const splittedMessagePart = messagePart.split('=');
      switch (splittedMessagePart[0]) {
        case 'AF':
          af = splittedMessagePart[1];
          break;
        case 'V':
          v = splittedMessagePart[2].split('/')[0];
      }
    }

    this.loggerService.logDebug(Object.getPrototypeOf(this).parseYINFO_DebugInfo.name, `AF: ${af}, V: ${v}`);
    const cello = Cello.GetCelloFromFile(Cello.GetFilePath(af));
    if (cello === undefined) {
      this.loggerService.logWarning(Object.getPrototypeOf(this).parseYINFO_DebugInfo.name, `Cello with AF: ${af} not found`);
      return;
    }

    this.loggerService.logDebug(Object.getPrototypeOf(this).parseYINFO_DebugInfo.name, `Cello found: ${cello.description}`);

    cello.hardwareInfo = this.parseAndGetHardwareInfo(v);
    this.loggerService.logDebug(Object.getPrototypeOf(this).parseYINFO_DebugInfo.name,
      `Cello hardwareInfo: ${JSON.stringify(cello.hardwareInfo)}`);

    cello.SaveToFile();
  }

  private parseAndGetHardwareInfo(info: string): HardwareInfo {
    if (info.startsWith('S36TX')) {
      this.loggerService.logDebug(Object.getPrototypeOf(this).parseAndGetHardwareInfo.name, 'S36TX found');
      return new HardwareInfo(1, 0, 1, 0);
    } else if(info.startsWith('DIM_GL')) {
      this.loggerService.logDebug(Object.getPrototypeOf(this).parseAndGetHardwareInfo.name, 'DIM_GL found');
      return new HardwareInfo(1, 0, 0, 1);
    }

    const characters = info.split('');

    let r = 0, s = 0, h = 0;
    for (let i = 1; i < characters.length; i++) {
      if (characters[i] === 'R') {
        r = +characters[i - 1];
      } else if (characters[i] === 'S') {
        s = +characters[i - 1];
      } else if (characters[i] === 'H') {
        h = +characters[i - 1];
      }
    }

    return new HardwareInfo(r, s, h, 0);
  }

  private getCleanedData(data: string): string {
    return data.replace(/\r/g, '');
  }

  private urlDecode(data: string): string {
    return decodeURIComponent(data).replace(/\+/g, ' ');
  }
}