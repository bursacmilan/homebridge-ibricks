import * as dgram from 'dgram';
import {LoggerService} from './logger-service';
import {Request} from '../models/request';
import {NetworkInfo} from '../models/network-info';
import {Message} from '../models/message';

export class UdpMessageSender {
  private readonly _loggerService: LoggerService;

  constructor(loggerService: LoggerService) {
    this._loggerService = loggerService;
  }

  public sendBroadcast(message: Message, networkInfo: NetworkInfo): void {
    this._loggerService.logDebug('sendBroadcast',
      `Sending broadcast message: ${message.getMessageAsString()} to ${networkInfo.broadcastAddress}`);

    const client = dgram.createSocket('udp4');
    client.bind(3178, networkInfo.broadcastAddress);
    client.on('listening', () => {
      const address = client.address();
      client.setBroadcast(true);

      this._loggerService.logDebug('sendBroadcast',
        `UDP client listening on ${address.address}:${address.port}`);

      const messageBuffer = Buffer.from(message.getMessageAsString());
      client.send(messageBuffer, 0, messageBuffer.length, 3178, networkInfo.broadcastAddress, (err) => {
        if (err) {
          this._loggerService.logError('sendBroadcast',
            `Error sending broadcast message: ${err.message}, Error code: ${err.message}`);
        } else {
          this._loggerService.logDebug('sendBroadcast',
            `Broadcast message successfully sent to ${networkInfo.broadcastAddress}`);
        }

        client.close();
      });
    });
  }

  public sendMessage(request: Request): void {
    this._loggerService.logDebug('sendBroadcast',
      `Sending message to ${request.cello.description} with message ${request.message.getMessageAsString()}`);

    const client = dgram.createSocket('udp4');
    const messageBuffer = Buffer.from(request.message.getMessageAsString());

    client.send(messageBuffer, 0, messageBuffer.length, request.cello.port, request.cello.ip, (err) => {
      if (err) {
        this._loggerService.logError('sendBroadcast',
          `Error sending message: ${err.message} to ${request.cello.description} (${request.cello.ip}), Error code: ${err.message}`);
      } else {
        this._loggerService.logDebug('sendBroadcast',
          `Message successfully sent to ${request.cello.description} (${request.cello.ip})`);
      }

      client.close();
    });
  }
}