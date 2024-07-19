
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { asyncWithLDProvider, LDContext } from 'launchdarkly-react-client-sdk';
import {
    AutoEnvAttributes,
    LDProvider,
    ReactLDClient,
} from 'react-sdk';

const clientSideID = '668f74573f7fdc105e03929f';

// (async () => {
// Set clientSideID to your own Client-side ID. You can find this in
// your LaunchDarkly portal under Account settings / Projects
// const context: LDContext = {
//     kind: 'user',
//     key: 'test-user-1',
// };

// const LDProvider = await asyncWithLDProvider({
//     clientSideID: process.env.REACT_APP_LD_CLIENT_SIDE_ID ?? '',
//     context,
// });
//668f74573f7fdc105e03929f
const featureClient = new ReactLDClient(clientSideID, AutoEnvAttributes.Enabled);
// Initialise the context.
featureClient.identify({kind: 'user', key: 'test-user-1'},).then(r =>{})

 const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <LDProvider client={featureClient}>
            <App />
        </LDProvider>
    </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//     reportWebVitals();
// })();