import * as dgram from 'dgram';
import {LoggerService} from './LoggerService';
import {Request} from '../models/Request';
import {NetworkInfo} from '../models/NetworkInfo';

export class UdpMessageSender {

  private loggerService: LoggerService;
  private requests: Request[] = [];

  constructor(loggerService: LoggerService) {
    this.loggerService = loggerService;
  }

  public sendBroadcast(message: string, networkInfo: NetworkInfo): void {
    this.loggerService.logDebug(`Sending broadcast message ${message} to ${networkInfo.broadcastAddress}`);

    const client = dgram.createSocket('udp4');
    const messageBuffer = Buffer.from(message);

    client.send(messageBuffer, 0, messageBuffer.length, 3178, networkInfo.broadcastAddress, (err) => {
      if (err) {
        this.loggerService.logError(err.message);
      }

      client.close();
    });
  }

  public sendMessage(request: Request): void {
    this.loggerService.logDebug(`Sending message to ${request.cello.description} 
      with nounce ${request.nounce} and message ${request.message}`);

    const client = dgram.createSocket('udp4');
    const messageBuffer = Buffer.from(request.message);

    this.requests.push(request);
    client.send(messageBuffer, 0, messageBuffer.length, request.cello.port, request.cello.ip, (err) => {
      if (err) {
        this.loggerService.logError(err.message);
      }

      client.close();
    });
  }

  public getRequestsWithoutResponse(): Request[] {
    const dateToCheck = new Date();
    return this.requests.filter(r => (dateToCheck.getTime() - r.dateTime.getTime()) >= 500);
  }

  public removeRequestByNounce(nounce: number) {
    this.requests = this.requests.filter(r => r.nounce !== nounce);
  }

  public removeRequest(request: Request): void {
    this.requests = this.requests.filter(r => r !== request);
  }
}