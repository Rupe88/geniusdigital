export async function saveCertificateBlob(
  courseId: string,
  blob: Blob,
  userId?: string
): Promise<void> {
  // Best-effort persistence (optional). If storage fails, downloading still works.
  if (typeof window === 'undefined') return;
  if (!('indexedDB' in window)) return;

  const dbName = 'vaastu-lms-certificates';
  const storeName = 'pdfs';
  const key = `${userId || 'anon'}:${courseId}`;

  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };

    request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(blob, key);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error || new Error('IndexedDB write failed'));
      };
    };
  });
}

export async function loadCertificateBlob(
  courseId: string,
  userId?: string
): Promise<Blob | null> {
  if (typeof window === 'undefined') return null;
  if (!('indexedDB' in window)) return null;

  const dbName = 'vaastu-lms-certificates';
  const storeName = 'pdfs';
  const key = `${userId || 'anon'}:${courseId}`;

  return await new Promise<Blob | null>((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };

    request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const getReq = store.get(key);
      getReq.onsuccess = () => {
        db.close();
        resolve((getReq.result as Blob | undefined) ?? null);
      };
      getReq.onerror = () => {
        db.close();
        reject(getReq.error || new Error('IndexedDB read failed'));
      };
    };
  });
}

