import { expect, test } from '@playwright/test';

test('shows the real font glyph beside the game glyph without changing the game UI', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/review/seong-font-comparison.html');
  await expect(page.getByRole('heading', { name: '실제 폰트와 게임의 ‘성’ 비교' })).toBeVisible();
  const image = page.getByRole('img', { name: /왼쪽 기준 폰트의 성/ });
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBe(720);
  await expect(page.getByText(/기존 원형 캐릭터를 유지하므로/)).toBeVisible();
  const license = await page.request.get('/review/NotoSansKR-OFL.txt');
  expect(license.ok()).toBe(true);
  expect(await license.text()).toContain('SIL OPEN FONT LICENSE');
  await page.screenshot({ path: testInfo.outputPath('comparison.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: '게임 열기' }).click();
  await expect(page.getByRole('button', { name: '게임 시작' })).toBeVisible();
  expect(errors).toEqual([]);
});
