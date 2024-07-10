let ConditionalLocalStorage: any;

try {
    ConditionalLocalStorage = window.localStorage;
} catch (e) {
    // Use a mock if localStorage is unavailable
    ConditionalLocalStorage = {
        getItem: (_key: string) => Promise.resolve(null),
        setItem: (_key: string, _value: string) => Promise.resolve(),
        removeItem: (_key: string) => Promise.resolve(),
    };
}

export default ConditionalLocalStorage;
