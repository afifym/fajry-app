// Jest mock for react-native-mmkv — in-memory implementation.
// Each createMMKV({ id }) returns its own isolated storage.

function createInMemoryStorage() {
  const store = {};
  return {
    set: (key, value) => { store[key] = value; },
    getString: (key) => store[key] ?? undefined,
    getBoolean: (key) => store[key],
    getNumber: (key) => store[key],
    remove: (key) => { delete store[key]; },
    contains: (key) => key in store,
    clearAll: () => { Object.keys(store).forEach(k => delete store[k]); },
    getAllKeys: () => Object.keys(store),
  };
}

const instances = {};

function createMMKV(config = {}) {
  const id = config.id ?? 'default';
  if (!instances[id]) {
    instances[id] = createInMemoryStorage();
  }
  return instances[id];
}

module.exports = { createMMKV };
