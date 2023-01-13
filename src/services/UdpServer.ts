import dgram from 'dgram';
import {LoggerService} from './LoggerService';
import {MessageParser} from './MessageParser';
import {NetworkInfo} from '../models/NetworkInfo';
import {UdpMessageSender} from './UdpMessageSender';

export class UdpServer {

  private loggerService: LoggerService;
  private messageParser: MessageParser;
  private networkInfo: NetworkInfo;
  private udpMessageSender: UdpMessageSender;

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

    // Sent message controller
    setInterval(() => {
      for (const request of this.udpMessageSender.getRequestsWithoutResponse()) {
        this.loggerService.logWarning('UdpServer.setInterval',
          `Request without response found with nounce ${request.nounce}`);

        request.try++;
        if (request.try > 3) {
          this.loggerService.logWarning('UdpServer.setInterval',
            `Request without response with nounce ${request.nounce} has reached the maximum number of tries`);

          this.udpMessageSender.removeRequest(request);
          continue;
        }

        this.loggerService.logWarning('UdpServer.setInterval',
          `Request without response with nounce ${request.nounce} will be sent again`);

        request.dateTime = new Date();
        this.udpMessageSender.sendMessage(request);
      }
    }, 500);
  }
}