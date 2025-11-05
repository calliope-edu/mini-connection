interface Options {
    /**
     * If we should clear the queue return a function to create errors to reject all promises.
     * Otherwise return undefined. Called before processing each entry.
     */
    abortCheck?: () => (() => Error) | undefined;
}
export declare class PromiseQueue {
    private busy;
    private entries;
    private abortCheck;
    constructor(options?: Options);
    /**
     * Queue an action.
     *
     * @param action Async action to perform.
     * @returns A promise that resolves when all prior added actions and this action have been performed.
     */
    add<T>(action: () => Promise<T>): Promise<T>;
    private processQueue;
    /**
     * Skips any queued actions that aren't in progress and rejects their
     * promises with errors created with the supplied function.
     */
    clear(rejection: () => Error): void;
}
export {};
