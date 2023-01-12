import {Logger, LogLevel} from 'homebridge';

export class LoggerService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public logDebug(message: string): void {
    this.logger.log(LogLevel.INFO, message);
  }

  public logError(message: string): void {
    this.logger.log(LogLevel.ERROR, message);
  }

  public logWarning(message: string): void {
    this.logger.log(LogLevel.WARN, message);
  }
}