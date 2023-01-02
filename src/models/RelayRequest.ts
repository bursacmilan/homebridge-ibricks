import {IBricksApiRequest} from './iBricksApiRequest';

export class RelayRequest extends IBricksApiRequest {
  public isOn: boolean;

  constructor(isOn: boolean) {
    super();
    this.isOn = isOn;
  }
}