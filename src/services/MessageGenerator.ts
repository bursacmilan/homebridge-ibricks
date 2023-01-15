import {UdpMessageSender} from './UdpMessageSender';
import {LoggerService} from './LoggerService';
import {Cello} from '../models/Cello';
import {NetworkInfo} from '../models/NetworkInfo';
import {Request} from '../models/Request';

export class MessageGenerator {

  private readonly udpMessageSender: UdpMessageSender;
  private readonly loggerService: LoggerService;
  private readonly networkInfo: NetworkInfo;

  constructor(udpMessageSender: UdpMessageSender, loggerService: LoggerService, networkInfo: NetworkInfo) {
    this.udpMessageSender = udpMessageSender;
    this.networkInfo = networkInfo;
    this.loggerService = loggerService;
  }

  //.KISS|AF=989096BE40C7|AT=000000000000|N=1149760|C|YHELO|IP=192.168.3.84|MASTER=1
  public sendIamMasterBroadcast() {
    this.loggerService.logDebug(Object.getPrototypeOf(this).sendIamMasterBroadcast.name,
      'Sending I am master broadcast');

    const nounce = MessageGenerator.getRandomNounce();

    // eslint-disable-next-line max-len
    const message = `.KISS|AF=${this.networkInfo.macAddress}|AT=000000000000|N=${nounce}|C|YHELO|IP=${this.networkInfo.ipAddress}|MASTER=1|X=${MessageGenerator.getX()}`;
    this.udpMessageSender.sendBroadcast(message, this.networkInfo);
  }

  // .KISS|AF=989096BE40C7|AT=8CAAB5FAABBE|N=3677560|C|LDSET|CH=1|V=0
  public setDimmer(cello: Cello, leftRight: number, state: number) {
    this.loggerService.logDebug(Object.getPrototypeOf(this).setDimmer.name,
      `Setting dimmer ${leftRight} to ${state} on ${cello.description}`);

    const nounce = MessageGenerator.getRandomNounce();

    // eslint-disable-next-line max-len
    const message = `.KISS|AF=${this.networkInfo.macAddress}|AT=${cello.mac}|N=${nounce}|C|LDSET|CH=${leftRight}|V=${state}|X=${MessageGenerator.getX()}`;

    const request = new Request(message, nounce, cello, this.networkInfo);
    this.udpMessageSender.sendMessage(request);
  }

  // .KISS|AF=989096BE40C7|AT=8CAAB5FAABBE|N=3677560|C|LRSET|CH=1|ST=1
  public setRelay(cello: Cello, leftRight: number, state: boolean) {
    this.loggerService.logDebug(Object.getPrototypeOf(this).setRelay.name,
      `Setting relay ${leftRight} to ${state} on ${cello.description}`);

    const nounce = MessageGenerator.getRandomNounce();
    const valueToSet = state ? 1 : 0;

    // eslint-disable-next-line max-len
    const message = `.KISS|AF=${this.networkInfo.macAddress}|AT=${cello.mac}|N=${nounce}|C|LRSET|CH=${leftRight}|ST=${valueToSet}|X=${MessageGenerator.getX()}`;

    const request = new Request(message, nounce, cello, this.networkInfo);
    this.udpMessageSender.sendMessage(request);
  }

  //.KISS|AF=989096BE40C7|AT=8CAAB5FA31EC|N=6206168|C|YSCFG|CFG=Reboot|V=0
  public rebootCello(cello: Cello): void {
    this.loggerService.logDebug(Object.getPrototypeOf(this).rebootCello.name,
      `Rebooting cello ${cello.description}`);

    const nounce = MessageGenerator.getRandomNounce();

    // eslint-disable-next-line max-len
    const message = `.KISS|AF=${this.networkInfo.macAddress}|AT=${cello.mac}|N=${nounce}|C|YSCFG|CFG=Reboot|V=0|X=${MessageGenerator.getX()}`;

    const request = new Request(message, nounce, cello, this.networkInfo);
    this.udpMessageSender.sendMessage(request);
  }

  // .KISS|AF=989096BE40C7|AT=8CAAB5FA2BB5|N=6206166|C|BDSET|CH=1|U=CEL|V=23
  public setDirector(cello: Cello, leftRight: number, state: number) {
    this.loggerService.logDebug(Object.getPrototypeOf(this).setDirector.name,
      `Setting director ${leftRight} to ${state} on ${cello.description}`);

    const nounce = MessageGenerator.getRandomNounce();

    // eslint-disable-next-line max-len
    const message = `.KISS|AF=${this.networkInfo.macAddress}|AT=${cello.mac}|N=${nounce}|C|BDSET|CH=${leftRight}|U=CEL|V=${state}|X=${MessageGenerator.getX()}`;

    const request = new Request(message, nounce, cello, this.networkInfo);
    this.udpMessageSender.sendMessage(request);
  }

  // .KISS|AF=989096BE40C7|AT=8CAAB5FA2BB5|N=2264766|C|ASSET|CH=1|CMD=HL|H=0|L=-1.000
  public setShutter(cello: Cello, leftRight: number, shutter: number, lamella: number): void {
    this.loggerService.logDebug(Object.getPrototypeOf(this).setShutter.name,
      `Setting shutter ${leftRight} to shutter ${shutter}, lamella ${lamella} on ${cello.description}`);

    const nounce = MessageGenerator.getRandomNounce();
    const shutterToSet = shutter === -1 ? -1 : shutter;
    const lamellaToSet = lamella === -1 ? -1 : lamella;

    // eslint-disable-next-line max-len
    const message = `.KISS|AF=${this.networkInfo.macAddress}|AT=${cello.mac}|N=${nounce}|C|ASSET|CH=${leftRight}|CMD=HL|H=${shutterToSet}|L=${lamellaToSet}|X=${MessageGenerator.getX()}`;

    const request = new Request(message, nounce, cello, this.networkInfo);
    this.udpMessageSender.sendMessage(request);
  }

  private static getRandomNounce(): number {
    return Math.floor(Math.random() * (999999 - 100 + 1)) + 100;
  }

  private static getX(): string {
    return '123';
  }
}