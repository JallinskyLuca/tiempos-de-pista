'use client';

import { openDB } from 'idb';
import type { ArchiveEvent } from './archive';
import type { Category } from './racing';

export type SavedEvent = {
  key: string;
  category: Category;
  year: string;
  event: ArchiveEvent;
  savedAt: string;
  revision: string;
};

function database() {
  return openDB('tiempos-de-pista', 1, {
    upgrade(db) { db.createObjectStore('events', { keyPath: 'key' }); },
  });
}

export async function listSavedEvents(): Promise<SavedEvent[]> {
  const db = await database();
  try { return await db.getAll('events'); } finally { db.close(); }
}

export async function saveEvent(value: SavedEvent) {
  const db = await database();
  try {
    const tx = db.transaction('events', 'readwrite');
    if ((await tx.store.count()) >= 20 && !(await tx.store.get(value.key))) throw new Error('Podés guardar hasta 20 fechas. Eliminá una descarga para continuar.');
    await tx.store.put(value);
    await tx.done;
  } finally { db.close(); }
}

export async function removeSavedEvent(key: string) {
  const db = await database();
  try { await db.delete('events', key); } finally { db.close(); }
}
