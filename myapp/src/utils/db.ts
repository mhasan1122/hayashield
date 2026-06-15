let storage: any = null;
try {
  // Use require dynamically inside try-catch to prevent static import failures
  const { MMKV } = require('react-native-mmkv');
  storage = new MMKV();
} catch (e) {
  console.log('MMKV not available, falling back to in-memory store. Native storage is active in Android development builds.');
}

const mockStore = new Map<string, any>();

export const db = {
  getString: (key: string): string | undefined => {
    if (storage) {
      try {
        return storage.getString(key);
      } catch (e) {
        return mockStore.get(key);
      }
    }
    return mockStore.get(key);
  },
  getNumber: (key: string): number | undefined => {
    if (storage) {
      try {
        return storage.getNumber(key);
      } catch (e) {
        return mockStore.get(key);
      }
    }
    return mockStore.get(key);
  },
  getBoolean: (key: string): boolean | undefined => {
    if (storage) {
      try {
        return storage.getBoolean(key);
      } catch (e) {
        return mockStore.get(key);
      }
    }
    return mockStore.get(key);
  },
  set: (key: string, value: string | number | boolean): void => {
    if (storage) {
      try {
        storage.set(key, value);
        return;
      } catch (e) {
        // Fallback below
      }
    }
    mockStore.set(key, value);
  },
  delete: (key: string): void => {
    if (storage) {
      try {
        storage.delete(key);
        return;
      } catch (e) {
        // Fallback below
      }
    }
    mockStore.delete(key);
  },
  clearAll: (): void => {
    if (storage) {
      try {
        storage.clearAll();
        return;
      } catch (e) {
        // Fallback below
      }
    }
    mockStore.clear();
  },
};
export default db;
