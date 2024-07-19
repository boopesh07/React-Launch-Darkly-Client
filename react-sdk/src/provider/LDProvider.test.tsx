import { render } from '@testing-library/react';
import ReactLDClient from '../ReactLDClient';
import LDProvider from './LDProvider';
import setupListeners from './setupListeners';
import useVisibilityChange from './useVisibilityChange';
import { useLDClient } from '../hooks';
import { AutoEnvAttributes } from '@launchdarkly/js-client-sdk-common';

jest.mock('./setupListeners');
jest.mock('./useVisibilityChange');
jest.mock('../ReactLDClient');
jest.mock('../hooks');

const TestApp = () => {
    const ldClient = useLDClient();
    return (
        <>
            <p>ldClient {ldClient ? 'defined' : 'undefined'}</p>
        </>
    );
};

describe('LDProvider', () => {
    let client: ReactLDClient;
    const mockSetupListeners = setupListeners as jest.Mock;
    const mockUseVisibilityChange = useVisibilityChange as jest.Mock;
    const mockUseLDClient = useLDClient as jest.Mock;

    beforeEach(() => {
        jest.useFakeTimers();

        (ReactLDClient as jest.Mock).mockImplementation(() => ({
            clientSideID: 'client-side-id',
            on: jest.fn(),
            off: jest.fn(),
            track: jest.fn(),
        }));

        mockSetupListeners.mockImplementation((client: ReactLDClient, setState: any) => {
            setState({ client });
        });

        mockUseVisibilityChange.mockImplementation(() => { });

        mockUseLDClient.mockImplementation(() => client);

        client = new ReactLDClient('client-side-id', AutoEnvAttributes.Enabled, {});
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test('client is correctly set', () => {
        const { getByText } = render(
            <LDProvider client={client}>
                <TestApp />
            </LDProvider>,
        );

        expect(getByText(/ldclient defined/i)).toBeTruthy();
    });

    test('setupListeners is called with client', () => {
        render(
            <LDProvider client={client}>
                <TestApp />
            </LDProvider>,
        );

        expect(mockSetupListeners).toHaveBeenCalledWith(client, expect.any(Function));
    });

    test('useVisibilityChange is called with client', () => {
        render(
            <LDProvider client={client}>
                <TestApp />
            </LDProvider>,
        );

        expect(mockUseVisibilityChange).toHaveBeenCalledWith(client);
    });
});
