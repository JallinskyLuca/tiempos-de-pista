import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('Home reúne categorías y cada centro conserva sus propios contenidos', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 360, height: 800 });
  const requests: string[] = [];
  page.on('request', (request) => { if (/youtube|ytimg|googlevideo/.test(request.url())) requests.push(request.url()); });
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Actualidad de pista');
  await expect(page.locator('.news-brief')).toHaveCount(3);
  await expect(page.locator('.video-card')).toHaveCount(3);
  await expect(page.locator('iframe')).toHaveCount(0);
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.screenshot({ path: `.work-import/previews/${testInfo.project.name}/home-v1.1.png`, fullPage: true });
  for (const [category, name] of [['f1', 'Fórmula 1'], ['tc', 'Turismo Carretera'], ['tn', 'TN APAT']]) {
    await page.goto(`/categoria/${category}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
    const tags = await page.locator('.news-brief .category-tag,.video-description .category-tag,.overview .category-tag').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-category')));
    expect(tags.length).toBeGreaterThan(1);
    expect(tags.every((tag) => tag === category)).toBe(true);
    await expect(page.getByRole('navigation', { name: 'Explorar la competencia' }).getByRole('link', { name: 'Calendario y resultados' })).toHaveAttribute('href', new RegExp(`/categoria/${category}/archivo/\\d{4}$`));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  }
  await page.locator('.news-brief h3 a').first().click();
  await expect(page).toHaveURL(/\/noticias\//);
  await expect(page.locator('.news-article')).toContainText('Breve de Tiempos de Pista');
});

test('YouTube solo se carga al pedirlo y los resúmenes pertenecen a su fecha', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => { if (request.url().startsWith('https://www.youtube-nocookie.com/embed/')) requests.push(request.url()); });
  await page.route('https://www.youtube-nocookie.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="es"><title>Reproductor de prueba</title><body>Video oficial</body></html>' }));
  await page.goto('/categoria/f1/archivo/2026/21');
  await expect(page.locator('.video-card')).toHaveCount(2);
  await expect(page.locator('.video-card').first()).toContainText('FP2 Highlights | 2026 Las Vegas');
  expect(requests).toEqual([]);
  await page.locator('.video-card').first().getByRole('button', { name: /^Cargar video:/ }).click();
  await expect(page.locator('iframe')).toHaveCount(1);
  await expect.poll(() => requests.length).toBe(1);
  await expect(page.locator('iframe')).toHaveAttribute('src', /^https:\/\/www.youtube-nocookie.com\/embed\/[\w-]{11}\?rel=0$/);
  await page.getByRole('button', { name: 'Cerrar reproductor' }).click();
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.goto('/categoria/tc/archivo/2026/14');
  await expect(page.locator('.video-card')).toHaveCount(1);
  await expect(page.locator('.video-card')).toContainText('TC | Resumen de la final en Río Cuarto');
});
