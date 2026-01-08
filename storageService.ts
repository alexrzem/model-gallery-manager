/**
 * IndexedDB Cache Utility
 * Provides caching functionality for API data with TTL (time-to-live) support
 */
import { CacheEntry } from '@/types';

const DB_NAME = 'rzem-ai';
const DB_VERSION = 3;
export const STORE_SETTINGS = 'settings';
export const STORE_FLUX_HISTORY = 'flux_history';
export const STORE_REFERENCE = 'reference';

interface RzemDB extends IDBDatabase {}

const openDB = (): Promise<RzemDB> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Reference Store
      if (!db.objectStoreNames.contains(STORE_REFERENCE)) {
        db.createObjectStore(STORE_REFERENCE);
      }

      // Settings Store (Key-Value)
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }

      // Flux History Store
      if (!db.objectStoreNames.contains(STORE_FLUX_HISTORY)) {
        db.createObjectStore(STORE_FLUX_HISTORY, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

// --- Generic Helpers ---

export const putItem = async <T>(storeName: string, item: T): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getItem = async <T>(storeName: string, key: string): Promise<T | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllItems = async <T>(storeName: string): Promise<T[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteItem = async (storeName: string, key: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get cached Item from IndexedDB
 */
export const getCachedItem = async <T>(storeName: string, key: string): Promise<T | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(key);

      request.onsuccess = () => {
        const entry: CacheEntry<T> | undefined = request.result;

        if (!entry) {
          resolve(null);
          return;
        }

        // Check if cache has expired
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
          // Cache expired, delete it
          deleteCachedItem(storeName, key);
          resolve(null);
          return;
        }

        resolve(entry.data);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error reading from IndexedDB cache:', error);
    return null;
  }
};

/**
 * Set cached Item in IndexedDB
 */
export const setCachedItem = async <T>(
  storeName: string, 
  key: string,
  data: T,
  ttl: number = 1000 * 60 * 60, // Default 1 hour
  version?: string,
): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version,
    };

    return new Promise((resolve, reject) => {
      const request = store.put(entry, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error writing to IndexedDB cache:', error);
  }
};

/**
 * Delete cached Item from IndexedDB
 */
export const deleteCachedItem = async (storeName: string, key: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error deleting from IndexedDB cache:', error);
  }
};

/**
 * Clear all cached data from IndexedDB
 */
export const clearAllCache = async (storeName: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error clearing IndexedDB cache:', error);
  }
};

/**
 * Helper function to fetch data with caching
 */
export const fetchWithCache = async <T>(
  storeName: string, 
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl: number = 1000 * 60 * 60, // Default 1 hour
): Promise<T> => {
  // Try to get from cache first
  const cachedData = await getCachedItem<T>(storeName, cacheKey);

  // If we have cached data and a version to check
  if (cachedData !== null) {
    return cachedData;
  }

  // Cache miss or version mismatch, fetch fresh data
  console.log(`Cache miss for ${cacheKey}, fetching fresh data...`);
  const freshData = await fetchFn();

  // Store in cache
  await setCachedItem(storeName, cacheKey, freshData, ttl, '');

  return freshData;
};
export const fetchWithCacheOld = async <T>(
  storeName: string, 
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl: number = 1000 * 60 * 60, // Default 1 hour
  version?: string,
): Promise<T> => {
  // Try to get from cache first
  const cachedData = await getCachedItem<T>(storeName, cacheKey);

  // If we have cached data and a version to check
  if (cachedData !== null && version !== undefined) {
    // Check if cached version matches expected version
    const cachedVersion = await getCachedVersion(storeName, cacheKey);
    if (cachedVersion !== version) {
      console.log(`Cache version mismatch for ${cacheKey} (cached: ${cachedVersion}, expected: ${version}), invalidating...`);
      await deleteCachedItem(storeName, cacheKey);
      // Continue to fetch fresh data below
    } else {
      console.log(`Cache hit for ${cacheKey} with valid version ${version}`);
      return cachedData;
    }
  } else if (cachedData !== null) {
    console.log(`Cache hit for ${cacheKey}`);
    return cachedData;
  }

  // Cache miss or version mismatch, fetch fresh data
  console.log(`Cache miss for ${cacheKey}, fetching fresh data...`);
  const freshData = await fetchFn();

  // Store in cache
  await setCachedItem(storeName, cacheKey, freshData, ttl, version);

  return freshData;
};

/**
 * Get cached version for a specific key
 */
export const getCachedVersion = async (storeName: string, key: string): Promise<string | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(key);

      request.onsuccess = () => {
        const entry: CacheEntry<any> | undefined = request.result;

        if (!entry || !entry.version) {
          resolve(null);
          return;
        }

        resolve(entry.version);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error reading version from IndexedDB cache:', error);
    return null;
  }
};

/**
 * Check if cached version matches expected version
 */
export const isCacheVersionValid = async (storeName: string, key: string, expectedVersion: string): Promise<boolean> => {
  const cachedVersion = await getCachedVersion(storeName, key);
  return cachedVersion === expectedVersion;
};
