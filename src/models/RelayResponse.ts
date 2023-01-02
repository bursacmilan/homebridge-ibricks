import {IBricksApiResponse} from './iBricksApiResponse';

export interface RelayResponse extends IBricksApiResponse {
  isOn: boolean;
}