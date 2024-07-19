import { useEffect, useRef } from 'react';

import { debounce } from '@launchdarkly/js-client-sdk-common';

import { PlatformRequests } from '../platform';
import ReactLDClient from '../ReactLDClient';

/**
 * Manages streamer connection based on visibility state. Debouncing is used to prevent excessive starting
 * and stopping of the EventSource which are expensive.
 *
 * background to active - start streamer.
 * active to background - stop streamer.
 *
 * @param client
 */
const useVisibilityChange = (client: ReactLDClient) => {
    const visibilityState = useRef(document.visibilityState);

    const isEventSourceClosed = () => {
        const { eventSource } = client.platform.requests as PlatformRequests;
        return eventSource?.getStatus() === eventSource?.CLOSED;
    };

    const onChange = () => {
        const currentVisibility = document.visibilityState;
        client.logger.debug(`Document visibility state changed to: ${currentVisibility}`);

        if (visibilityState.current === 'hidden' && currentVisibility === 'visible') {
            if (isEventSourceClosed()) {
                client.logger.debug('Starting streamer after document became visible.');
                client.streamer?.start();
            } else {
                client.logger.debug('Not starting streamer because EventSource is already open.');
            }
        } else if (currentVisibility === 'hidden') {
            client.logger.debug('Document hidden, stopping streamer.');
            client.streamer?.stop();
        } else {
            client.logger.debug('No action needed.');
        }

        visibilityState.current = currentVisibility;
    };

    // debounce with a default delay of 5 seconds.
    const debouncedOnChange = debounce(onChange);

    useEffect(() => {
        document.addEventListener('change', debouncedOnChange);

        return () => {
            document.removeEventListener('visibilitychange', debouncedOnChange);
        };
    }, []);
};

export default useVisibilityChange;
