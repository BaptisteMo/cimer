/**
 * Offline Drafts using IndexedDB
 *
 * Provides simple key-value storage for form drafts using IndexedDB.
 * This allows users to continue working on forms even if they lose network connection.
 *
 * Usage:
 * - saveDraft(key, data): Save form data
 * - loadDraft(key): Load saved form data
 * - clearDraft(key): Clear saved form data
 */

const DB_NAME = 'cmr-digital-db';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';

/**
 * Open or create the IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Save a draft to IndexedDB
 *
 * @param key - Unique key for the draft (e.g., 'cmr-new-draft')
 * @param data - The data to save
 */
export async function saveDraft<T = unknown>(key: string, data: T): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const draftData = {
      data,
      savedAt: new Date().toISOString(),
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(draftData, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save draft'));
    });

    db.close();
  } catch (error) {
    console.error('Error saving draft:', error);
    throw error;
  }
}

/**
 * Load a draft from IndexedDB
 *
 * @param key - Unique key for the draft
 * @returns The saved data, or null if not found
 */
export async function loadDraft<T = unknown>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const result = await new Promise<{ data: T; savedAt: string } | undefined>((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to load draft'));
    });

    db.close();

    if (result && result.data) {
      return result.data;
    }

    return null;
  } catch (error) {
    console.error('Error loading draft:', error);
    return null;
  }
}

/**
 * Clear a draft from IndexedDB
 *
 * @param key - Unique key for the draft
 */
export async function clearDraft(key: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear draft'));
    });

    db.close();
  } catch (error) {
    console.error('Error clearing draft:', error);
    throw error;
  }
}

/**
 * Check if a draft exists
 *
 * @param key - Unique key for the draft
 * @returns True if draft exists, false otherwise
 */
export async function hasDraft(key: string): Promise<boolean> {
  try {
    const draft = await loadDraft(key);
    return draft !== null;
  } catch (_error) {
    return false;
  }
}
