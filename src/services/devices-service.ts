import { Cello } from '../models/cello';
import { LoggerService } from './logger-service';
import { PlatformConfig } from 'homebridge';
import { DeviceType } from '../models/device-type';
import { Director } from '../devices/director';
import { Shutter } from '../devices/shutter';
import { Relay } from '../devices/relay';

export class DevicesService {
    private readonly _cellos: Cello[];
    private readonly _loggerService: LoggerService;
    private readonly _ignoredDevices: { mac: string; channel: number; deviceType: string }[] = [];

    constructor(cellos: Cello[], loggerService: LoggerService, config: PlatformConfig) {
        this._cellos = cellos;
        this._loggerService = loggerService;
        this._initIgnoredDevices(config, loggerService);
    }

    public getAllMeteos(): Director[] {
        this._loggerService.logDebug('getAllMeteos', `Getting all meteos from total of ${this._cellos.length} cellos`);

        const directors = this.getAllDirectors(false);
        for (const director of directors) {
            director.id = director.id.replace('DIRECTOR', 'METEO');
        }

        return directors.filter(d => !this._isDisabled(d.mac, d.leftRight, 'meteo'));
    }

    public getAllDirectors(filterDisabled: boolean): Director[] {
        this._loggerService.logDebug('getAllDirectors', `Getting all directors from total of ${this._cellos.length} cellos`);

        const directors = this._getAllOfT<Director>(
            (cello, leftRight) =>
                new Director(
                    this._getDirectorId(cello, leftRight),
                    cello.mac,
                    `${cello.description} - ${leftRight === 1 ? 'Right' : 'Left'}`,
                    leftRight,
                    cello,
                ),
            DeviceType.Director,
            'H',
        );

        if (!filterDisabled) {
            return directors;
        }

        return directors.filter(d => !this._isDisabled(d.mac, d.leftRight, 'director'));
    }

    public getAllShutters(): Shutter[] {
        this._loggerService.logDebug('getAllShutters', `Getting all shutters from total of ${this._cellos.length} cellos`);

        const shutters = this._getAllOfT<Shutter>(
            (cello, leftRight) =>
                new Shutter(
                    this._getShutterId(cello, leftRight),
                    cello.mac,
                    `${cello.description} - ${leftRight === 1 ? 'Right' : 'Left'}`,
                    leftRight,
                    cello,
                ),
            DeviceType.Shutter,
            'S',
        );

        return shutters.filter(d => !this._isDisabled(d.mac, d.leftRight, 'shutter'));
    }

    public getAllRelays(): Relay[] {
        this._loggerService.logDebug('getAllRelays', `Getting all relays from total of ${this._cellos.length} cellos`);

        const relays = this._getAllOfT<Relay>(
            (cello, leftRight) =>
                new Relay(
                    this._getRelayId(cello, leftRight),
                    cello.mac,
                    `${cello.description} - ${leftRight === 1 ? 'Right' : 'Left'}`,
                    leftRight,
                    cello,
                ),
            DeviceType.Relay,
            'R',
        );

        return relays.filter(d => !this._isDisabled(d.mac, d.leftRight, 'relay'));
    }

    private _initIgnoredDevices(config: PlatformConfig, loggerService: LoggerService): void {
        if (!config.ignoreDevices) {
            return;
        }

        for (const ignoredDevice of config.ignoreDevices) {
            const typedIgnoredDevice = ignoredDevice as {
                macAddress: string;
                childDevices: { channel: number; deviceType: string }[];
            };

            const mac = typedIgnoredDevice.macAddress;
            for (const childDevice of typedIgnoredDevice.childDevices) {
                const channel = childDevice.channel;
                const deviceType = childDevice.deviceType;

                this._ignoredDevices.push({ mac, channel, deviceType });
            }
        }

        loggerService.logDebug('DevicesService', `Ignored devices: ${JSON.stringify(this._ignoredDevices)}`);
    }

    private _getAllOfT<T>(factory: (cello: Cello, leftRight: number) => T, deviceType: DeviceType, hardwareInfoProperty: string): T[] {
        this._loggerService.logDebug('_getAllOfT', `Getting all ${deviceType} from total of ${this._cellos.length} cellos`);

        const devices: T[] = [];
        for (const cello of this._cellos) {
            if (cello.hardwareInfo === undefined) {
                this._loggerService.logWarning('_getAllOfT', `Cello ${cello.mac} has no hardware info`);

                continue;
            }

            if ((cello.hardwareInfo[hardwareInfoProperty] as number) === 2) {
                this._loggerService.logDebug('_getAllOfT', `Cello ${cello.description} has 2 ${deviceType}s`);
                devices.push(factory(cello, 1));
                devices.push(factory(cello, 2));
            } else if ((cello.hardwareInfo[hardwareInfoProperty] as number) === 1) {
                this._loggerService.logDebug('_getAllOfT', `Cello ${cello.description} has 1 ${deviceType}`);
                devices.push(factory(cello, 1));
            } else {
                this._loggerService.logDebug('_getAllOfT', `Cello ${cello.description} has no ${deviceType}`);
            }
        }

        return devices;
    }

    private _getRelayId(cello: Cello, leftRight: number): string {
        return `RELAY-${cello.mac}-${leftRight}`;
    }

    private _getDirectorId(cello: Cello, leftRight: number): string {
        return `DIRECTOR-${cello.mac}-${leftRight}`;
    }

    private _getShutterId(cello: Cello, leftRight: number): string {
        return `SHUTTER-${cello.mac}-${leftRight}`;
    }

    private _isDisabled(mac: string, channel: number, type: string): boolean {
        return this._ignoredDevices.filter(i => i.mac === mac && i.channel === channel && i.deviceType === type).length > 0;
    }
}
