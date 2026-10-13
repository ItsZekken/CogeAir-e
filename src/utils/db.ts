import type { MeterReading, AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../data/seedData';

const DB_NAME = 'SeguimientoLuzDB';
const DB_VERSION = 1;
const STORE_READINGS = 'readings';
const STORE_SETTINGS = 'settings';

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB no está soportado en este navegador'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_READINGS)) {
        const readingsStore = db.createObjectStore(STORE_READINGS, { keyPath: 'id' });
        readingsStore.createIndex('date', 'date', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function dbGetAllReadings(): Promise<MeterReading[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_READINGS, 'readonly');
      const store = tx.objectStore(STORE_READINGS);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as MeterReading[];
        if (results && results.length > 0) {
          resolve(results.sort((a, b) => a.date.localeCompare(b.date)));
        } else {
          // If empty, return empty list
          resolve([]);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Error reading from IndexedDB, falling back to localStorage', err);
    try {
      const saved = localStorage.getItem('meter_readings_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  }
}

export async function dbClearAllReadings(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_READINGS, 'readwrite');
      const store = tx.objectStore(STORE_READINGS);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error clearing IndexedDB readings', err);
  }
}

export async function dbSaveReading(reading: MeterReading): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_READINGS, 'readwrite');
      const store = tx.objectStore(STORE_READINGS);
      const request = store.put(reading);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error saving reading to IndexedDB', err);
  }
}

export async function dbSaveAllReadings(readings: MeterReading[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_READINGS, 'readwrite');
      const store = tx.objectStore(STORE_READINGS);

      const clearReq = store.clear();
      clearReq.onsuccess = () => {
        for (const r of readings) {
          store.put(r);
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error batch saving readings to IndexedDB', err);
  }
}

export async function dbDeleteReading(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_READINGS, 'readwrite');
      const store = tx.objectStore(STORE_READINGS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error deleting reading from IndexedDB', err);
  }
}

export async function dbGetSettings(): Promise<AppSettings> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SETTINGS, 'readonly');
      const store = tx.objectStore(STORE_SETTINGS);
      const request = store.get('app_settings');

      request.onsuccess = () => {
        if (request.result && request.result.data) {
          resolve({ ...DEFAULT_SETTINGS, ...request.result.data });
        } else {
          // Check localStorage fallback
          try {
            const saved = localStorage.getItem('meter_settings_v1');
            if (saved) {
              const parsed = JSON.parse(saved);
              dbSaveSettings(parsed).catch(console.error);
              resolve({ ...DEFAULT_SETTINGS, ...parsed });
              return;
            }
          } catch {}
          resolve(DEFAULT_SETTINGS);
        }
      };

      request.onerror = () => resolve(DEFAULT_SETTINGS);
    });
  } catch (err) {
    console.warn('Error reading settings from IndexedDB', err);
    try {
      const saved = localStorage.getItem('meter_settings_v1');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  }
}

export async function dbSaveSettings(settings: AppSettings): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      const store = tx.objectStore(STORE_SETTINGS);
      const request = store.put({ key: 'app_settings', data: settings });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error saving settings to IndexedDB', err);
  }
}
