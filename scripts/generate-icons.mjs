import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const directory = new URL('../public/icons/', import.meta.url);
await mkdir(directory, { recursive: true });
const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="100" fill="#101722"/><path d="M140 150h232v58H140zm0 116h232v58H140z" fill="#91d9ff"/><path d="M198 150h58v58h-58zm116 0h58v58h-58zM140 208h58v58h-58zm116 0h58v58h-58zM198 266h58v58h-58zm116 0h58v58h-58z" fill="#101722"/><path d="m126 357 260 0-14 14H112Z" fill="#91d9ff"/></svg>`);
for (const [name, size] of [['app-192', 192], ['app-512', 512], ['maskable-512', 512], ['apple-180', 180]]) {
  await sharp(svg).resize(size, size).png().toFile(new URL(name + '.png', directory).pathname.replace(/^\/([A-Z]:)/i, '$1'));
}
