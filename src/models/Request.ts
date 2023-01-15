import {Cello} from './Cello';
import {NetworkInfo} from './NetworkInfo';

export class Request {
  public message: string;
  public nounce: number;
  public cello: Cello;
  private networkInfo: NetworkInfo;

  constructor(message: string, nounce: number, cello: Cello, networkInfo: NetworkInfo) {
    this.message = message;
    this.nounce = nounce;
    this.cello = cello;
    this.networkInfo = networkInfo;
  }
}