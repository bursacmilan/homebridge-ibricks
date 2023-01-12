import {UdpMessageSender} from './UdpMessageSender';
import {LoggerService} from './LoggerService';
import {Cello} from '../models/Cello';
import {HardwareInfo} from '../models/HardwareInfo';

//.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=453|E|YHELO|IP=192.168.3.250|DESC=Buero+%2D+T1
//.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=474|E|LRCHG|CH=1|ST=0
//.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=456|E|YINFO|T=TouchInfo|V=Fields=FIELDS
// eslint-disable-next-line max-len
//.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=460|E|YINFO|T=DebugInfo|V=Hardware=1R1S1H/1803;Firmware=2.2.44.PROD;StartupTime=08h20m;SSID=Bursac - Lakic,D0:21:F9:D5:C9:88;Mode=802.11n;RSSI=44%(-78);FreeHeap=13872;Temp=21.15;TempCalc=21.15;TempAdj=0.00;TempF=28.25;TempB=29.44;TempExt=n/a;Spiffs=600;Dip=00;Valve=0;ValveP=0.00;DirSoll=19.50;DirIst=21.15;Relais=1;Shutter=0.08%,100.00%
//.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=1974|Z|N=5057016|OK
//.KISS|AF=989096BE40C7|AT=000000000000|N=1149760|C|YHELO|IP=192.168.3.84|MASTER=1|X=C2BD

export class MessageParser {

  private udpMessageSender: UdpMessageSender;
  private loggerService: LoggerService;

  constructor(udpMessageSender: UdpMessageSender, loggerService: LoggerService) {
    this.udpMessageSender = udpMessageSender;
    this.loggerService = loggerService;
  }

  public parse(data: string){
    this.loggerService.logDebug('Parsing data: ' + data);
    const splittedData = data.split('|');

    if(data.indexOf('YHELO') !== -1) {
      this.parseYHELO(splittedData);
    } else if(data.indexOf('YINFO') !== -1 && data.indexOf('V=Hardware') !== -1) {
      this.parseYINFO_DebugInfo(splittedData);
    } else if(data.indexOf('|Z|') !== -1 && (data.match('/|N|/g') || []).length === 2) {
      this.parseACTION_RESPONSE(splittedData);
    }
  }

  // Command response
  private parseACTION_RESPONSE(data: string[]): void {
    this.loggerService.logDebug('Parsing ACTION_RESPONSE');

    const nounce = data.filter(d => d.startsWith('N='))[1];
    const nounceSplitted = nounce.split('=');

    this.loggerService.logDebug('ACTION_RESPONSE Nounce: ' + nounceSplitted[1]);
    this.udpMessageSender.removeRequestByNounce(+nounceSplitted[1]);
  }

  // Response from IAMMASTER (Registering device)
  private parseYHELO(data: string[]): void {
    this.loggerService.logDebug('Parsing YHELO');

    let af = '';
    let ip = '';
    let desc = '';

    for(const messagePart of data) {
      const splittedMessagePart = messagePart.split('=');
      switch (splittedMessagePart[0]) {
        case 'AF':
          af = splittedMessagePart[1];
          break;
        case 'IP':
          ip = splittedMessagePart[1];
          break;
        case 'DESC':
          desc = decodeURIComponent(splittedMessagePart[1]).replace('+', ' ').replace('\r', '');
          break;
      }
    }

    this.loggerService.logDebug('YHELO AF: ' + af + ' IP: ' + ip + ' DESC: ' + desc);
    Cello.CreateCelloAndSafeOnFileSystem(desc, ip, af);
  }

  // Hardwareinfo from a device
  private parseYINFO_DebugInfo(data) {
    this.loggerService.logDebug('Parsing YINFO_DebugInfo');

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

    this.loggerService.logDebug('YINFO_DebugInfo AF: ' + af + ' V: ' + v);
    const cello = Cello.GetCelloFromFile(Cello.GetFilePath(af));
    if(cello === undefined) {
      this.loggerService.logWarning('YINFO_DebugInfo Cello with AF: ' + af + ' not found');
      return;
    }

    this.loggerService.logDebug('YINFO_DebugInfo Cello found: ' + cello.description);

    cello.hardwareInfo = this.parseAndGetHardwareInfo(v);
    this.loggerService.logDebug('YINFO_DebugInfo Cello hardwareInfo: ' + JSON.stringify(cello.hardwareInfo));

    cello.SaveToFile();
  }

  private parseAndGetHardwareInfo(info: string): HardwareInfo {
    if(info.startsWith('S36TX')) {
      return new HardwareInfo(1, 0, 1);
    }

    const characters = info.split('');

    let r = 0, s = 0, h = 0;
    for (let i = 1; i < characters.length; i++) {
      if (characters[i] === 'R') {
        r = +characters[i-1];
      } else if (characters[i] === 'S') {
        s = +characters[i-1];
      } else if (characters[i] === 'H') {
        h = +characters[i-1];
      }
    }

    return new HardwareInfo(r, s, h);
  }
}