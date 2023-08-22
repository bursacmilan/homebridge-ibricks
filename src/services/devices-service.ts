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
        this._loggerService.logDebug('DevicesService.GetAllMeteos', `Getting all meteos from total of ${this._cellos.length} cellos`);

        const directors = this.getAllDirectors(false);
        for (const director of directors) {
            director.id = director.id.replace('DIRECTOR', 'METEO');
        }

        const meteos = directors.filter(d => !this._isDisabled(d.mac, d.leftRight, 'meteo'));
        this._loggerService.logDebug('DevicesService.GetAllMeteos', `Total of ${meteos.length} meteos`);
        return meteos;
    }

    public getAllDirectors(filterDisabled: boolean): Director[] {
        this._loggerService.logDebug('DevicesService.GetAllDirectors', `Getting all directors from total of ${this._cellos.length} cellos`);

        let directors = this._getAllOfT<Director>(
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

        directors = directors.filter(d => !this._isDisabled(d.mac, d.leftRight, 'director'));
        this._loggerService.logDebug('DevicesService.GetAllDirectors', `Total of ${directors.length} directors`);
        return directors;
    }

    public getAllShutters(): Shutter[] {
        this._loggerService.logDebug('DevicesService.GetAllShutters', `Getting all shutters from total of ${this._cellos.length} cellos`);

        let shutters = this._getAllOfT<Shutter>(
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

        shutters = shutters.filter(d => !this._isDisabled(d.mac, d.leftRight, 'shutter'));
        this._loggerService.logDebug('DevicesService.GetAllShutters', `Total of ${shutters.length} shutters`);
        return shutters;
    }

    public getAllRelays(): Relay[] {
        this._loggerService.logDebug('DevicesService.GetAllRelays', `Getting all relays from total of ${this._cellos.length} cellos`);

        let relays = this._getAllOfT<Relay>(
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

        relays = relays.filter(d => !this._isDisabled(d.mac, d.leftRight, 'relay'));
        this._loggerService.logDebug('DevicesService.GetAllRelays', `Total of ${relays.length} relays`);
        return relays;
    }

    private _initIgnoredDevices(config: PlatformConfig, loggerService: LoggerService): void {
        loggerService.logDebug('DevicesService.InitIgnoredDevices', 'Initializing ignored devices');
        if (!config.ignoreDevices) {
            loggerService.logDebug('DevicesService.InitIgnoredDevices', 'No ignoreDevices set in config');
            return;
        }

        for (const ignoredDevice of config.ignoreDevices as {
            macAddress: string;
            childDevices: { channel: number; deviceType: string }[];
        }[]) {
            const mac = ignoredDevice.macAddress;
            for (const childDevice of ignoredDevice.childDevices) {
                const channel = childDevice.channel;
                const deviceType = childDevice.deviceType;

                this._ignoredDevices.push({ mac, channel, deviceType });
            }
        }

        loggerService.logDebug('DevicesService.InitIgnoredDevices', `Ignored devices initialized: ${JSON.stringify(this._ignoredDevices)}`);
    }

    private _getAllOfT<T>(factory: (cello: Cello, leftRight: number) => T, deviceType: DeviceType, hardwareInfoProperty: string): T[] {
        const devices: T[] = [];
        for (const cello of this._cellos) {
            if (cello.hardwareInfo === undefined) {
                this._loggerService.logWarning('DevicesService.GetAllOfT', `Cello ${cello.mac} has no hardware info. Skipping this device`);
                continue;
            }

            if ((cello.hardwareInfo[hardwareInfoProperty] as number) === 2) {
                this._loggerService.logDebug('DevicesService.GetAllOfT', `Cello ${cello.description} has 2 ${deviceType}s`);
                devices.push(factory(cello, 1));
                devices.push(factory(cello, 2));
            } else if ((cello.hardwareInfo[hardwareInfoProperty] as number) === 1) {
                this._loggerService.logDebug('DevicesService.GetAllOfT', `Cello ${cello.description} has 1 ${deviceType}`);
                devices.push(factory(cello, 1));
            } else {
                this._loggerService.logDebug('DevicesService.GetAllOfT', `Cello ${cello.description} has no ${deviceType}`);
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
