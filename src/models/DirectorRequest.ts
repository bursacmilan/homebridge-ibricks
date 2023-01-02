import {IBricksApiRequest} from './iBricksApiRequest';

export class DirectorRequest extends IBricksApiRequest {
  public value: number;

  constructor(value: number) {
    super();
    this.value = value;
  }
}