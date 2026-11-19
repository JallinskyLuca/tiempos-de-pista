import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('escuderías, fichas internas, fotos y contraste accesible', async ({ page }, testInfo) => {
  await page.goto('/categoria/f1/archivo/2026?vista=escuderias');
  await expect(page.getByRole('heading', { name: 'La grilla de 2026' })).toBeVisible();
  await expect(page.locator('.team-card')).toHaveCount(11);
  await expect(page.locator('.team-card').first()).toContainText('Motor');
  expect(await page.locator('.driver-avatar img').count()).toBeGreaterThan(15);
  await expect.poll(() => page.locator('.driver-avatar img').first().evaluate((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.screenshot({ path: `.work-import/previews/${testInfo.project.name}/escuderias.png`, fullPage: true });
  await page.locator('.team-card').first().getByRole('link', { name: 'Ver escudería' }).click();
  await expect(page).toHaveURL(/\/f1\/2026\/escuderia\//);
  await page.locator('.team-drivers a').first().click();
  await expect(page).toHaveURL(/\/f1\/2026\/piloto\//);
  await expect(page.getByRole('heading', { name: 'Resultados de carrera de 2026' })).toBeVisible();
});

test('piloto del día, cambio de sesión y botones visibles', async ({ page }, testInfo) => {
  await page.goto('/categoria/f1/archivo/2026/20');
  await expect(page.getByRole('heading', { name: 'Piloto del día' })).toBeVisible();
  await expect(page.locator('.driver-of-day img')).toBeVisible();
  const save = page.getByRole('button', { name: 'Guardar sin conexión' });
  const contrast = await page.getByRole('link', { name: 'Ver resultados', exact: true }).evaluate((node) => {
    const style = getComputedStyle(node);
    const luminance = (color: string) => {
      const parts = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((value) => { const normalized = value / 255; return normalized <= .04045 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4; });
      return parts[0] * .2126 + parts[1] * .7152 + parts[2] * .0722;
    };
    const foreground = luminance(style.color), background = luminance(style.backgroundColor);
    return (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05);
  });
  expect(contrast).toBeGreaterThanOrEqual(4.5);
  expect((await save.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.getByLabel('Elegí una sesión o estadística').selectOption({ label: 'Clasificación' });
  await expect(page.locator('#resultado h2')).toHaveText('Clasificación');
  await expect(page).toHaveURL(/sesion=\d+/);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.screenshot({ path: `.work-import/previews/${testInfo.project.name}/fecha-f1.png`, fullPage: true });
});

test('la interfaz compartida conserva accesibilidad y reflujo en las pantallas principales', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 360, height: 800 });
  for (const path of ['/', '/archivo', '/categoria/tc/archivo/2026/14', '/categoria/tn/archivo/2026?vista=posiciones', '/descargas', '/apoyar']) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), path).toBe(true);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations.map((violation) => ({ id: violation.id, targets: violation.nodes.map((node) => node.target) })), path).toEqual([]);
  }
});
