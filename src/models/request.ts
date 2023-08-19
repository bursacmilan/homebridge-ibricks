import { Cello } from './cello';
import { Message } from './message';

export class Request {
    public message: Message;
    public cello: Cello;

    constructor(message: Message, cello: Cello) {
        this.message = message;
        this.cello = cello;
    }
}
