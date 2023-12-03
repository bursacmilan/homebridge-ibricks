import { LoggerService } from './logger-service';
import { Subject } from 'rxjs';
import { MessageParser } from './message-parser';
import { IbricksPlatform } from '../ibricks-platform';
import { PhilipsHue } from '../devices/philips-hue';
import { MessageGenerator } from './message-generator';
import { PhilipsHueSseResponse } from '../models/philips-hue-sse-response';
import { CelloEvent } from '../models/cello-event';

export class PhilipsHueSse {
    private readonly _philipsHueSseEvents: Subject<PhilipsHueSseResponse> = new Subject<PhilipsHueSseResponse>();
    private readonly _philipsHueDevices: PhilipsHue[] = [];

    constructor(
        private readonly _loggerService: LoggerService,
        private readonly _messageParser: MessageParser,
        private readonly _messageGenerator: MessageGenerator,
        private readonly _userId: string,
        private readonly _bridgeIp: string,
        _platform: IbricksPlatform,
        _devices: { macAddress: string; channel: number; deviceId: string; groupId: string }[],
    ) {
        this._philipsHueDevices = _devices.map(
            device =>
                new PhilipsHue(device.macAddress, device.channel, _userId, device.deviceId, _bridgeIp, device.groupId, _loggerService),
        );

        this._loggerService.logDebug('PhilipsHueSse', `Total ${this._philipsHueDevices.length} devices`);

        this._messageParser.celloEvent.subscribe(event => {
            this._processCelloEvent(event);
        });

        this._philipsHueSseEvents.pipe().subscribe(changeData => {
            this._processSseEvent(changeData);
        });
    }

    private _processSseEvent(changeData: PhilipsHueSseResponse): void {
        this._loggerService.logDebug('PhilipsHueSse.ProcessSseEvent', `Processing SSE event: ${JSON.stringify(changeData)}`);

        let group: string | undefined = undefined;
        if (changeData.id_v1.startsWith('/groups/') && changeData.status === 'active') {
            const idV1Splitted = changeData.id_v1.split('/');
            group = idV1Splitted[idV1Splitted.length - 1];
        }

        if (group) {
            const philipsHueDevices = this._philipsHueDevices.filter(d => d.groupId === group);
            this._loggerService.logDebug(
                'PhilipsHueSse.ProcessSseEvent',
                `Processing SSE event for philips hue group (active = true) with id ${group} for total of ${philipsHueDevices.length} philips hue devices`,
            );

            for (const philipsHueDevice of philipsHueDevices) {
                const celloIsOn = philipsHueDevice.leftRight === 1 ? philipsHueDevice.cello?.relayRight : philipsHueDevice.cello?.relayLeft;
                if (celloIsOn) {
                    this._loggerService.logDebug(
                        'PhilipsHueSse.ProcessSseEvent',
                        `Cello with mac ${philipsHueDevice.celloMac} and channel ${philipsHueDevice.leftRight} is already on. Skipping`,
                    );

                    return;
                }

                this._loggerService.logDebug(
                    'PhilipsHueSse.ProcessSseEvent',
                    `Setting cello with mac ${philipsHueDevice.celloMac} and channel to on`,
                );

                if (philipsHueDevice.cello) {
                    this._messageGenerator.setRelay(philipsHueDevice.cello, philipsHueDevice.leftRight, true);
                }
            }
        } else {
            const philipsHueDevices = this._philipsHueDevices.filter(d => d.id === changeData.id && changeData.on);
            this._loggerService.logDebug(
                'PhilipsHueSse.ProcessSseEvent',
                `Processing SSE event for philips hue light with id ${changeData.id ?? ''} for total of ${
                    philipsHueDevices.length
                } philips hue devices`,
            );

            for (const philipsHueDevice of philipsHueDevices) {
                philipsHueDevice.isOn = changeData.on?.on ?? false;

                const celloIsOn = philipsHueDevice.leftRight === 1 ? philipsHueDevice.cello?.relayRight : philipsHueDevice.cello?.relayLeft;
                if (celloIsOn === changeData.on?.on) {
                    this._loggerService.logDebug(
                        'PhilipsHueSse.ProcessSseEvent',
                        `Cello with mac ${philipsHueDevice.celloMac} and channel ${
                            philipsHueDevice.leftRight
                        } already has the value to be set (${changeData.on?.on ? 'true' : 'false'}). Skipping`,
                    );

                    continue;
                }

                if (philipsHueDevice.cello && changeData.on) {
                    this._messageGenerator.setRelay(philipsHueDevice.cello, philipsHueDevice.leftRight, changeData.on.on);
                }
            }
        }
    }

    private _processCelloEvent(event: CelloEvent): void {
        this._loggerService.logDebug(
            'PhilipsHueSse.ProcessCelloEvent',
            `Processing cello event for cello with id ${event.cello.mac} and channel ${event.leftRight}`,
        );

        const philipsHueDevices = this._philipsHueDevices.filter(d => d.celloMac === event.cello.mac && d.leftRight === event.leftRight);
        const isOn = event.leftRight === 1 ? event.cello.relayRight : event.cello.relayLeft;

        this._loggerService.logDebug(
            'PhilipsHueSse.ProcessCelloEvent',
            `Found total ${philipsHueDevices.length} philips hue devices for cello with id ${event.cello.mac} and channel ${
                event.leftRight
            }. Setting state to ${isOn ? 'true' : 'false'}`,
        );

        for (const philipsHueDevice of philipsHueDevices) {
            philipsHueDevice.cello = event.cello;
            if (philipsHueDevice.isOn === isOn) {
                this._loggerService.logDebug(
                    'PhilipsHueSse.ProcessCelloEvent',
                    `Philips hue light with id ${philipsHueDevice.id} already has the value to be set (${isOn ? 'true' : 'false'})`,
                );
                continue;
            }

            philipsHueDevice.isOn = isOn;
            void philipsHueDevice.update().then();
        }
    }

    public startSse(): void {
        this._loggerService.logDebug('PhilipsHueSse.StartSse', `Subscribing to philips hue eventstream (SSE)`);

        const eventSource: EventSource = new EventSource(`https://${this._bridgeIp}/eventstream/clip/v2`, {
            headers: {
                'hue-application-key': this._userId,
                accept: 'text/event-stream',
            },
            https: {
                rejectUnauthorized: false,
            },
        } as EventSourceInit);
        eventSource.onmessage = (event: { data: string }): void => {
            try {
                this._loggerService.logDebug('PhilipsHueSse.OnMessage', `Receiving philips hue SSE message: ${event.data}`);
                this._sseOnMessage(event);
            } catch (e) {
                this._loggerService.logError(
                    'PhilipsHueSse.OnMessage',
                    `Error while processing philips hue SSE message: ${JSON.stringify(e)}`,
                );
            }
        };
        eventSource.onopen = (): void => {
            this._loggerService.logDebug('PhilipsHueSse.OnOpen', 'Connection to philips hue SSE established');
        };
        eventSource.onerror = (): void => {
            eventSource.close();
            this._loggerService.logError('PhilipsHueSse.OnError', 'Error on connection to philips hue SSE. Reconnecting...');
            this.startSse();
        };
    }

    private _sseOnMessage(event: { data: string }): void {
        const parsedData = JSON.parse(event.data) as { data: PhilipsHueSseResponse[] }[];
        this._loggerService.logDebug(
            'PhilipsHueSse.SseOnMessage',
            `Parsed SSE message to PhilipsHueSseResponse-Array: ${JSON.stringify(parsedData)}`,
        );

        // Flatten array data
        const flattenedArray: PhilipsHueSseResponse[] = [];
        parsedData.map(d => {
            flattenedArray.push(...d.data.filter(d => d.id));
        });

        this._loggerService.logDebug('PhilipsHueSse.SseOnMessage', `Total ${flattenedArray.length} single events. Creating events for all`);

        flattenedArray.map(d => this._philipsHueSseEvents.next(d));
    }
}
