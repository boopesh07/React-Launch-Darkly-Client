import React, { PropsWithChildren, useEffect, useState } from 'react';

import ReactLDClient from '../ReactLDClient';
import { Provider, ReactContext } from './reactContext';
import setupListeners from './setupListeners';
import useVisibilityChange from './useVisibilityChange';

type LDProps = {
    client: ReactLDClient
};

/**
 * This is the LaunchDarkly Provider which uses the React context to store
 * and pass data to child components through hooks.
 *
 * @param client The ReactLDClient object. Initialize this object separately
 * and then set this prop when declaring the LDProvider.
 * @param children
 *
 * @constructor
 */
const LDProvider = ({ client, children }: PropsWithChildren<LDProps>) => {
    const [state, setState] = useState<ReactContext>({ client });

    useEffect(() => {
        setupListeners(client, setState);
    }, [client]);

    useVisibilityChange(client);

    return <Provider value={state}>{children}</Provider>;
};

export default LDProvider;
