import dgram from 'dgram';
import {LoggerService} from './logger-service';
import {MessageParser} from './message-parser';
import {NetworkInfo} from '../models/network-info';

export class UdpServer {

  private readonly _loggerService: LoggerService;
  private readonly _messageParser: MessageParser;
  private readonly _networkInfo: NetworkInfo;

  constructor(loggerService: LoggerService, messageParser: MessageParser, networkInfo: NetworkInfo) {
    this._loggerService = loggerService;
    this._messageParser = messageParser;
    this._networkInfo = networkInfo;
  }

  public startAndRun(): void {
    const server = dgram.createSocket('udp4');
    server.on('listening', () => {
      const address = server.address();
      this._loggerService.logDebug('startAndRun',
        `UDP server listening on ${address.address}:${address.port}`);
    });

    server.on('message', (message, remote) => {
      const messageAsString = message.toString();
      this._loggerService.logDebug('startAndRun',
        `UDP server received ${messageAsString} from ${remote.address}:${remote.port}`);

      this._messageParser.parse(messageAsString);
    });

    server.bind(3178, this._networkInfo.ipAddress);
  }
}