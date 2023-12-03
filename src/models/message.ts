export class Message {
    public protocol: string;
    public addressFrom: string;
    public addressTo: string;
    public nonce: string;
    public type: string;
    public command: string;
    public channel: number;
    public additionalData: Map<string, string>;

    constructor(
        protocol: string,
        af: string,
        at: string,
        n: string,
        type: string,
        command: string,
        channel: string,
        additionalData: Map<string, string>,
    ) {
        this.protocol = protocol;
        this.addressFrom = af;
        this.addressTo = at;
        this.nonce = n;
        this.type = type;
        this.command = command;
        this.additionalData = additionalData;
        this.channel = Message._parseStringToNumber(channel);
    }

    public isEventWithCommand(command: string): boolean {
        return this.type === 'E' && this.command === command;
    }

    public isEventWithCommandAndData(command: string, additionalDataKey: string, additionalDataValue: string): boolean {
        return this.isEventWithCommand(command) && (this.additionalData.get(additionalDataKey)?.startsWith(additionalDataValue) ?? false);
    }

    public getNumber(additionalDataKey: string): number | undefined {
        const data = this.additionalData.get(additionalDataKey);
        return Message._parseStringToNumber(data);
    }

    public getString(additionalDataKey: string): string | undefined {
        return this.additionalData.get(additionalDataKey);
    }

    public getMessageAsString(): string {
        let message = `${this.protocol}|AF=${this.addressFrom}|AT=${this.addressTo}|N=${this.nonce}|${this.type}|${this.command}`;
        if (this.channel !== -1) {
            message += `|CH=${this.channel}`;
        }

        this.additionalData.forEach((value, key) => {
            message += `|${key}=${value}`;
        });

        return message;
    }

    private static _parseStringToNumber(data: string | undefined): number {
        const dataAsNumber = data ? Number(data) : NaN;
        return isNaN(dataAsNumber) ? -1 : dataAsNumber;
    }
}
