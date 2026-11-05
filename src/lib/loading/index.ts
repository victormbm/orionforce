export type LoadingKind = "data" | "action" | "navigation";
export type LoadingSnapshot = { pending: number; actions: number };
const EMPTY: LoadingSnapshot = { pending: 0, actions: 0 };

export function createLoadingStore() {
  const operations = new Map<symbol, LoadingKind>();
  const listeners = new Set<() => void>();
  let snapshot = EMPTY;
  function publish() {
    snapshot = { pending: operations.size, actions: [...operations.values()].filter(kind => kind === "action").length };
    listeners.forEach(listener => listener());
  }
  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => EMPTY,
    begin(kind: LoadingKind = "data") {
      const id = Symbol();
      operations.set(id, kind);
      publish();
      return () => { if (operations.delete(id)) publish(); };
    },
  };
}
// Preserve one store across lazy-loaded routes and development hot reloads.
const runtime = globalThis as typeof globalThis & { __orionLoadingStore?: ReturnType<typeof createLoadingStore> };
export const loadingStore = runtime.__orionLoadingStore ??= createLoadingStore();

/** Track each repository operation through resolution/rejection, including response parsing. */
export function trackRepository<T extends object>(repository: T): T {
  return new Proxy(repository, {
    get(target, property, receiver) {
      const method = Reflect.get(target, property, receiver);
      if (typeof method !== "function") return method;
      return async (...args: unknown[]) => {
        const finish = loadingStore.begin(/^(get|list|summaries)/.test(String(property)) ? "data" : "action");
        try { return await method.apply(target, args); }
        finally { finish(); }
      };
    },
  });
}
