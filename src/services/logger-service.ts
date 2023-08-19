import {Logger, LogLevel} from 'homebridge';

export class LoggerService {
  private readonly _logger: Logger;

  constructor(logger: Logger) {
    this._logger = logger;
  }

  public logDebug(method: string, message: string): void {
    this._logger.log(LogLevel.INFO, `${method}: ${message}`);
  }

  public logError(method: string, message: string): void {
    this._logger.log(LogLevel.ERROR, `${method}: ${message}`);
  }

  public logWarning(method: string, message: string): void {
    this._logger.log(LogLevel.WARN, `${method}: ${message}`);
  }
}