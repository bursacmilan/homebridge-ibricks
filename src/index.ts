import { API } from 'homebridge';
import { PLATFORM_NAME } from './settings';
import { IbricksPlatform } from './ibricks-platform';
import eventsource from 'eventsource';

/**
 * This method registers the platform with Homebridge
 */

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
global.EventSource = eventsource;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export = (api: API): void => {
    api.registerPlatform(PLATFORM_NAME, IbricksPlatform);
};
