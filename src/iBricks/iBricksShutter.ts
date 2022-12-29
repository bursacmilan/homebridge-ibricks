import axios from 'axios';
import {iBricksPlatform} from '../iBricksPlatform';
import {ShutterRequest} from '../models/ShutterRequest';
import {ShutterResponse} from '../models/ShutterResponse';

export class iBricksShutter {
  constructor(private readonly deviceId: string, private readonly config: any, private readonly platform: iBricksPlatform) {

  }

  public async setRemoteData(value: ShutterRequest): Promise<void> {
    this.platform.log.debug('Setting remote data for shutter with id ' + this.deviceId + ' to ' + JSON.stringify(value));

    try {
      await axios.post(`${this.config.apiBaseUrl}/Shutter?deviceId=${this.deviceId}`, value, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.platform.log.debug('Set remote data for shutter with id ' + this.deviceId + ' to ' + JSON.stringify(value));
    } catch (e) {
      this.platform.log.error('Error setting remote data for shutter with id ' + this.deviceId + ' to ' + JSON.stringify(value) + ': ' + e);
      throw e;
    }
  }

  public async getRemoteData(): Promise<ShutterResponse> {
    this.platform.log.debug('Getting remote data for shutter with id ' + this.deviceId);

    try {
      const response: ShutterResponse = (await axios.get(`${this.config.apiBaseUrl}/Shutter?deviceId=${this.deviceId}`)).data;

      response.lamellaTarget = Math.round((response.lamellaTarget / 100 * 180) - 90);
      response.lamella = Math.round((response.lamella / 100 * 180) - 90);

      this.platform.log.debug('Got remote data for shutter with id ' + this.deviceId + ': ' + JSON.stringify(response));
      return response;
    } catch (e) {
      this.platform.log.error('Error getting remote data for shutter with id ' + this.deviceId + ': ' + e);
      throw e;
    }
  }
}