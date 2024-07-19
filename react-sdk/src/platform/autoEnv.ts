
import type {LDApplication, LDDevice, LDContext} from '@launchdarkly/js-client-sdk-common';
import locale from './locale';
export const ldApplication: LDApplication = {
    key: '',
    envAttributesVersion: '1.0',
    locale,
    id: '',
    name: '',
    version: '',
    versionName: '',
};

export const ldEnv: LDDevice = {
    key: '',
    envAttributesVersion: '1.0',
};

export const ldContext: LDContext = {
    kind:"",
    key:''
}


