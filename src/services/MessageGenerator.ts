import {UdpMessageSender} from './UdpMessageSender';
import {LoggerService} from './LoggerService';
import {Cello} from '../models/Cello';
import {NetworkInfo} from '../models/NetworkInfo';
import {Request} from '../models/Request';
import {Message} from '../models/Message';

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

    const message = new Message('.KISS',
      this.networkInfo.macAddress,
      '000000000000',
      MessageGenerator.getRandomNonce().toString(),
      'C',
      'YHELO',
      '',
      new Map<string, string>(
        [
          ['IP', this.networkInfo.ipAddress],
          ['MASTER', '1'],
          ['X', MessageGenerator.getX()],
        ]));

    this.udpMessageSender.sendBroadcast(message, this.networkInfo);
  }

  // .KISS|AF=989096BE40C7|AT=8CAAB5FAABBE|N=3677560|C|LDSET|CH=1|V=0
  public setDimmer(cello: Cello, leftRight: number, state: number) {
    this.loggerService.logDebug(Object.getPrototypeOf(this).setDimmer.name,
      `Setting dimmer ${leftRight} to ${state} on ${cello.description}`);

    const message = new Message('.KISS',
      this.networkInfo.macAddress,
      cello.mac,
      MessageGenerator.getRandomNonce().toString(),
      'C',
      'LDSET',
      leftRight.toString(),
      new Map<string, string>(
        [
          ['V', state.toString()],
          ['X', MessageGenerator.getX()],
        ]));

    this.udpMessageSender.sendMessage(new Request(message, cello));
  }

  // .KISS|AF=989096BE40C7|AT=8CAAB5FAABBE|N=3677560|C|LRSET|CH=1|ST=1
  public setRelay(cello: Cello, leftRight: number, state: boolean) {
    this.loggerService.logDebug(Object.getPrototypeOf(this).setRelay.name,
      `Setting relay ${leftRight} to ${state} on ${cello.description}`);

    const valueToSet = state ? 1 : 0;
    const message = new Message('.KISS',
      this.networkInfo.macAddress,
      cello.mac,
      MessageGenerator.getRandomNonce().toString(),
      'C',
      'LRSET',
      leftRight.toString(),
      new Map<string, string>(
        [
          ['ST', valueToSet.toString()],
          ['X', MessageGenerator.getX()],
        ]));

    this.udpMessageSender.sendMessage(new Request(message, cello));
  }

  //.KISS|AF=989096BE40C7|AT=8CAAB5FA31EC|N=6206168|C|YSCFG|CFG=Reboot|V=0
  public rebootCello(cello: Cello): void {
    this.loggerService.logDebug(Object.getPrototypeOf(this).rebootCello.name,
      `Rebooting cello ${cello.description}`);

    const message = new Message('.KISS',
      this.networkInfo.macAddress,
      cello.mac,
      MessageGenerator.getRandomNonce().toString(),
      'C',
      'YSCFG',
      '',
      new Map<string, string>(
        [
          ['CFG', 'Reboot'],
          ['V', '0'],
          ['X', MessageGenerator.getX()],
        ]));

    this.udpMessageSender.sendMessage(new Request(message, cello));
  }

  // .KISS|AF=989096BE40C7|AT=8CAAB5FA2BB5|N=6206166|C|BDSET|CH=1|U=CEL|V=23
  public setDirector(cello: Cello, leftRight: number, state: number) {
    this.loggerService.logDebug(Object.getPrototypeOf(this).setDirector.name,
      `Setting director ${leftRight} to ${state} on ${cello.description}`);

    const message = new Message('.KISS',
      this.networkInfo.macAddress,
      cello.mac,
      MessageGenerator.getRandomNonce().toString(),
      'C',
      'BDSET',
      leftRight.toString(),
      new Map<string, string>(
        [
          ['U', 'CEL'],
          ['V', state.toString()],
          ['X', MessageGenerator.getX()],
        ]));

    this.udpMessageSender.sendMessage(new Request(message, cello));
  }

  // .KISS|AF=989096BE40C7|AT=8CAAB5FA2BB5|N=2264766|C|ASSET|CH=1|CMD=HL|H=0|L=-1.000
  public setShutter(cello: Cello, leftRight: number, shutter: number, lamella: number): void {
    this.loggerService.logDebug(Object.getPrototypeOf(this).setShutter.name,
      `Setting shutter ${leftRight} to shutter ${shutter}, lamella ${lamella} on ${cello.description}`);

    const shutterToSet = shutter === -1 ? -1 : shutter;
    const lamellaToSet = lamella === -1 ? -1 : lamella;

    const message = new Message('.KISS',
      this.networkInfo.macAddress,
      cello.mac,
      MessageGenerator.getRandomNonce().toString(),
      'C',
      'ASSET',
      leftRight.toString(),
      new Map<string, string>(
        [
          ['CMD', 'HL'],
          ['H', shutterToSet.toString()],
          ['L', lamellaToSet.toString()],
          ['X', MessageGenerator.getX()],
        ]));

    this.udpMessageSender.sendMessage(new Request(message, cello));
  }

  private static getRandomNonce(): number {
    return Math.floor(Math.random() * (999999 - 100 + 1)) + 100;
  }

  private static getX(): string {
    return '123';
  }
}