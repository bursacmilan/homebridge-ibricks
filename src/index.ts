import { API } from 'homebridge';
import { PLATFORM_NAME } from './settings';
import {IbricksPlatform} from './ibricks-platform';

/**
 * This method registers the platform with Homebridge
 */
export = (api: API): void => {
  api.registerPlatform(PLATFORM_NAME, IbricksPlatform);
};
