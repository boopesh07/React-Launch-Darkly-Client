import React from 'react';
import { useState } from 'react';
// import logo from './logo.svg';
import './App.css';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { ConnectionMode } from '@launchdarkly/js-client-sdk-common';
import { useBoolVariation, useLDClient } from 'react-sdk';
function App() {
    const [flagKey, setFlagKey] = useState('sample-feature');
    const [userKey, setUserKey] = useState('test-user-1');
    const flagValue = useBoolVariation(flagKey, false);
    const userContext = { kind: 'user', key: 'test-user-1' };

    // const flagValue = false;
    const ldc = useLDClient();

    ldc
        .identify(userContext, { timeout: 5 })
        .catch((e: any) => console.error(`error identifying ${userKey}: ${e}`));

    const context = ldc.getContext() ?? userContext;



    return (
        <div className="App">
            <header className="App-header">
                {/* <img src={logo} className="App-logo" alt="logo" /> */}
                <p>{flagValue ? <b>Flag on</b> : <b>Flag off</b>}</p>
                <a className="App-link" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
                    Learn React
                </a>
            </header>
        </div>
    );
}

export default App;