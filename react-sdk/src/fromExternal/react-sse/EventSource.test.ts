import ReactEventSource, { backoff, jitter } from './EventSource';
import type { EventSourceEvent, EventType } from './types';

describe('ReactEventSource', () => {
    const uri = 'https://mock.events.uri';
    let eventSource: ReactEventSource;

    beforeAll(() => {
        jest.useFakeTimers();
    });

    beforeEach(() => {
        jest
            .spyOn(Math, 'random')
            .mockImplementationOnce(() => 0.888)
            .mockImplementationOnce(() => 0.999);

        eventSource = new ReactEventSource(uri, { logger: console });
        eventSource.onclose = jest.fn();
        eventSource.open = jest.fn();
        eventSource.onretrying = jest.fn();
    });

    afterEach(() => {
        jest.spyOn(Math, 'random').mockRestore();
        jest.resetAllMocks();
    });

    test('backoff exponentially', () => {
        const delay0 = backoff(1000, 0);
        const delay1 = backoff(1000, 1);
        const delay2 = backoff(1000, 2);

        expect(delay0).toEqual(1000);
        expect(delay1).toEqual(2000);
        expect(delay2).toEqual(4000);
    });

    test('backoff returns max delay', () => {
        const delay = backoff(1000, 5);
        expect(delay).toEqual(30000);
    });

    test('jitter', () => {
        const delay0 = jitter(1000);
        const delay1 = jitter(2000);

        expect(delay0).toEqual(556);
        expect(delay1).toEqual(1001);
    });

    test('getNextRetryDelay', () => {
        // @ts-ignore
        const delay0 = eventSource.getNextRetryDelay();
        // @ts-ignore
        const delay1 = eventSource.getNextRetryDelay();

        // @ts-ignore
        expect(eventSource.retryCount).toEqual(2);
        expect(delay0).toEqual(556);
        expect(delay1).toEqual(1001);
    });

    test('tryConnect force no delay', () => {
        // @ts-ignore
        eventSource.tryConnect(true);
        jest.runAllTimers();

        // expect(logger.debug).toHaveBeenCalledWith(expect.stringMatching(/new connection in 0 ms/i));
        expect(eventSource.onretrying).toHaveBeenCalledWith({ type: 'retry', delayMillis: 0 });
        expect(eventSource.open).toHaveBeenCalledTimes(1);
        expect(eventSource.onclose).toHaveBeenCalledTimes(1);
    });

    test('tryConnect with delay', () => {
        // @ts-ignore
        eventSource.tryConnect();
        jest.runAllTimers();

        // expect(logger.debug).toHaveBeenNthCalledWith(
        //     2,
        //     expect.stringMatching(/new connection in 556 ms/i),
        // );
        expect(eventSource.onretrying).toHaveBeenCalledWith({ type: 'retry', delayMillis: 556 });
        expect(eventSource.open).toHaveBeenCalledTimes(1);
        expect(eventSource.onclose).toHaveBeenCalledTimes(1);
    });

    test('handleEvent processes event data', () => {
        const mockDispatch = jest.spyOn(eventSource as any, 'dispatch');
        const eventData = `data: test message\n\n`;
        // @ts-ignore
        eventSource.handleEvent(eventData);

        expect(mockDispatch).toHaveBeenCalledWith('message', {
            type: 'message',
            data: 'test message',
            url: uri,
            lastEventId: undefined,
        });
    });

    test('addEventListener adds event listener', () => {
        const listener = jest.fn();
        eventSource.addEventListener('message', listener);

        // @ts-ignore
        expect(eventSource.eventHandlers.message).toContain(listener);
    });

    test('removeEventListener removes event listener', () => {
        const listener = jest.fn();
        eventSource.addEventListener('message', listener);
        eventSource.removeEventListener('message', listener);

        // @ts-ignore
        expect(eventSource.eventHandlers.message).not.toContain(listener);
    });

    test('removeAllEventListeners removes all event listeners', () => {
        const listener = jest.fn();
        eventSource.addEventListener('message', listener);
        eventSource.removeAllEventListeners();

        // @ts-ignore
        expect(eventSource.eventHandlers.message).toEqual([]);
    });

    test('dispatch calls correct event handlers', () => {
        const openListener = jest.fn();
        eventSource.addEventListener('open', openListener);
        eventSource.dispatch('open', { type: 'open' });

        expect(openListener).toHaveBeenCalledWith({ type: 'open' });
    });

    // test('close closes the connection and dispatches close event', () => {
    //     const mockClose = jest.spyOn(EventSourceEvent.prototype, 'close');
    //     eventSource.close();

    //     expect(eventSource.getStatus()).toEqual(eventSource.CLOSED);
    //     expect(mockClose).toHaveBeenCalled();
    //     expect(eventSource.onclose).toHaveBeenCalled();
    // });

    test('open sets status to CONNECTING and opens a new connection', () => {
        eventSource.open();

        expect(eventSource.getStatus()).toEqual(eventSource.CONNECTING);
    });

    test('getStatus returns current status', () => {
        expect(eventSource.getStatus()).toEqual(eventSource.CONNECTING);
    });
});
