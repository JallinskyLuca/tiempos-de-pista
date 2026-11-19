'use client';

import { useSyncExternalStore } from 'react';

type InstallEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> };
const initial = { prompt: null as InstallEvent | null, installed: false };
let snapshot = initial;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const publish = (next: typeof initial) => { snapshot = next; listeners.forEach((listener) => listener()); };

export function trackPwaInstall() {
  const media = window.matchMedia('(display-mode: standalone)');
  const detect = () => publish({ ...snapshot, installed: media.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true });
  const onPrompt = (event: Event) => { event.preventDefault(); publish({ ...snapshot, prompt: event as InstallEvent }); };
  const onInstalled = () => publish({ installed: true, prompt: null });
  detect();
  window.addEventListener('beforeinstallprompt', onPrompt);
  window.addEventListener('appinstalled', onInstalled);
  media.addEventListener('change', detect);
  return () => {
    window.removeEventListener('beforeinstallprompt', onPrompt);
    window.removeEventListener('appinstalled', onInstalled);
    media.removeEventListener('change', detect);
  };
}

export function usePwaInstall() {
  const current = useSyncExternalStore(subscribe, () => snapshot, () => initial);
  async function install() {
    const event = snapshot.prompt;
    if (!event) return;
    try { await event.prompt(); await event.userChoice; }
    finally { publish({ ...snapshot, prompt: null }); }
  }
  return { ...current, install };
}
