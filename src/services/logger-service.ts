import { Logger, LogLevel } from 'homebridge';
import postgres from 'postgres';

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

    private async _logToDatabase(method: string, message: string): Promise<void> {
        if (!this._sql) {
            return;
        }

        try {
            await this._sql`
            insert into logs(method, message) values (${method}, ${message})
          `;
        } catch (error) {
            this._logger.log(LogLevel.ERROR, 'Postgre error: ' + JSON.stringify(error));
        }
    }
}
