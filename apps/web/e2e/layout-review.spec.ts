import { expect,test } from '@playwright/test';

test('hard layout comparison enlarges the same glyphs with a playable four-letter puzzle',async({page},info)=>{
  await page.goto('/');await page.locator('.start-button').click();await page.locator('[data-difficulty=hard]').click();await page.locator('.layout-review-details summary').click();
  const samples=page.locator('.layout-comparisons svg');await expect(samples).toHaveCount(2);
  const dimensions=await samples.evaluateAll(es=>es.map(e=>({width:e.getBoundingClientRect().width,viewWidth:(e as SVGSVGElement).viewBox.baseVal.width,viewHeight:(e as SVGSVGElement).viewBox.baseVal.height})));
  expect(dimensions[1].width/dimensions[1].viewWidth).toBeGreaterThan(dimensions[0].width/dimensions[0].viewWidth);
  await expect(samples.nth(1)).toHaveAttribute('aria-label',/우리가 \/ 저마다 \/ 힘에겨운/);
  await page.locator('.layout-review').screenshot({path:info.outputPath('four-letter-comparison.png')});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('[data-lesson-index="0"]').click();
  await expect(page.locator('[data-arrow]')).toHaveCount(37);
  await expect(page.locator('.phrase-board')).toHaveAttribute('viewBox','0 0 1230 1030');
});
