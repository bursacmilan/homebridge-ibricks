export class Message {
  public protocol: string;
  public addressFrom: string;
  public addressTo: string;
  public nonce: string;
  public type: string;
  public command: string;
  public channel: number | undefined;
  public additionalData: Map<string, string>;

  constructor(protocol: string, af: string, at: string, n: string,
    type: string, command: string, channel: string, additionalData: Map<string, string>) {

    this.protocol = protocol;
    this.addressFrom = af;
    this.addressTo = at;
    this.nonce = n;
    this.type = type;
    this.command = command;
    this.additionalData = additionalData;
    this.channel = Message.parseStringToNumber(channel);
  }

  public isEventWithCommand(command: string): boolean {
    return this.type === 'E' && this.command === command;
  }

  public isEventWithCommandAndData(command: string, additionalDataKey: string, additionalDataValue: string): boolean {
    return this.isEventWithCommand(command) &&
      this.additionalData.get(additionalDataKey) !== undefined &&
      this.additionalData.get(additionalDataKey)!.startsWith(additionalDataValue);
  }

  public getNumber(additionalDataKey: string): number | undefined {
    const data = this.additionalData.get(additionalDataKey);
    return Message.parseStringToNumber(data);
  }

  public getString(additionalDataKey: string): string | undefined {
    return this.additionalData.get(additionalDataKey);
  }

  public getMessageAsString(): string {
    let message = `${this.protocol}|AF=${this.addressFrom}|AT=${this.addressTo}|N=${this.nonce}|${this.type}|${this.command}`;
    if(this.channel) {
      message += `|CH=${this.channel}`;
    }

    this.additionalData.forEach((value, key) => {
      message += `|${key}=${value}`;
    });

    return message;
  }

  private static parseStringToNumber(data: string | undefined): number | undefined {
    const dataAsNumber = data ? Number(data) : NaN;
    return isNaN(dataAsNumber) ? undefined : dataAsNumber;
  }
}