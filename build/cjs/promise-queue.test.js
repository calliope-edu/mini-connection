"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const promise_queue_js_1 = require("./promise-queue.js");
(0, vitest_1.describe)("PromiseQueue", () => {
    (0, vitest_1.it)("waits for previous items", async () => {
        const sequence = [];
        const queue = new promise_queue_js_1.PromiseQueue();
        queue.add(async () => {
            (0, vitest_1.expect)(sequence).toEqual([]);
            sequence.push(1);
        });
        queue.add(async () => {
            (0, vitest_1.expect)(sequence).toEqual([1]);
            sequence.push(2);
        });
        (0, vitest_1.expect)(await queue.add(async () => {
            (0, vitest_1.expect)(sequence).toEqual([1, 2]);
            sequence.push(3);
            return 3;
        })).toEqual(3);
        (0, vitest_1.expect)(sequence).toEqual([1, 2, 3]);
    });
    (0, vitest_1.it)("copes with errors", async () => {
        const queue = new promise_queue_js_1.PromiseQueue();
        const sequence = [];
        const p1 = queue.add(() => {
            sequence.push(1);
            throw new Error("Oops");
        });
        const p2 = queue.add(() => {
            sequence.push(2);
            return Promise.resolve(2);
        });
        (0, vitest_1.expect)(await p2).toEqual(2);
        await (0, vitest_1.expect)(p1).rejects.toThrow("Oops");
        (0, vitest_1.expect)(sequence).toEqual([1, 2]);
    });
    (0, vitest_1.it)("clears", async () => {
        const queue = new promise_queue_js_1.PromiseQueue();
        const rejected = [];
        const p1 = queue.add(() => new Promise((resolve) => setTimeout(resolve, 1000)));
        const p2 = queue.add(() => new Promise((resolve) => setTimeout(resolve, 1000)));
        const p3 = queue.add(() => new Promise((resolve) => setTimeout(resolve, 1000)));
        p1.catch(() => rejected.push(p1));
        p2.catch(() => rejected.push(p2));
        p3.catch(() => rejected.push(p3));
        queue.clear(() => new Error("Cleared!"));
        await (0, vitest_1.expect)(p2).rejects.toThrow("Cleared!");
        await (0, vitest_1.expect)(p3).rejects.toThrow("Cleared!");
        (0, vitest_1.expect)(rejected).toEqual([p2, p3]);
    });
    (0, vitest_1.it)("detects abort", async () => {
        let abort = false;
        const queue = new promise_queue_js_1.PromiseQueue({
            abortCheck: () => (abort ? () => new Error("Aborted") : undefined),
        });
        const p1 = queue.add(async () => {
            abort = true;
        });
        const p2 = queue.add(async () => {
            throw new Error("Does not happen");
        });
        (0, vitest_1.expect)(await p1).toBeUndefined();
        await (0, vitest_1.expect)(p2).rejects.toThrow("Aborted");
    });
});
//# sourceMappingURL=promise-queue.test.js.map