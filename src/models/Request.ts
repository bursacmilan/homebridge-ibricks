import {Cello} from './Cello';
import {NetworkInfo} from './NetworkInfo';

export class Request {
  public message: string;
  public nounce: number;
  public dateTime: Date;
  public cello: Cello;
  public try = 1;
  private networkInfo: NetworkInfo;

  constructor(message: string, nounce: number, cello: Cello, networkInfo: NetworkInfo) {
    this.message = message;
    this.nounce = nounce;
    this.dateTime = new Date();
    this.cello = cello;
    this.networkInfo = networkInfo;
  }
}