import {IBricksApiResponse} from './iBricksApiResponse';

export interface DirectorResponse extends IBricksApiResponse {
  currentTemperature: number;
  targetTemperature: number;
}