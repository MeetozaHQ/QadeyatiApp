// Custom polyfill for node:async_hooks that works in both server and browser environments.
// It bypasses static compilation loops and provides correct default/named export interfaces.

const isNode = typeof process !== "undefined" && process.versions && process.versions.node;

const nodeHookName = "node:async_hooks";
const nativeModule = isNode
  ? await import(/* @vite-ignore */ nodeHookName).catch(() => null)
  : null;

export const AsyncLocalStorage =
  nativeModule?.AsyncLocalStorage ||
  class AsyncLocalStorage<T> {
    disable() {}
    getStore() {
      return undefined;
    }
    run<R>(store: T, callback: (...args: unknown[]) => R, ...args: unknown[]): R {
      return callback(...args);
    }
  };

export const AsyncResource =
  nativeModule?.AsyncResource ||
  class AsyncResource {
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
  };

export const createHook =
  nativeModule?.createHook ||
  function createHook() {
    return {
      enable() {},
      disable() {},
    };
  };
export const executionAsyncId =
  nativeModule?.executionAsyncId ||
  function executionAsyncId() {
    return 0;
  };
export const triggerAsyncId =
  nativeModule?.triggerAsyncId ||
  function triggerAsyncId() {
    return 0;
  };

const defaultExport = {
  AsyncLocalStorage,
  AsyncResource,
  createHook,
  executionAsyncId,
  triggerAsyncId,
};

export default defaultExport;
