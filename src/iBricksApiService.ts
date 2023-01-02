import {iBricksPlatform} from './iBricksPlatform';
import axios from 'axios';
import {PlatformConfig} from 'homebridge';

export class IBricksApiService<TOut, TIn> {

  constructor(private readonly platform: iBricksPlatform, private readonly config: PlatformConfig,
    private readonly deviceType: string, private readonly process: (response: TOut) => void) {
  }

  public async setRemoteData(deviceId: string, data: TIn): Promise<void> {
    this.platform.log.debug(`Setting remote data for ${this.deviceType} with id ${deviceId} to ${JSON.stringify(data)}`);

    try {
      await axios.post(`${this.config.apiBaseUrl}/${this.deviceType}?deviceId=${deviceId}`, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.platform.log.debug(`Set remote data for ${this.deviceType} with id ${deviceId} to ${JSON.stringify(data)}`);
    } catch (e) {
      this.platform.log.error(`Error setting remote data for ${this.deviceType} with id ${deviceId} to ${JSON.stringify(data)}: ${e}`);
      throw e;
    }
  }

  public async getRemoteData(deviceId: string): Promise<TOut> {
    this.platform.log.debug(`Getting remote data for ${this.deviceType} with id ${deviceId}`);

    try {
      const response: TOut = (await axios.get(`${this.config.apiBaseUrl}/${this.deviceType}?deviceId=${deviceId}`)).data;
      this.process(response);

      this.platform.log.debug(`Got remote data for ${this.deviceType} with id ${deviceId}: ${JSON.stringify(response)}`);
      return response;
    } catch (e) {
      this.platform.log.error(`Error getting remote data for ${this.deviceType} with id ${deviceId}: ${e}`);
      throw e;
    }
  }
}