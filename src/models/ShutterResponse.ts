import {IBricksApiResponse} from './iBricksApiResponse';

export interface ShutterResponse extends IBricksApiResponse {
    lamella: number;
    lamellaTarget: number;
    shutter: number;
    shutterTarget: number;
    shutterDirection: number;
}