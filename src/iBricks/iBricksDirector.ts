import {iBricksPlatform} from '../iBricksPlatform';
import axios from 'axios';
import {DirectorResponse} from '../models/DirectorResponse';
import {DirectorRequest} from '../models/DirectorRequest';

export class IBricksDirector {
  constructor(private readonly deviceId: string, private readonly config: any, private readonly platform: iBricksPlatform) {

  }

  public async setRemoteData(value: DirectorRequest): Promise<void> {
    this.platform.log.debug('Setting remote state for director with id ' + this.deviceId + ' to ' + value);

    try {
      await axios.post(`${this.config.apiBaseUrl}/Directors?deviceId=${this.deviceId}`, value, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.platform.log.debug('Set remote state for director with id ' + this.deviceId + ' to ' + JSON.stringify(value));
    } catch (e) {
      this.platform.log.error('Error setting remote state for director with id ' + this.deviceId
        + ' to ' + JSON.stringify(value) + ': ' + e);

      throw e;
    }
  }

  public async getRemoteData(): Promise<DirectorResponse> {
    this.platform.log.debug('Getting remote state for director with id ' + this.deviceId);

    try {
      const response: DirectorResponse = (await axios.get(`${this.config.apiBaseUrl}/Directors?deviceId=${this.deviceId}`)).data;

      this.platform.log.debug('Got remote state for director with id ' + this.deviceId + ': ' + JSON.stringify(response));
      return response;
    } catch (e) {
      this.platform.log.error('Error getting remote state for director with id ' + this.deviceId + ': ' + e);
      throw e;
    }
  }
}