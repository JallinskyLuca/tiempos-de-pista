import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cache } from 'react';
import type { Category } from './racing';

export type SourceCheck = { state: 'updated' | 'unchanged' | 'error'; checkedAt: string; publishedAt?: string; lastSuccessAt?: string; failures: number; error?: string | null };
export const getSyncStatus = cache(async (): Promise<{ categories: Partial<Record<Category, SourceCheck>> }> => {
  try { return JSON.parse(await readFile(join(process.cwd(), 'data', 'sync', 'status.json'), 'utf8')); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { categories: {} }; throw error; }
});
