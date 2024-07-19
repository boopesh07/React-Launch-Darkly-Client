import ReactLDClient from '../ReactLDClient';
import setupListeners from './setupListeners';
import { AutoEnvAttributes } from '@launchdarkly/js-client-sdk-common';

jest.mock('../ReactLDClient');

describe('setupListeners', () => {
    let client: ReactLDClient;
    let mockSetState: jest.Mock;

    beforeEach(() => {
        mockSetState = jest.fn();
        client = new ReactLDClient('client-side-id', AutoEnvAttributes.Enabled, {});
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test('change listener is setup', () => {
        setupListeners(client, mockSetState);
        expect(client.on).toHaveBeenCalledWith('change', expect.any(Function));
    });

    test('client is set on change event', () => {
        setupListeners(client, mockSetState);

        const changeHandler = (client.on as jest.Mock).mock.calls[0][1];
        changeHandler();

        expect(mockSetState).toHaveBeenCalledWith({ client });
    });
});
