import { render } from '@testing-library/react';
import React, { FC, useEffect } from 'react';
import useVisibilityChange from './useVisibilityChange';
import { debounce } from '@launchdarkly/js-client-sdk-common';
import ReactLDClient from '../ReactLDClient';
import { AutoEnvAttributes } from '@launchdarkly/js-client-sdk-common';

jest.mock('@launchdarkly/js-client-sdk-common', () => {
    const actual = jest.requireActual('@launchdarkly/js-client-sdk-common');
    return {
        ...actual,
        debounce: jest.fn(),
    };
});

const TestComponent: FC<{ client: ReactLDClient }> = ({ client }) => {
    useVisibilityChange(client);
    return ("<div>Test Component < /div>");
};

describe('useVisibilityChange', () => {
    let client: ReactLDClient;
    let mockEventSource: any;

    const eventSourceOpen = 1;
    const eventSourceClosed = 2;

    beforeEach(() => {
        (debounce as jest.Mock).mockImplementation((fn) => fn);

        client = new ReactLDClient('client-side-id', AutoEnvAttributes.Enabled, { logger: console });

        mockEventSource = {
            getStatus: jest.fn(() => eventSourceOpen),
            OPEN: eventSourceOpen,
            CLOSED: eventSourceClosed,
        };

        (client.platform.requests as any) = { eventSource: mockEventSource };

        client.streamer = {
            start: jest.fn(),
            stop: jest.fn(),
            // Mock other necessary properties of StreamingProcessor
        };

        jest.spyOn(React, 'useRef').mockReturnValue({
            current: 'visible',
        });

        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            get: jest.fn(() => 'visible'),
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test('starts streamer when transitioning from hidden to visible', () => {
        render(<TestComponent client={ client } />);
        const visibilityStateMock = jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
        document.dispatchEvent(new Event('visibilitychange'));
        visibilityStateMock.mockReturnValue('visible');
        document.dispatchEvent(new Event('visibilitychange'));
        expect(client.streamer.start).toHaveBeenCalledTimes(1);
        expect(client.streamer.stop).not.toHaveBeenCalled();
    });

    test('does not start streamer when document becomes visible and event source is open', () => {
        (mockEventSource.getStatus as jest.Mock).mockReturnValue(eventSourceOpen);

        render(<TestComponent client={ client } />);
        const visibilityStateMock = jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
        document.dispatchEvent(new Event('visibilitychange'));
        visibilityStateMock.mockReturnValue('visible');
        document.dispatchEvent(new Event('visibilitychange'));
        expect(client.streamer.start).not.toHaveBeenCalled();
        expect(client.streamer.stop).not.toHaveBeenCalled();
    });

    test('stops streamer when document becomes hidden', () => {
        render(<TestComponent client={ client } />);
        const visibilityStateMock = jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
        document.dispatchEvent(new Event('visibilitychange'));
        expect(client.streamer.stop).toHaveBeenCalledTimes(1);
        expect(client.streamer.start).not.toHaveBeenCalled();
    });

    test('no action needed when visibility state does not change', () => {
        render(<TestComponent client={ client } />);
        document.dispatchEvent(new Event('visibilitychange'));
        expect(client.streamer.start).not.toHaveBeenCalled();
        expect(client.streamer.stop).not.toHaveBeenCalled();
    });
});
