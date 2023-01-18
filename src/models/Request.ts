import {Cello} from './Cello';
import {Message} from './Message';

export class Request {
  public message: Message;
  public cello: Cello;

  constructor(message: Message, cello: Cello) {
    this.message = message;
    this.cello = cello;
  }
}