import * as dgram from 'dgram';
import {LoggerService} from './LoggerService';
import {Request} from '../models/Request';
import {NetworkInfo} from '../models/NetworkInfo';

export class UdpMessageSender {
  private readonly loggerService: LoggerService;

  constructor(loggerService: LoggerService) {
    this.loggerService = loggerService;
  }

  public sendBroadcast(message: string, networkInfo: NetworkInfo): void {
    this.loggerService.logDebug(Object.getPrototypeOf(this).sendBroadcast.name,
      `Sending broadcast message: ${message} to ${networkInfo.broadcastAddress}`);

    const client = dgram.createSocket('udp4');
    client.bind(3178, networkInfo.broadcastAddress);
    client.on('listening', () => {
      const address = client.address();
      client.setBroadcast(true);

      this.loggerService.logDebug(Object.getPrototypeOf(this).sendBroadcast.name,
        `UDP client listening on ${address.address}:${address.port}`);

      const messageBuffer = Buffer.from(message);
      client.send(messageBuffer, 0, messageBuffer.length, 3178, networkInfo.broadcastAddress, (err) => {
        if (err) {
          this.loggerService.logError(Object.getPrototypeOf(this).sendBroadcast.name,
            `Error sending broadcast message: ${err.message}, Error code: ${err.message}`);
        } else {
          this.loggerService.logDebug(Object.getPrototypeOf(this).sendBroadcast.name,
            `Broadcast message successfully sent to ${networkInfo.broadcastAddress}`);
        }

        client.close();
      });
    });
  }

  public sendMessage(request: Request): void {
    this.loggerService.logDebug(Object.getPrototypeOf(this).sendMessage.name, `Sending message to ${request.cello.description} 
      with nounce ${request.nounce} and message ${request.message}`);

    const client = dgram.createSocket('udp4');
    const messageBuffer = Buffer.from(request.message);

    client.send(messageBuffer, 0, messageBuffer.length, request.cello.port, request.cello.ip, (err) => {
      if (err) {
        this.loggerService.logError(Object.getPrototypeOf(this).sendMessage.name,
          `Error sending message: ${err.message} to ${request.cello.description} (${request.cello.ip}), Error code: ${err.message}`);
      } else {
        this.loggerService.logDebug(Object.getPrototypeOf(this).sendMessage.name,
          `Message successfully sent to ${request.cello.description} (${request.cello.ip})`);
      }

      client.close();
    });
  }
}