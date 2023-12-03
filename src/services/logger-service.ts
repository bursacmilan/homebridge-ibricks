import { Logger, LogLevel } from 'homebridge';
import postgres from 'postgres';
import { CelloEvent } from '../models/cello-event';

export class LoggerService {
    private readonly _logger: Logger;
    private readonly _sql?: postgres.Sql;

    constructor(logger: Logger, postgresSqlConnectionString: string | undefined) {
        this._logger = logger;

        if (postgresSqlConnectionString) {
            this._sql = postgres(postgresSqlConnectionString);
        } else {
            logger.log(LogLevel.INFO, 'PostgresSQL not configured');
        }
    }

    public logDebug(method: string, message: string): void {
        this._logger.log(LogLevel.INFO, `${method}: ${message}`);
        void this._logToDatabase(method, message).then();
    }

    public logError(method: string, message: string): void {
        this._logger.log(LogLevel.ERROR, `${method}: ${message}`);
        void this._logToDatabase(method, message).then();
    }

    public logWarning(method: string, message: string): void {
        this._logger.log(LogLevel.WARN, `${method}: ${message}`);
        void this._logToDatabase(method, message).then();
    }

    public logCelloEvent(celloEvent: CelloEvent, logLevel: LogLevel): void {
        void this._logCelloEventInternal(celloEvent, logLevel).then();
    }

    private async _logCelloEventInternal(celloEvent: CelloEvent, logLevel: LogLevel): Promise<void> {
        if (!this._sql) {
            return;
        }

        try {
            await this._sql`
            insert into events
                (cello_ip, cello_mac, event, device_type, leftright, log_level)
            values 
                (${celloEvent.cello.ip}, ${celloEvent.cello.mac}, ${celloEvent.event}, ${celloEvent.deviceType}, ${
                    celloEvent.leftRight
                }, ${logLevel.toString()})
          `;
        } catch (error) {
            this._logger.log(LogLevel.ERROR, 'Postgres error: ' + JSON.stringify(error));
        }
    }

    private async _logToDatabase(method: string, message: string): Promise<void> {
        if (!this._sql) {
            return;
        }

        try {
            await this._sql`
            insert into logs(method, message) values (${method}, ${message})
          `;
        } catch (error) {
            this._logger.log(LogLevel.ERROR, 'Postgres error: ' + JSON.stringify(error));
        }
    }
}
