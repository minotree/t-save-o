import {expect,test} from '@playwright/test';

test('12x12 review covers every usable node and completes by real arrowhead input',async({page,isMobile},testInfo)=>{
  await page.clock.install();await page.goto('/grid-review.html');
  await expect(page.getByText('128 / 128',{exact:true})).toBeVisible();
  await page.getByLabel('격자점 표시').check();
  await expect(page.locator('[data-grid-node]')).toHaveCount(144);
  await expect(page.locator('[data-grid-node][data-excluded=false][data-owner-count="1"]')).toHaveCount(128);
  await expect(page.locator('[data-grid-node][data-excluded=true][data-owner-count="0"]')).toHaveCount(16);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('.board').screenshot({path:testInfo.outputPath('grid-nodes.png')});
  await page.getByLabel('격자점 표시').uncheck();
  await page.locator('.board').screenshot({path:testInfo.outputPath('grid-clean.png')});
  const order=await page.evaluate(async()=>{
    const source='/src/game/grid-review.ts';const {gridReviewData}=await import(source);
    return gridReviewData.solution as number[];
  });
  for(const index of order){
    const item=page.locator(`[data-arrow="grid-${index}"]`);
    await item.locator('.arrow-head').scrollIntoViewIfNeeded();
    const p=await item.locator('.arrow-head').evaluate(el=>{
      const head=el as SVGPathElement;
      const p=new DOMPoint(head.getBBox().width*.35,0).matrixTransform(head.getScreenCTM()!);
      return {x:p.x,y:p.y};
    });
    if(isMobile)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);
    await page.clock.runFor(700);await expect(item).toHaveCount(0);
  }
  await page.clock.runFor(6000);
  await expect(page.getByRole('heading',{name:'모두 함께 탈출했어요!'})).toBeVisible();
  await page.getByRole('button',{name:'↻ 다시 시작',exact:true}).click();
  await expect(page.locator('[data-arrow]')).toHaveCount(order.length);
  await expect(page.getByRole('progressbar')).toHaveAttribute('value','0');
});
