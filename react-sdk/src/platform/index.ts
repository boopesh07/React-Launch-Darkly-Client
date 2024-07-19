/* eslint-disable max-classes-per-file */
import type {
    Encoding,
    EventName,
    EventSource,
    EventSourceInitDict,
    Info,
    LDLogger,
    Options,
    Platform,
    PlatformData,
    Requests,
    Response,
    SdkData,
    Storage,
} from '@launchdarkly/js-client-sdk-common';

import data from '../../package.json';
import ReactEventSource from '../fromExternal/react-sse';
import { btoa } from '../polyfills';
import { ldApplication, ldEnv, ldContext } from './autoEnv';
import PlatformCrypto from './crypto';
const  { name, version } = data
export class PlatformRequests implements Requests {
    eventSource?: ReactEventSource<EventName>;

    constructor(private readonly logger: LDLogger) { }

    createEventSource(url: string, eventSourceInitDict: EventSourceInitDict): EventSource {
        this.eventSource = new ReactEventSource<EventName>(url, {
            headers: eventSourceInitDict.headers,
            retryAndHandleError: eventSourceInitDict.errorFilter,
            logger: this.logger,
        });

        return this.eventSource;
    }

    fetch(url: string, options?: Options): Promise<Response> {
        // @ts-ignore
        return fetch(url, options);
    }
}

class PlatformEncoding implements Encoding {
    btoa(data: string): string {
        return btoa(data);
    }
}

class PlatformInfo implements Info {
    constructor(private readonly logger: LDLogger) { }

    platformData(): PlatformData {
        const data = {
            name: 'React Web App',
            ld_application: ldApplication,
            ld_device: ldEnv,
            ldContext: ldContext
        };

        this.logger.debug(`platformData: ${JSON.stringify(data, null, 2)}`);
        return data;
    }

    sdkData(): SdkData {
        const data = {
            name: name,
            version: version
        };

        this.logger.debug(`sdkData: ${JSON.stringify(data, null, 2)}`);
        return data;
    }
}

class PlatformStorage implements Storage {
    constructor(private readonly logger: LDLogger) { }
    async clear(key: string): Promise<void> {
        localStorage.removeItem(key);
    }

    async get(key: string): Promise<string | null> {
        try {
            const value = localStorage.getItem(key);
            return value ?? null;
        } catch (error) {
            this.logger.error(`Error getting AsyncStorage key: ${key}, error: ${error}`);
            return null;
        }
    }

    async set(key: string, value: string): Promise<void> {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            this.logger.error(`Error saving AsyncStorage key: ${key}, value: ${value}, error: ${error}`);
        }
    }
}

const createPlatform = (logger: LDLogger): Platform => ({
    crypto: new PlatformCrypto(),
    info: new PlatformInfo(logger),
    requests: new PlatformRequests(logger),
    encoding: new PlatformEncoding(),
    storage: new PlatformStorage(logger),
});

export default createPlatform;