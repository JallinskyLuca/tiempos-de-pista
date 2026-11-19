'use client';

import { useSyncExternalStore } from 'react';
import type { Category } from './racing';
import { isCalendarDate } from './dates';

export type FavoriteEvent = { key: string; category: Category; year: string; id: string; name: string; date: string };
const key = 'tiempos.favorites.v1';
const eventName = 'tiempos:favorites';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(eventName, callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener(eventName, callback); };
}

function snapshot() {
  try { return window.localStorage.getItem(key) ?? '[]'; } catch { return '[]'; }
}

export function useFavorites(): FavoriteEvent[] {
  const raw = useSyncExternalStore(subscribe, snapshot, () => '[]');
  try {
    const items: FavoriteEvent[] = JSON.parse(raw);
    return Array.isArray(items) ? items.filter((item) => item && typeof item.key === 'string' && ['tc', 'f1', 'tn'].includes(item.category) && /^\d{4}$/.test(item.year) && /^[\w-]+$/.test(item.id) && typeof item.name === 'string' && typeof item.date === 'string' && isCalendarDate(item.date)) : [];
  } catch { return []; }
}

export function toggleFavorite(item: FavoriteEvent, current: FavoriteEvent[]) {
  const next = current.some((favorite) => favorite.key === item.key) ? current.filter((favorite) => favorite.key !== item.key) : [...current, item].slice(-100);
  window.localStorage.setItem(key, JSON.stringify(next));
  window.dispatchEvent(new Event(eventName));
}
