import {iBricksPlatform} from './iBricksPlatform';
import {HapStatusError} from 'homebridge';

export class Helper {
  public static getCommunicationFailureError(platform: iBricksPlatform): HapStatusError {
    return new platform.api.hap.HapStatusError(platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
  }
}