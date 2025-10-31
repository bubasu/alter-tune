import { Injectable } from '@angular/core';
import { Fingering } from './models';

export interface FingeringPreset {
  id: string;
  name: string;
  stringsCount: number;
  fingering: Fingering;
  tuningName?: string;
  createdAt: number;
  updatedAt: number;
}

@Injectable({ providedIn: 'root' })
export class PresetService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open('alter-tune', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('fingerings')) {
          const store = db.createObjectStore('fingerings', { keyPath: 'id' });
          store.createIndex('by_name', 'name', { unique: false });
          store.createIndex('by_stringsCount', 'stringsCount', { unique: false });
          store.createIndex('by_updatedAt', 'updatedAt', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return this.dbPromise;
  }

  async list(): Promise<FingeringPreset[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('fingerings', 'readonly');
      const store = tx.objectStore('fingerings');
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as FingeringPreset[]).sort((a,b)=>b.updatedAt-a.updatedAt));
      req.onerror = () => reject(req.error);
    });
  }

  async get(id: string): Promise<FingeringPreset | undefined> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('fingerings', 'readonly');
      const store = tx.objectStore('fingerings');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result as FingeringPreset | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  async save(name: string, fingering: Fingering, stringsCount: number, tuningName?: string, id?: string): Promise<FingeringPreset> {
    const now = Date.now();
    const preset: FingeringPreset = {
      id: id ?? (crypto as any).randomUUID ? (crypto as any).randomUUID() : this.fallbackUUID(),
      name,
      stringsCount,
      fingering,
      tuningName,
      createdAt: now,
      updatedAt: now,
    };
    const db = await this.openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('fingerings', 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore('fingerings').put(preset);
    });
    return preset;
  }

  async rename(id: string, newName: string): Promise<void> {
    const existing = await this.get(id);
    if (!existing) return;
    existing.name = newName;
    existing.updatedAt = Date.now();
    const db = await this.openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('fingerings', 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore('fingerings').put(existing);
    });
  }

  async remove(id: string): Promise<void> {
    const db = await this.openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('fingerings', 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore('fingerings').delete(id);
    });
  }

  private fallbackUUID(): string {
    // Simple RFC4122 v4-ish fallback
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
