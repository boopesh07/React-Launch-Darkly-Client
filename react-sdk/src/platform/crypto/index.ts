import type { Crypto, Hmac } from '@launchdarkly/js-client-sdk-common';

import PlatformHasher from './PlatformHasher';
import { SupportedHashAlgorithm } from './types';

/**
 * Generates a UUID.
 */
function uuidv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Uses SubtleCrypto for hashing and HMAC operations.
 */
export default class PlatformCrypto implements Crypto {
    createHash(algorithm: SupportedHashAlgorithm): PlatformHasher {
        return new PlatformHasher(algorithm);
    }

    createHmac(algorithm: SupportedHashAlgorithm, key: string): Hmac {
        return new PlatformHasher(algorithm, key);
    }

    randomUUID(): string {
        return uuidv4();
    }
}
