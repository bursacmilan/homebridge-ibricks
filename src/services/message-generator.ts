import { UdpMessageSender } from './udp-message-sender';
import { LoggerService } from './logger-service';
import { Cello } from '../models/cello';
import { NetworkInfo } from '../models/network-info';
import { Request } from '../models/request';
import { Message } from '../models/message';

export class MessageGenerator {
    private readonly _udpMessageSender: UdpMessageSender;
    private readonly _loggerService: LoggerService;
    private readonly _networkInfo: NetworkInfo;

    constructor(udpMessageSender: UdpMessageSender, loggerService: LoggerService, networkInfo: NetworkInfo) {
        this._udpMessageSender = udpMessageSender;
        this._networkInfo = networkInfo;
        this._loggerService = loggerService;
    }

    //.KISS|AF=989096BE40C7|AT=000000000000|N=1149760|C|YHELO|IP=192.168.3.84|MASTER=1
    public sendIamMasterBroadcast(): void {
        this._loggerService.logDebug('sendIamMasterBroadcast', 'Sending I am master broadcast');

        const message = new Message(
            '.KISS',
            this._networkInfo.macAddress,
            '000000000000',
            MessageGenerator._getRandomNonce().toString(),
            'C',
            'YHELO',
            '',
            new Map<string, string>([
                ['IP', this._networkInfo.ipAddress],
                ['MASTER', '1'],
                ['X', MessageGenerator._getX()],
            ]),
        );

        this._udpMessageSender.sendBroadcast(message, this._networkInfo);
    }

    // .KISS|AF=989096BE40C7|AT=8CAAB5FAABBE|N=3677560|C|LDSET|CH=1|V=0
    public setDimmer(cello: Cello, leftRight: number, state: number): void {
        this._loggerService.logDebug('setDimmer', `Setting dimmer ${leftRight} to ${state} on ${cello.description}`);

        const message = new Message(
            '.KISS',
            this._networkInfo.macAddress,
            cello.mac,
            MessageGenerator._getRandomNonce().toString(),
            'C',
            'LDSET',
            leftRight.toString(),
            new Map<string, string>([
                ['V', state.toString()],
                ['X', MessageGenerator._getX()],
            ]),
        );

        this._udpMessageSender.sendMessage(new Request(message, cello));
    }

    // .KISS|AF=989096BE40C7|AT=8CAAB5FAABBE|N=3677560|C|LRSET|CH=1|ST=1
    public setRelay(cello: Cello, leftRight: number, state: boolean): void {
        this._loggerService.logDebug('setRelay', `Setting relay ${leftRight} to ${state ? 'on' : 'off'} on ${cello.description}`);

        const valueToSet = state ? 1 : 0;
        const message = new Message(
            '.KISS',
            this._networkInfo.macAddress,
            cello.mac,
            MessageGenerator._getRandomNonce().toString(),
            'C',
            'LRSET',
            leftRight.toString(),
            new Map<string, string>([
                ['ST', valueToSet.toString()],
                ['X', MessageGenerator._getX()],
            ]),
        );

        this._udpMessageSender.sendMessage(new Request(message, cello));
    }

    //.KISS|AF=989096BE40C7|AT=8CAAB5FA31EC|N=6206168|C|YSCFG|CFG=Reboot|V=0
    public rebootCello(cello: Cello): void {
        this._loggerService.logDebug('rebootCello', `Rebooting cello ${cello.description}`);

        const message = new Message(
            '.KISS',
            this._networkInfo.macAddress,
            cello.mac,
            MessageGenerator._getRandomNonce().toString(),
            'C',
            'YSCFG',
            '',
            new Map<string, string>([
                ['CFG', 'Reboot'],
                ['V', '0'],
                ['X', MessageGenerator._getX()],
            ]),
        );

        this._udpMessageSender.sendMessage(new Request(message, cello));
    }

    // .KISS|AF=989096BE40C7|AT=8CAAB5FA2BB5|N=6206166|C|BDSET|CH=1|U=CEL|V=23
    public setDirector(cello: Cello, leftRight: number, state: number): void {
        this._loggerService.logDebug('setDirector', `Setting director ${leftRight} to ${state} on ${cello.description}`);

        const message = new Message(
            '.KISS',
            this._networkInfo.macAddress,
            cello.mac,
            MessageGenerator._getRandomNonce().toString(),
            'C',
            'BDSET',
            leftRight.toString(),
            new Map<string, string>([
                ['U', 'CEL'],
                ['V', state.toString()],
                ['X', MessageGenerator._getX()],
            ]),
        );

        this._udpMessageSender.sendMessage(new Request(message, cello));
    }

    // .KISS|AF=989096BE40C7|AT=8CAAB5FA2BB5|N=2264766|C|ASSET|CH=1|CMD=HL|H=0|L=-1.000
    public setShutter(cello: Cello, leftRight: number, shutter: number, lamella: number): void {
        this._loggerService.logDebug(
            'setShutter',
            `Setting shutter ${leftRight} to shutter ${shutter}, lamella ${lamella} on ${cello.description}`,
        );

        const shutterToSet = shutter === -1 ? -1 : shutter;
        const lamellaToSet = lamella === -1 ? -1 : lamella;

        const message = new Message(
            '.KISS',
            this._networkInfo.macAddress,
            cello.mac,
            MessageGenerator._getRandomNonce().toString(),
            'C',
            'ASSET',
            leftRight.toString(),
            new Map<string, string>([
                ['CMD', 'HL'],
                ['H', shutterToSet.toString()],
                ['L', lamellaToSet.toString()],
                ['X', MessageGenerator._getX()],
            ]),
        );

        this._udpMessageSender.sendMessage(new Request(message, cello));
    }

    private static _getRandomNonce(): number {
        return Math.floor(Math.random() * (999999 - 100 + 1)) + 100;
    }

    private static _getX(): string {
        return '123';
    }
}
