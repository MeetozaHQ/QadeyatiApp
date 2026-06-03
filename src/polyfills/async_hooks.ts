// Custom polyfill for node:async_hooks that works in the browser.
// It provides static fallback implementations of the required interfaces with zero imports.

export class AsyncLocalStorage<T> {
  disable() {}
  getStore() {
    return undefined;
  }
  run<R>(store: T, callback: (...args: unknown[]) => R, ...args: unknown[]): R {
    return callback(...args);
  }
}

export class AsyncResource {
  static bind<F extends (...args: unknown[]) => unknown>(fn: F): F {
    return fn;
  }
  runInAsyncScope<thisArgType, R>(
    fn: (this: thisArgType, ...args: unknown[]) => R,
    thisArg: thisArgType,
    ...args: unknown[]
  ): R {
    return fn.call(thisArg, ...args);
  }
}

export function createHook() {
  return {
    enable() {},
    disable() {},
  };
}

export function executionAsyncId() {
  return 0;
}

export function triggerAsyncId() {
  return 0;
}

const defaultExport = {
  AsyncLocalStorage,
  AsyncResource,
  createHook,
  executionAsyncId,
  triggerAsyncId,
};

export default defaultExport;
