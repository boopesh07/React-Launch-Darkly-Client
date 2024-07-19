import { AutoEnvAttributes, type LDContext } from '@launchdarkly/js-client-sdk-common';
import ReactLDClient from './ReactLDClient';

describe('ReactLDClient', () => {
    let client: ReactLDClient;

    beforeEach(() => {
        client = new ReactLDClient('client-side-id', AutoEnvAttributes.Enabled, { sendEvents: false });
    });

    test('constructing a new client', () => {
        expect(client).toBeInstanceOf(ReactLDClient);
        expect(client['clientSideID']).toEqual('client-side-id');
        expect(client.config.serviceEndpoints).toEqual({
            analyticsEventPath: '/events/bulk/client-side-id',
            diagnosticEventPath: '/events/diagnostic/client-side-id',
            events: 'https://events.launchdarkly.com',
            includeAuthorizationHeader: false,
            polling: 'https://clientsdk.launchdarkly.com',
            streaming: 'https://clientstream.launchdarkly.com',
        });
    });

    test('createStreamUriPath', () => {
        const context: LDContext = { kind: 'user', key: 'test-user-key-1' };

        expect(client.createStreamUriPath(context)).toEqual(
            '/eval/eyJraW5kIjoidXNlciIsImtleSI6InRlc3QtdXNlci1rZXktMSJ9'
        );
    });

    test('logger is set correctly', () => {
        const customLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        const customLoggerClient = new ReactLDClient('client-side-id', AutoEnvAttributes.Enabled, {
            logger: customLogger,
        });

        expect(customLoggerClient.config.logger).toBe(customLogger);
    });

});
