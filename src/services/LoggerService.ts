import {Logger, LogLevel} from 'homebridge';

export class LoggerService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public logDebug(method: string, message: string): void {
    this.logger.log(LogLevel.INFO, message);
  }

  public logError(method: string, message: string): void {
    this.logger.log(LogLevel.ERROR, message);
  }

  public logWarning(method: string, message: string): void {
    this.logger.log(LogLevel.WARN, message);
  }
}