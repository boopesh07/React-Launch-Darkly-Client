import type { EventSourceEvent, EventSourceListener, EventSourceOptions, EventType } from './types';

const defaultOptions: EventSourceOptions = {
    body: undefined,
    headers: {},
    method: 'GET',
    timeout: 0,
    withCredentials: false,
    retryAndHandleError: undefined,
    initialRetryDelayMillis: 1000,
    logger: undefined,
};

const maxRetryDelay = 30 * 1000; // Maximum retry delay 30 seconds.
const jitterRatio = 0.5; // Delay should be 50%-100% of calculated time.

export function backoff(base: number, retryCount: number) {
    const delay = base * Math.pow(2, retryCount);
    return Math.min(delay, maxRetryDelay);
}

export function jitter(computedDelayMillis: number) {
    return computedDelayMillis - Math.trunc(Math.random() * jitterRatio * computedDelayMillis);
}

export default class ReactEventSource<E extends string = never> {
    ERROR = -1;
    CONNECTING = 0;
    OPEN = 1;
    CLOSED = 2;

    private lastEventId: undefined | string;
    private lastIndexProcessed = 0;
    private eventType: undefined | EventType<E>;
    private status = this.CONNECTING;
    private eventHandlers: any = {
        open: [],
        message: [],
        error: [],
        close: [],
    };

    private withCredentials: boolean;
    private url: string;
    private eventSource: EventSource | null = null;
    private pollTimer: any;
    private retryAndHandleError?: (err: any) => boolean;
    private initialRetryDelayMillis: number = 1000;
    private retryCount: number = 0;
    private logger?: any;

    constructor(url: string, options?: EventSourceOptions) {
        const opts = {
            ...defaultOptions,
            ...options,
        };

        this.url = url;
        this.withCredentials = opts.withCredentials!;
        this.retryAndHandleError = opts.retryAndHandleError;
        this.initialRetryDelayMillis = opts.initialRetryDelayMillis!;
        this.logger = opts.logger;

        this.tryConnect(true);
    }

    private getNextRetryDelay() {
        const delay = jitter(backoff(this.initialRetryDelayMillis, this.retryCount));
        this.retryCount += 1;
        return delay;
    }

    private tryConnect(forceNoDelay: boolean = false) {
        let delay = forceNoDelay ? 0 : this.getNextRetryDelay();
        this.logger?.debug(`[ReactEventSource] Will open new connection in ${delay} ms.`);
        this.dispatch('retry', { type: 'retry', delayMillis: delay });
        this.pollTimer = setTimeout(() => {
            this.close();
            this.open();
        }, delay);
    }

    open() {
        try {
            this.lastIndexProcessed = 0;
            this.status = this.CONNECTING;

            const eventSourceInit: EventSourceInit = {
                withCredentials: this.withCredentials,
            };

            const urlWithParams = new URL(this.url);
            if (this.lastEventId) {
                urlWithParams.searchParams.set('lastEventId', this.lastEventId);
            }

            this.eventSource = new EventSource(urlWithParams.toString(), eventSourceInit);

            this.eventSource.onopen = () => {
                this.status = this.OPEN;
                this.retryCount = 0;
                this.dispatch('open', { type: 'open' });
                this.logger?.debug('[ReactEventSource][onopen] Connection opened.');
            };

            this.eventSource.onmessage = (event) => {
                this.handleEvent(event.data);
            };

            this.eventSource.onerror = (event) => {
                this.status = this.ERROR;

                // Simulate xhrStatus based on event and readyState
                const xhrStatus = this.eventSource?.readyState === EventSource.CLOSED ? 0 : 500; // Assuming 500 for error state, 0 for closed
                const xhrState = this.eventSource?.readyState ?? 0;

                this.dispatch('error', {
                    type: 'error',
                    message: event.type,
                    xhrStatus: xhrStatus,
                    xhrState: xhrState,
                });

                if (this.eventSource?.readyState === EventSource.CLOSED) {
                    this.logger?.debug('[ReactEventSource][onerror] Connection closed, retrying.');
                    if (!this.retryAndHandleError) {
                        this.tryConnect();
                    } else {
                        const shouldRetry = this.retryAndHandleError({
                            status: xhrStatus,
                            message: event.type,
                        });

                        if (shouldRetry) {
                            this.tryConnect();
                        }
                    }
                }
            };

        } catch (e: any) {
            this.status = this.ERROR;
            this.dispatch('error', {
                type: 'exception',
                message: e.message,
                error: e,
            });
        }
    }

    private handleEvent(response: string) {
        const parts = response.slice(this.lastIndexProcessed).split('\n');

        const indexOfDoubleNewline = response.lastIndexOf('\n\n');
        if (indexOfDoubleNewline !== -1) {
            this.lastIndexProcessed = indexOfDoubleNewline + 2;
        }

        let data: string[] = [];
        let retry = 0;
        let line = '';

        for (let i = 0; i < parts.length; i++) {
            line = parts[i].replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, '');
            if (line.indexOf('event') === 0) {
                this.eventType = line.replace(/event:?\s*/, '') as EventType<E>;
            } else if (line.indexOf('retry') === 0) {
                retry = parseInt(line.replace(/retry:?\s*/, ''), 10);
                if (!Number.isNaN(retry)) {
                    // GOTCHA: Ignore the server retry recommendation. Use our own custom getNextRetryDelay logic.
                    // this.pollingInterval = retry;
                }
            } else if (line.indexOf('data') === 0) {
                data.push(line.replace(/data:?\s*/, ''));
            } else if (line.indexOf('id:') === 0) {
                this.lastEventId = line.replace(/id:?\s*/, '');
            } else if (line.indexOf('id') === 0) {
                this.lastEventId = undefined;
            } else if (line === '') {
                if (data.length > 0) {
                    const eventType = this.eventType || 'message';
                    const event: any = {
                        type: eventType,
                        data: data.join('\n'),
                        url: this.url,
                        lastEventId: this.lastEventId,
                    };

                    this.dispatch(eventType, event);

                    data = [];
                    this.eventType = undefined;
                }
            }
        }
    }

    addEventListener<T extends EventType<E>>(type: T, listener: EventSourceListener<E, T>): void {
        if (this.eventHandlers[type] === undefined) {
            this.eventHandlers[type] = [];
        }

        this.eventHandlers[type].push(listener);
    }

    removeEventListener<T extends EventType<E>>(type: T, listener: EventSourceListener<E, T>): void {
        if (this.eventHandlers[type] !== undefined) {
            this.eventHandlers[type] = this.eventHandlers[type].filter(
                (handler: EventSourceListener<E, T>) => handler !== listener,
            );
        }
    }

    removeAllEventListeners<T extends EventType<E>>(type?: T) {
        const availableTypes = Object.keys(this.eventHandlers);

        if (type === undefined) {
            availableTypes.forEach((eventType) => {
                this.eventHandlers[eventType] = [];
            });
        } else {
            if (!availableTypes.includes(type)) {
                throw Error(`[ReactEventSource] '${type}' type is not supported event type.`);
            }

            this.eventHandlers[type] = [];
        }
    }

    dispatch<T extends EventType<E>>(type: T, data: EventSourceEvent<T>) {
        this.eventHandlers[type]?.forEach((handler: EventSourceListener<E, T>) => handler(data));

        switch (type) {
            case 'open':
                this.onopen();
                break;
            case 'close':
                this.onclose();
                break;
            case 'error':
                this.logger?.debug(`[ReactEventSource][dispatch][ERROR]: ${JSON.stringify(data)}`);
                this.onerror(data);
                break;
            case 'retry':
                this.onretrying(data);
                break;
            default:
                break;
        }
    }

    close() {
        this.status = this.CLOSED;
        clearTimeout(this.pollTimer);
        this.eventSource?.close();

        this.dispatch('close', { type: 'close' });
    }

    getStatus() {
        return this.status;
    }

    onopen() { }
    onclose() { }
    onerror(_err: any) { }
    onretrying(_e: any) { }
}
