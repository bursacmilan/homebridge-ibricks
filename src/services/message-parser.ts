import { LoggerService } from './logger-service';
import { Cello } from '../models/cello';
import { HardwareInfo } from '../models/hardware-info';
import { Subject } from 'rxjs';
import { CelloEvent } from '../models/cello-event';
import { DeviceType } from '../models/device-type';
import { Message } from '../models/message';
import { MessageInterpretor } from './message-interpretor';

export class MessageParser {
    private readonly _loggerService: LoggerService;
    public readonly celloEvent: Subject<CelloEvent> = new Subject<CelloEvent>();

    constructor(loggerService: LoggerService) {
        this._loggerService = loggerService;
    }

    public parse(data: string): void {
        this._loggerService.logDebug('parse', `Parsing message: ${data}`);
        const message = MessageInterpretor.interpret(data);

        this._loggerService.logDebug(
            'parse',
            `Parsed message: ${JSON.stringify(message)},
     additional: ${JSON.stringify(Object.fromEntries(message.additionalData))}`,
        );

        if (message.isEventWithCommand('YHELO')) {
            this.parseYHELO(message);
        } else if (message.isEventWithCommandAndData('YINFO', 'V', 'Hardware')) {
            this._parseYINFO_DebugInfo(message);
        } else if (message.isEventWithCommand('LRCHG') || message.isEventWithCommand('LDCHG')) {
            this.parseRELAY_CHANGE(message);
        } else if (message.isEventWithCommand('ASCHG')) {
            this.parseSHUTTER_CHANGE(message);
        } else if (message.isEventWithCommand('SICHG') || message.isEventWithCommand('BDCHG')) {
            this.parseDIRECTOR_CHANGE(message);
        }
    }

    //.KISS|AF=F4CFA2DB6626|AT=0000000CLOUD|N=698|E|SICHG|T=TEMP|CH=1|U=CEL|V=21.51 (CURRENT)
    //.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=7|E|BDCHG|CH=1|U=CEL|V=18.00 (TARGET)
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private parseDIRECTOR_CHANGE(message: Message): void {
        if (message.channel === undefined) {
            this._loggerService.logWarning('parseDIRECTOR_CHANGE', 'Channel not found');
            return;
        }

        const current = message.isEventWithCommand('SICHG') ? message.getNumber('V') : undefined;
        const target = message.isEventWithCommand('BDCHG') ? message.getNumber('V') : undefined;

        this._loggerService.logDebug('parseDIRECTOR_CHANGE', `Current: ${current ?? ''} Target: ${target ?? ''}`);

        this._updateCello(
            message.addressFrom,
            cello => {
                if (message.channel === 1) {
                    cello.currentTemperatureRight = current !== undefined ? current : cello.currentTemperatureRight;
                    cello.targetTemperatureRight = target !== undefined ? target : cello.targetTemperatureRight;
                } else if (message.channel === 2) {
                    cello.currentTemperatureLeft = current !== undefined ? current : cello.currentTemperatureLeft;
                    cello.targetTemperatureLeft = target !== undefined ? target : cello.targetTemperatureLeft;
                }
            },
            cello => {
                if (!message.channel) {
                    throw new Error('Channel not set');
                }

                this.celloEvent.next(new CelloEvent(cello, '', DeviceType.Director, message.channel));
            },
        );
    }

    //.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=3108|E|ASCHG|CH=1|CMD=HL|H=0.826|L=0.000
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private parseSHUTTER_CHANGE(message: Message): void {
        if (message.channel === undefined) {
            this._loggerService.logWarning('parseSHUTTER_CHANGE', 'Channel not found');
            return;
        }

        const cmd = message.getString('CMD');
        if (cmd === 'UP' || cmd === 'DN') {
            this._updateCello(message.addressFrom, undefined, cello => {
                this.celloEvent.next(new CelloEvent(cello, cmd, DeviceType.Shutter, message.channel));
            });

            return;
        }

        if (cmd !== 'HL' && cmd !== 'ST') {
            this._loggerService.logWarning('parseSHUTTER_CHANGE', `Unknown command: ${cmd ?? ''}`);
            return;
        }

        this._updateCello(
            message.addressFrom,
            cello => {
                if (message.channel === 1) {
                    cello.shutterRight = message.getNumber('H') ?? cello.shutterRight;
                    cello.lamellaRight = message.getNumber('L') ?? cello.lamellaRight;
                } else if (message.channel === 2) {
                    cello.shutterLeft = message.getNumber('H') ?? cello.shutterLeft;
                    cello.lamellaLeft = message.getNumber('L') ?? cello.lamellaLeft;
                }
            },
            cello => {
                this.celloEvent.next(new CelloEvent(cello, cmd, DeviceType.Shutter, message.channel));
            },
        );
    }

    //.KISS|AF=8CAAB5FAABBE|AT=0000000CLOUD|N=727|E|LDCHG|CH=1|V=0.000
    //.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=474|E|LRCHG|CH=1|ST=0
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private parseRELAY_CHANGE(message: Message): void {
        if (message.channel === undefined) {
            this._loggerService.logWarning('parseRELAY_CHANGE', 'Channel not found');
            return;
        }

        this._updateCello(
            message.addressFrom,
            cello => {
                if (message.channel === 1) {
                    cello.relayRight = message.getNumber('ST') === 1;
                    cello.dimmerRight = message.getNumber('V') ?? cello.dimmerRight;
                } else if (message.channel === 2) {
                    cello.relayLeft = message.getNumber('ST') === 1;
                    cello.dimmerLeft = message.getNumber('V') ?? cello.dimmerLeft;
                }
            },
            cello => {
                this.celloEvent.next(new CelloEvent(cello, '', DeviceType.Relay, message.channel));
            },
        );
    }

    // Response from IAMMASTER (Registering device)
    //.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=453|E|YHELO|IP=192.168.3.250|DESC=Buero+%2D+T1
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private parseYHELO(message: Message): void {
        let desc = message.getString('DESC');
        if (!desc) {
            this._loggerService.logWarning('parseYHELO', 'Description not found');
            return;
        }

        desc = this._urlDecode(desc);

        const ip = message.getString('IP');
        if (!ip) {
            this._loggerService.logWarning('parseYHELO', 'IP not found');
            return;
        }

        Cello.createCelloAndSafeOnFileSystem(desc, ip, message.addressFrom);
    }

    // eslint-disable-next-line max-len
    //.KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=460|E|YINFO|T=DebugInfo|V=Hardware=1R1S1H/1803;Firmware=2.2.44.PROD;StartupTime=08h20m;SSID=Bursac - Lakic,D0:21:F9:D5:C9:88;Mode=802.11n;RSSI=44%(-78);FreeHeap=13872;Temp=21.15;TempCalc=21.15;TempAdj=0.00;TempF=28.25;TempB=29.44;TempExt=n/a;Spiffs=600;Dip=00;Valve=0;ValveP=0.00;DirSoll=19.50;DirIst=21.15;Relais=1;Shutter=0.08%,100.00%
    // eslint-disable-next-line max-len
    //.KISS|AF=8CAAB5FAABBE|AT=0000000CLOUD|N=729|E|YINFO|T=DebugInfo|V=Hardware=DIM_GL/1915;Firmware=2.2.0.PROD;StartupTime=08h16m;SSID=Bursac - Lakic,D0:21:F9:D5:C9:88;RSSI=48%(-76);FreeHeap=16568;Temp=24.78;TempCalc=24.78;TempAdj=n/a;TempF=32.44;TempB=42.94;TempExt=n/a;Spiffs=210;Dip=00(255);DimValue=0.00
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private _parseYINFO_DebugInfo(message: Message): void {
        const v = message.getString('V');
        if (v === undefined) {
            this._loggerService.logWarning('_parseYINFO_DebugInfo', 'V not found');
            return;
        }

        this._updateCello(
            message.addressFrom,
            cello => {
                cello.hardwareInfo = this._parseAndGetHardwareInfo(v.split('/')[0]);
                this._loggerService.logDebug('MessageParser', `Cello hardwareInfo: ${JSON.stringify(cello.hardwareInfo)}`);
                // eslint-disable-next-line @typescript-eslint/no-empty-function
            },
            () => undefined,
        );
    }

    private _updateCello(af: string, change: ((cello: Cello) => void) | undefined, sendEvent: (cello: Cello) => void): void {
        const cello = Cello.getCelloFromFile(Cello.getFilePath(af));
        if (cello === undefined) {
            this._loggerService.logWarning('_updateCellos', `Cello with AF: ${af} not found`);
            return;
        }

        if (change === undefined) {
            sendEvent(cello);
            return;
        }

        change(cello);
        cello.saveToFile();
        sendEvent(cello);
    }

    private _parseAndGetHardwareInfo(info: string): HardwareInfo {
        if (info.indexOf('S36TX') !== -1) {
            this._loggerService.logDebug('_parseAndGetHardwareInfo', 'S36TX found');
            return new HardwareInfo(1, 0, 1, 0);
        } else if (info.indexOf('DIM_GL') !== -1) {
            this._loggerService.logDebug('_parseAndGetHardwareInfo', 'DIM_GL found');
            return new HardwareInfo(1, 0, 0, 1);
        }

        const characters = info.split('');

        let r = 0,
            s = 0,
            h = 0;
        for (let i = 1; i < characters.length; i++) {
            if (characters[i] === 'R') {
                r = +characters[i - 1];
            } else if (characters[i] === 'S') {
                s = +characters[i - 1];
            } else if (characters[i] === 'H') {
                h = +characters[i - 1];
            }
        }

        return new HardwareInfo(r, s, h, 0);
    }

    private _urlDecode(data: string): string {
        return decodeURIComponent(data).replace(/\+/g, ' ');
    }
}
