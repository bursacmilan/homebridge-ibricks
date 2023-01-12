import {UdpMessageSender} from './UdpMessageSender';
import {LoggerService} from './LoggerService';
import {Cello} from '../models/Cello';
import {NetworkInfo} from '../models/NetworkInfo';
import {Request} from '../models/Request';

export class MessageGenerator {

  private udpMessageSender: UdpMessageSender;
  private loggerService: LoggerService;
  private networkInfo: NetworkInfo;

  constructor(udpMessageSender: UdpMessageSender, loggerService: LoggerService, networkInfo: NetworkInfo) {
    this.udpMessageSender = udpMessageSender;
    this.networkInfo = networkInfo;
    this.loggerService = loggerService;
  }

  public sendIamMasterBroadcast() {
    this.loggerService.logDebug('Sending iam master broadcast');

    const nounce = MessageGenerator.getRandomNounce();
    // eslint-disable-next-line max-len
    const message = `.KISS|AF=${this.networkInfo.macAddress}|AT=000000000000|N=${nounce}|C|YHELO|IP=${this.networkInfo.ipAddress}|MASTER=1|X=${MessageGenerator.getX()}`;
    this.udpMessageSender.sendBroadcast(message, this.networkInfo);
  }

  public setRelay(cello: Cello, leftRight: number, state: boolean) {
    this.loggerService.logDebug(`Setting relay ${leftRight} to ${state} on ${cello.description}`);

    const nounce = MessageGenerator.getRandomNounce();
    const valueToSet = state ? 1 : 0;
    // eslint-disable-next-line max-len
    const message = `.KISS|AF=${this.networkInfo.macAddress}|AT=${cello.mac}|N=${nounce}|C|LRSET|CH=${leftRight}|ST=${valueToSet}|X=${MessageGenerator.getX()}`;

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