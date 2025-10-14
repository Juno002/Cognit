
"use client";

import type { ThoughtEntry, ThoughtEntryData, Achievement, ExposureState } from "@/types";
import { detectCognitiveDistortions } from "./distortions";

const DB_NAME = 'cbt_calma_v53';
const DB_VERSION = 3; // Incremented for migration

// Store Names
const SESSIONS_STORE = 'sessions';
const CONFIG_STORE = 'config';
const ACHIEVEMENTS_STORE = 'logros';

let dbPromise: Promise<IDBDatabase> | null = null;
let dbStatus: 'loading' | 'ok' | 'error' = 'loading';

export const getDbStatus = () => dbStatus;

const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      dbStatus = 'error';
      return reject(new Error("IndexedDB can only be used in the browser."));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Error opening IndexedDB:", request.error);
      dbStatus = 'error';
      reject(request.error);
    };

    request.onsuccess = (event) => {
      dbStatus = 'ok';
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      // This switch structure ensures that migrations are run sequentially.
      switch (oldVersion) {
        case 0:
          // From no DB to version 1
          if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
              const store = db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
              store.createIndex('date', 'date', { unique: false });
              store.createIndex('level', 'level', { unique: false });
              store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          }
          // falls through
        case 1:
          // From version 1 to version 2
          if (!db.objectStoreNames.contains(CONFIG_STORE)) {
              db.createObjectStore(CONFIG_STORE, { keyPath: 'key' });
          }
          if (!db.objectStoreNames.contains(ACHIEVEMENTS_STORE)) {
              db.createObjectStore(ACHIEVEMENTS_STORE, { keyPath: 'id' });
          }
          // falls through
        case 2:
          // From version 2 to version 3
          // Version 3 does not require schema changes for now.
          // This is where you would handle migrations if needed.
          console.log("Upgrading database to version 3.");
          // falls through
        default:
          console.log(`Database upgrade from ${oldVersion} to ${DB_VERSION} complete.`);
          break;
      }
    };
  });
  return dbPromise;
};

// Immediately try to open the DB to set the status
openDB();

// Generic Get/Set for config store
export const getConfig = async <T>(key: string): Promise<T | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CONFIG_STORE, 'readonly');
        const store = tx.objectStore(CONFIG_STORE);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? req.result.value : null);
        req.onerror = () => reject(req.error);
    });
};

export const setConfig = async (key: string, value: any): Promise<boolean> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CONFIG_STORE, 'readwrite');
        const store = tx.objectStore(CONFIG_STORE);
        const item = { key, value };
        const req = store.put(item);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
    });
};

export const setLastBackupDate = async (): Promise<void> => {
    await setConfig('lastBackupDate', new Date().toISOString());
};

export const validateSchema = (data: any): boolean => {
    if (typeof data !== 'object' || data === null) return false;
    
    // Check for cbtEntries: must be an array or not exist
    if (data.cbtEntries && !Array.isArray(data.cbtEntries)) return false;
    
    // If cbtEntries exist, check the first item for basic structure
    if (data.cbtEntries && data.cbtEntries.length > 0) {
        const entry = data.cbtEntries[0];
        if (typeof entry !== 'object' || entry === null || !entry.id || !entry.date || !entry.level) {
            return false;
        }
    }
    
    // Check for exposureState: must be an object or not exist
    if (data.exposureState && (typeof data.exposureState !== 'object' || Array.isArray(data.exposureState))) return false;
    
    // If exposureState exists, check its internal arrays
    if (data.exposureState) {
        if (data.exposureState.fearLadder && !Array.isArray(data.exposureState.fearLadder)) return false;
        if (data.exposureState.logs && !Array.isArray(data.exposureState.logs)) return false;
    }
    
    return true; // If all checks pass
};


// Sessions Store Functions
export const addEntry = async (entryData: ThoughtEntryData): Promise<ThoughtEntry> => {
  const db = await openDB();
  const entry: ThoughtEntry = {
    ...entryData,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SESSIONS_STORE, "readwrite");
    const store = transaction.objectStore(SESSIONS_STORE);
    const request = store.add(entry);

    transaction.oncomplete = () => resolve(entry);
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getAllEntries = async (): Promise<ThoughtEntry[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SESSIONS_STORE, "readonly");
    const store = transaction.objectStore(SESSIONS_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const deleteEntry = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SESSIONS_STORE, "readwrite");
    const store = transaction.objectStore(SESSIONS_STORE);
    const request = store.delete(id);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const bulkAddEntries = async (items: any[]): Promise<boolean> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        if (!Array.isArray(items)) {
            return reject(new TypeError("Data for bulk add must be an array."));
        }
        const tx = db.transaction(SESSIONS_STORE, 'readwrite');
        const store = tx.objectStore(SESSIONS_STORE);
        
        const requiredFields = ['id', 'date', 'level', 'emotion', 'intensity'];
        
        items.forEach(item => {
            for (const field of requiredFields) {
                if (!(field in item)) {
                    // Skipping invalid item, or you could reject the whole transaction
                    console.warn(`Skipping item due to missing required field: ${field}`, item);
                    return; // skip this item
                }
            }

            const entry: ThoughtEntry = {
                id: item.id,
                timestamp: item.timestamp || Date.now(),
                date: item.date,
                level: item.level,
                emotion: item.emotion,
                intensity: item.intensity,
                note: item.note || '',
                tags: item.tags || [],
                promptUsed: item.promptUsed || '',
                situation: item.situation || '',
                automaticThought: item.automaticThought || '',
                alternativeResponse: item.alternativeResponse || '',
                // Sanitize ICC fields to handle old data from 'finalCredibility'
                originalIntensity: item.originalIntensity ?? null,
                finalCredibility: item.finalCredibility ?? item.finalCredibilidad ?? null,
                __draft: item.__draft ?? false, 
            };
            store.put(entry); 
        });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
    });
};

export const clearAllData = async (): Promise<boolean> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([SESSIONS_STORE, CONFIG_STORE, ACHIEVEMENTS_STORE], 'readwrite');
        tx.objectStore(SESSIONS_STORE).clear();
        tx.objectStore(CONFIG_STORE).clear();
        tx.objectStore(ACHIEVEMENTS_STORE).clear();
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
    });
};


// Achievements Store Functions
export const getAchievements = async (): Promise<Achievement[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(ACHIEVEMENTS_STORE, 'readonly');
        const store = tx.objectStore(ACHIEVEMENTS_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
};

export const setAchievement = async (achievement: Achievement): Promise<boolean> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(ACHIEVEMENTS_STORE, 'readwrite');
        const store = tx.objectStore(ACHIEVEMENTS_STORE);
        const req = store.put(achievement);
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => {
          console.error('Error saving achievement:', (e.target as IDBRequest).error);
          reject((e.target as IDBRequest).error);
        };
    });
};
