/* eslint-disable max-len */
import { Message } from '../models/message';

export class MessageInterpretor {
    /****
    Example messages
  ****/

    /*** Director change
    .KISS|AF=F4CFA2DB6626|AT=0000000CLOUD|N=698|E|SICHG|T=TEMP|CH=1|U=CEL|V=21.51 (CURRENT)
    .KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=7|E|BDCHG|CH=1|U=CEL|V=18.00 (TARGET)
  ***/

    /*** Shutter change
    .KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=3108|E|ASCHG|CH=1|CMD=HL|H=0.826|L=0.000
  ***/

    /*** Relay and dimmer change
    .KISS|AF=8CAAB5FAABBE|AT=0000000CLOUD|N=727|E|LDCHG|CH=1|V=0.000 (DIMMER)
    .KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=474|E|LRCHG|CH=1|ST=0 (RELAY)
  ***/

    /*** Response from IAMMASTER (Registering device)
    .KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=453|E|YHELO|IP=192.168.3.250|DESC=Buero+%2D+T1
  ***/

    /*** Debug info
    .KISS|AF=8CAAB5FA2BB5|AT=0000000CLOUD|N=460|E|YINFO|T=DebugInfo|V=Hardware=1R1S1H/1803;Firmware=2.2.44.PROD;StartupTime=08h20m;SSID=Bursac - Lakic,D0:21:F9:D5:C9:88;Mode=802.11n;RSSI=44%(-78);FreeHeap=13872;Temp=21.15;TempCalc=21.15;TempAdj=0.00;TempF=28.25;TempB=29.44;TempExt=n/a;Spiffs=600;Dip=00;Valve=0;ValveP=0.00;DirSoll=19.50;DirIst=21.15;Relais=1;Shutter=0.08%,100.00%
    .KISS|AF=8CAAB5FAABBE|AT=0000000CLOUD|N=729|E|YINFO|T=DebugInfo|V=Hardware=DIM_GL/1915;Firmware=2.2.0.PROD;StartupTime=08h16m;SSID=Bursac - Lakic,D0:21:F9:D5:C9:88;RSSI=48%(-76);FreeHeap=16568;Temp=24.78;TempCalc=24.78;TempAdj=n/a;TempF=32.44;TempB=42.94;TempExt=n/a;Spiffs=210;Dip=00(255);DimValue=0.00
  ***/

    public static interpret(messageToInterpret: string): Message {
        const splittedMessage: string[] = messageToInterpret.split('|').map(d => this._getCleanedData(d));
        const additionalData: Map<string, string> = new Map<string, string>();
        let protocol = '',
            addressFrom = '',
            addressTo = '',
            nonce = '',
            type = '',
            command = '',
            channel = '';

        for (const messagePart of splittedMessage) {
            const keyValue = messagePart.split('=');

            if (keyValue.length === 2) {
                switch (keyValue[0]) {
                    case 'AF':
                        addressFrom = keyValue[1];
                        break;
                    case 'AT':
                        addressTo = keyValue[1];
                        break;
                    case 'N':
                        nonce = keyValue[1];
                        break;
                    case 'CH':
                        channel = keyValue[1];
                        break;
                    default:
                        additionalData.set(keyValue[0], keyValue[1]);
                }
            } else if (keyValue.length > 2) {
                additionalData.set(keyValue[0], keyValue.slice(1).join('='));
            } else {
                switch (messagePart) {
                    case '.KISS':
                        protocol = '.KISS';
                        break;
                    case 'E':
                        type = 'E';
                        break;
                    case 'SICHG':
                    case 'BDCHG':
                    case 'ASCHG':
                    case 'LDCHG':
                    case 'LRCHG':
                    case 'YHELO':
                    case 'YINFO':
                        command = messagePart;
                        break;
                }
            }
        }

        return new Message(protocol, addressFrom, addressTo, nonce, type, command, channel, additionalData);
    }

    private static _getCleanedData(data: string): string {
        return data.replace(/\r/g, '');
    }
}
