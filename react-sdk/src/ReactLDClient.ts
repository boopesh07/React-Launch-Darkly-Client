import {
  AutoEnvAttributes,
  base64UrlEncode,
  BasicLogger,
  internal,
  LDClientImpl,
  type LDContext,
  type LDOptions,
} from '@launchdarkly/js-client-sdk-common';

import createPlatform from './platform';

/**
 * The React LaunchDarkly client. Instantiate this class to create an
 * instance of the ReactLDClient and pass it to the {@link LDProvider}
 *
 * @example
 * ```tsx
 * const featureClient = new ReactLDClient(CLIENT_ID, AutoEnvAttributes.Enabled);
 *
 * <LDProvider client={featureClient}>
 *   <Welcome />
 * </LDProvider>
 * ```
 */
export default class ReactLDClient extends LDClientImpl {
  clientSideID: string;
  /**
   * Creates an instance of the LaunchDarkly client.
   *
   * @param clientSideID The LaunchDarkly CLIENT_SIDE_ID.
   * @param autoEnvAttributes Enable / disable Auto environment attributes. When enabled, the SDK will automatically
   * provide data about the web environment where the application is running. To learn more,
   * read [Automatic environment attributes](https://docs.launchdarkly.com/sdk/features/environment-attributes).
   * for more documentation.
   * @param options {@link LDOptions} to initialize the client with.
   */
  constructor(clientSideID: string, autoEnvAttributes: AutoEnvAttributes, options: LDOptions = {}) {
    const { logger: customLogger, debug } = options;
    const logger =
      customLogger ??
      new BasicLogger({
        level: debug ? 'debug' : 'info',
        // eslint-disable-next-line no-console
        destination: console.log,
      });

    const internalOptions: internal.LDInternalOptions = {
      analyticsEventPath: `/events/bulk/${clientSideID}`,
      diagnosticEventPath: `/events/diagnostic/${clientSideID}`,
      includeAuthorizationHeader: false,
    };

    super(
      clientSideID,
      autoEnvAttributes,
      createPlatform(logger),
      { ...options, logger },
      internalOptions,
    );
    this.clientSideID = clientSideID;
  }

  override createStreamUriPath(context: LDContext) {
    return `/eval/${this.clientSideID}/${base64UrlEncode(JSON.stringify(context), this.platform.encoding!)}`;
  }


}