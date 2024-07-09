# Coding challenge for JS SDK engineers

## Overview

Our javascript sdks live in the [js-core](https://github.com/launchdarkly/js-core/tree/main/packages/sdk) monorepo. This repo uses yarn 4 workspaces. 

There are two main sdk types: client and server sdks. For example, react-native is a client sdk and server-node is a server sdk. The rest of the sdks akamai, cloudflare and vercel are edge sdks which are subclasses of the server sdk. We are currently in process of moving all our js sdks to this monorepo. This is wip so there are notable absentees like the react and js sdks.

## Challenge

Your challenge is to implement a new sdk using existing ones as a guide. The choice of sdk to implement is up to you. We recommend picking a browser client sdk like the js, vue or react sdk using the react-native sdk as a guide. Client sdks are  simpler to implement than server sdks.

Your client should extend [LDClientImpl](https://github.com/launchdarkly/js-core/blob/main/packages/shared/sdk-client/src/LDClientImpl.ts#L34) and use these values:

```ts
export default class YourClient extends LDClientImpl {
    // Use these internalOptions and streamUri override for your client sdk
    const internalOptions: internal.LDInternalOptions = {
        analyticsEventPath: `/events/bulk/${clientSideID}`,
        diagnosticEventPath: `/events/diagnostic/${clientSideID}`,
        includeAuthorizationHeader: false,
    };
        
    override createStreamUriPath(context: LDContext) {
        return `/eval/${clientSideID}/${base64UrlEncode(JSON.stringify(context), this.platform.encoding!)}`;
    }
}
```

The majority of the focus should be on implementing the [Platform](https://github.com/launchdarkly/js-core/blob/main/packages/shared/common/src/api/platform/Platform.ts#L8) interface.

## Assessment guideline

At minimum, your sdk must fulfill these requirements:

* The sdk must be idiomatic to the framework. For example, a React SDK should have a Provider and use the context api and hooks.
* The sdk must be able to initialize successfully.
* The sdk must be able to evaluate flags.
* The sdk must be able to subscribe to flag changes.
* Please use Typescript in your solution.
* Follow the existing eslint and prettier rules.
* Some basic unit tests to demonstrate best practices.
* No external dependencies. If you must add one, you must provide clear reasoning explaining its necessity.
* Provide a basic example demonstrating the usage of the sdk.

## Bonus points

Part of Platform, You need to implement the [Requests interface](https://github.com/launchdarkly/js-core/blob/main/packages/shared/common/src/api/platform/Requests.ts#L84) which needs an EventSource. You could use the built-in browser EventSource, or for bonus points implement a custom one in TypeScript which allows custom request headers and specifying the http method.
