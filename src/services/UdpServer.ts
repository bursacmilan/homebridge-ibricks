import dgram from 'dgram';
import {LoggerService} from './LoggerService';
import {MessageParser} from './MessageParser';
import {NetworkInfo} from '../models/NetworkInfo';
import {UdpMessageSender} from './UdpMessageSender';

export class UdpServer {

  private readonly loggerService: LoggerService;
  private readonly messageParser: MessageParser;
  private readonly networkInfo: NetworkInfo;
  private readonly udpMessageSender: UdpMessageSender;

  constructor(loggerService: LoggerService, messageParser: MessageParser, networkInfo: NetworkInfo, udpMessageSender: UdpMessageSender) {
    this.loggerService = loggerService;
    this.messageParser = messageParser;
    this.networkInfo = networkInfo;
    this.udpMessageSender = udpMessageSender;
  }

  public startAndRun(): void {
    const server = dgram.createSocket('udp4');
    server.on('listening', () => {
      const address = server.address();
      this.loggerService.logDebug(Object.getPrototypeOf(this).startAndRun.name,
        `UDP server listening on ${address.address}:${address.port}`);
    });

    server.on('message', (message, remote) => {
      this.loggerService.logDebug(Object.getPrototypeOf(this).startAndRun.name,
        `UDP server received ${message} from ${remote.address}:${remote.port}`);

      this.messageParser.parse(message.toString());
    });

    server.bind(3178, this.networkInfo.ipAddress);
  }
}