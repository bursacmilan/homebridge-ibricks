import https from 'https';
import axios from 'axios';
import { Cello } from '../models/cello';
import { PhilipsHueLightResponse } from '../models/philips-hue-light-response';
import { LoggerService } from '../services/logger-service';

export class PhilipsHue {
    public celloMac: string;
    public leftRight: number;
    public isOn: boolean;
    public id: string;
    public groupId: string;
    public cello?: Cello;

    private readonly _userId: string;
    private readonly _lightStateUrl: string;
    private readonly _groupStateUrl: string;
    private readonly _client: https.Agent;
    private readonly _loggerService: LoggerService;

    private readonly _headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'hue-application-key': string;
        crossDomain: boolean;
    };

    constructor(
        celloMac: string,
        leftRight: number,
        userId: string,
        id: string,
        bridgeIp: string,
        groupId: string,
        loggerService: LoggerService,
    ) {
        this.celloMac = celloMac;
        this.leftRight = leftRight;
        this._loggerService = loggerService;
        this.isOn = false;
        this.id = id;
        this.groupId = groupId;

        this._userId = userId;
        this._lightStateUrl = `https://${bridgeIp}/clip/v2/resource/light/${id}`;
        this._groupStateUrl = `http://${bridgeIp}/api/${this._userId}/groups/${groupId}`;

        this._client = new https.Agent({
            rejectUnauthorized: false,
        });

        this._headers = {
            'hue-application-key': this._userId,
            crossDomain: true,
        };
    }

    public async getLightState(): Promise<PhilipsHueLightResponse | undefined> {
        this._loggerService.logDebug('PhilipsHue.GetLightState', `Getting light state for philips hue with id ${this.id}`);

        const response = await axios
            .get<{
                data: PhilipsHueLightResponse;
            }>(this._lightStateUrl, { headers: this._headers, httpAgent: this._client })
            .catch(
                (err: {
                    message: string;
                    response: {
                        data: unknown;
                        status: unknown;
                    };
                }) => {
                    this._loggerService.logError(
                        'PhilipsHue.GetLightState',
                        `Getting light state for philips hue with id ${this.id} resulted in an error: ${err.message}, ${JSON.stringify(
                            err,
                        )}`,
                    );
                },
            );

        if (!(response instanceof Object) || !response.data) {
            this._loggerService.logError(
                'PhilipsHue.GetLightState',
                `Could not parse light state for philips hue with id ${this.id}. Returning undefined.`,
            );

            return undefined;
        }

        this._loggerService.logDebug(
            'PhilipsHue.GetLightState',
            `Light state for philips hue with id ${this.id}: ${JSON.stringify(response.data)}`,
        );

        return response.data.data;
    }

    public async getGroupState(): Promise<boolean | undefined> {
        this._loggerService.logDebug('PhilipsHue.GetGroupState', `Getting group state for philips hue group with id ${this.groupId}`);

        const response = await axios
            .get<{
                stream: {
                    active: boolean;
                };
            }>(this._groupStateUrl)
            .catch(
                (err: {
                    message: string;
                    response: {
                        data: unknown;
                        status: unknown;
                    };
                }) => {
                    this._loggerService.logError(
                        'PhilipsHue.GetGroupState',
                        `Getting group state for philips hue group with id ${this.groupId} resulted in an error: ${
                            err.message
                        }, ${JSON.stringify(err)}`,
                    );
                },
            );

        if (!(response instanceof Object) || !response.data) {
            this._loggerService.logError(
                'PhilipsHue.GetGroupState',
                `Could not parse group state for philips hue group with id ${this.groupId}. Returning undefined.`,
            );

            return undefined;
        }

        this._loggerService.logDebug(
            'PhilipsHue.GetGroupState',
            `Group state for philips hue group with id ${this.groupId}: ${JSON.stringify(response.data)}`,
        );

        return response?.data?.stream?.active ?? false;
    }

    private _delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public async update(): Promise<void> {
        this._loggerService.logDebug(
            'PhilipsHue.Update',
            `Updating philips hue with id ${this.id} to: 'on'-state = ${this.isOn ? 'true' : 'false'}`,
        );

        if (!this.isOn && (await this.getGroupState())) {
            this._loggerService.logDebug('PhilipsHue.Update', `Hue-Sync is running for group with id ${this.groupId}. Sopping sync.`);
            await this._stopSync();
            await this._delay(2000);
        }

        const body = {
            on: {
                on: this.isOn,
            },
        };

        await axios.put(this._lightStateUrl, body, { headers: this._headers, httpAgent: this._client }).catch(
            (err: {
                message: string;
                response: {
                    data: unknown;
                    status: unknown;
                };
            }) => {
                this._loggerService.logError(
                    'PhilipsHue.update',
                    `Updating light state for philips hue with id ${this.id} resulted in an error: ${err.message}, ${JSON.stringify(err)}`,
                );
            },
        );

        this._loggerService.logDebug('PhilipsHue.update', `Light state for philips hue with id ${this.id} updated`);
    }

    private async _stopSync(): Promise<void> {
        this._loggerService.logDebug('PhilipsHue.StopSync', `Stopping hue sync for philips hue group with id ${this.groupId}`);

        const body = {
            stream: {
                active: false,
            },
        };

        await axios.put(this._groupStateUrl, body).catch(
            (err: {
                message: string;
                response: {
                    data: unknown;
                    status: unknown;
                };
            }) => {
                this._loggerService.logError(
                    'PhilipsHue.StopSync',
                    `Stopping hue sync for philips hue group with id ${this.groupId} resulted in an error: ${err.message}, ${JSON.stringify(
                        err,
                    )}`,
                );
            },
        );

        this._loggerService.logDebug('PhilipsHue.StopSync', `Hue sync stopped for philips hue group with id ${this.groupId} updated`);
    }
}
