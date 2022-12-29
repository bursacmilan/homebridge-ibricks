import axios from 'axios';
import {iBricksPlatform} from '../iBricksPlatform';
import {RelayResponse} from '../models/RelayResponse';
import {RelayRequest} from '../models/RelayRequest';

export class iBricksRelay {
  constructor(private readonly deviceId: string, private readonly config: any, private readonly platform: iBricksPlatform) {

  }

  public async setRemoteData(value: RelayRequest): Promise<void> {
    this.platform.log.debug('Setting remote state for relay with id ' + this.deviceId + ' to ' + JSON.stringify(value));

    try {
      await axios.post(`${this.config.apiBaseUrl}/Relais?deviceId=${this.deviceId}`, value, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.platform.log.debug('Set remote state for relay with id ' + this.deviceId + ' to ' + JSON.stringify(value));
    } catch (e) {
      this.platform.log.error('Error setting remote state for relay with id ' + this.deviceId + ' to ' + JSON.stringify(value) + ': ' + e);
      throw e;
    }
  }

  public async getRemoteData(): Promise<RelayResponse> {
    this.platform.log.debug('Getting remote state for relay with id ' + this.deviceId);

    try {
      const response: RelayResponse = (await axios.get(`${this.config.apiBaseUrl}/Relais?deviceId=${this.deviceId}`)).data;

      this.platform.log.debug('Got remote state for relay with id ' + this.deviceId + ': ' + JSON.stringify(response));
      return response;
    } catch (e) {
      this.platform.log.error('Error getting remote state for relay with id ' + this.deviceId + ': ' + e);
      throw e;
    }
  }
}