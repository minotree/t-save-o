import { expect,test } from '@playwright/test';
import type { Page,Locator } from '@playwright/test';
async function choose(page:Page,item:Locator,isMobile:boolean){
  await item.locator('.arrow-head').scrollIntoViewIfNeeded();
  const point=await item.locator('.arrow-head').evaluate(element=>{
    const head=element as SVGPathElement,box=head.getBBox(),m=head.getScreenCTM()!;
    const p=new DOMPoint(box.width*.35,0).matrixTransform(m);return {x:p.x,y:p.y};
  });
  if(isMobile)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
}
async function legal(page:Page,index:number){
  const ids=await page.locator('[data-arrow]').evaluateAll(es=>es.map(e=>e.getAttribute('data-arrow')));
  return page.evaluate(async({ids,index})=>{
    const source='/src/game/cute-easy.ts',engine='/src/game/engine.ts';
    const puzzle=(await import(source)).cuteEasyPuzzles[index],{findHeadBlocker}=await import(engine);
    const remaining=puzzle.arrows.filter((a:{id:string})=>ids.includes(a.id));
    return remaining.filter((a:unknown)=>!findHeadBlocker(a,remaining,puzzle)).map((a:{id:string})=>a.id) as string[];
  },{ids,index});
}

test('first easy word: real mouse/touch blocking, rope removal, replay, next and list',async({page,isMobile},testInfo)=>{
  await page.goto('/');await page.getByText('어떻게 구하나요?',{exact:false}).click();
  await expect(page.getByText('막히면 다른 획부터',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'게임 시작'}).click();
  await expect(page.locator('[data-lesson-index]')).toHaveCount(10);
  await page.screenshot({path:testInfo.outputPath('easy-list.png'),fullPage:true});
  await page.locator('[data-lesson-index="0"]').click();
  await expect(page.locator('[data-arrow]')).toHaveCount(3);
  await page.screenshot({path:testInfo.outputPath('easy-ai.png'),fullPage:true});
  const blocked=page.locator('[data-arrow="easy-0-0-a-lower"]');await choose(page,blocked,isMobile);
  await expect(blocked).toHaveClass(/is-blocked/);
  await expect(page.getByText('다른 화살표에 막혀 있어요. 순서를 다시 생각해 보세요!')).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('value','0');
  for(const id of ['easy-0-0-a-upper','easy-0-0-a-lower','easy-0-1-i']){
    const item=page.locator(`[data-arrow="${id}"]`);await choose(page,item,isMobile);await expect(item).toHaveCount(0);
  }
  await expect(page.getByRole('heading',{name:'모두 함께 탈출했어요!'})).toBeVisible({timeout:7000});
  await expect(page.locator('.completed-word')).toHaveText('아이');
  await page.screenshot({path:testInfo.outputPath('easy-complete.png'),fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:'다시 시작'}).click();await expect(page.locator('[data-arrow]')).toHaveCount(3);
  await expect(page.getByRole('progressbar')).toHaveAttribute('value','0');
  await page.getByRole('button',{name:'문제 목록',exact:true}).click();
  await expect(page.locator('[data-lesson-index="0"]')).toHaveClass(/is-cleared/);
  await page.getByRole('button',{name:'← 홈으로'}).click();
  await expect(page.getByRole('radio',{name:/아기자기/})).toBeChecked();
});

test('all ten easy words: sequential completion, no overflow, next resets and final list',async({page},testInfo)=>{
  test.setTimeout(90000);await page.clock.install();await page.goto('/');await page.getByRole('button',{name:'게임 시작'}).click();
  await page.locator('[data-lesson-index="0"]').click();
  const words=['아이','오이','우유','아기','오리','여우','공','콩','양','용'];
  for(let index=0;index<10;index++){
    await expect(page.locator('.puzzle-caption strong')).toHaveText(words[index]);
    await expect(page.getByRole('progressbar')).toHaveAttribute('value','0');
    expect(await page.locator('.board-frame').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
    if([4,5,7,8,9].includes(index))await page.screenshot({path:testInfo.outputPath(`easy-${index+1}.png`),fullPage:true,animations:'disabled'});
    const count=await page.locator('[data-arrow]').count();
    for(let i=0;i<count;i++){
      const ids=await legal(page,index);expect(ids.length).toBeGreaterThan(0);
      const item=page.locator(`[data-arrow="${ids[0]}"]`);await item.focus();await page.keyboard.press('Enter');
      await page.clock.fastForward(1150);await expect(item).toHaveCount(0);
    }
    await page.clock.runFor(4200);
    await expect(page.getByRole('heading',{name:'모두 함께 탈출했어요!'})).toBeFocused();
    await expect(page.locator('.completed-word')).toHaveText(words[index]);
    if(index<9)await page.getByRole('button',{name:'다음 문제'}).click();
    else await page.getByRole('button',{name:'문제 목록 보기'}).click();
  }
  await expect(page.locator('.lesson-choice.is-cleared')).toHaveCount(10);
  await expect(page.locator('.course-caption')).toContainText('10 / 10');
  await page.locator('[data-lesson-index="7"]').click();await expect(page.locator('.puzzle-caption strong')).toHaveText('콩');
  await expect(page.getByRole('progressbar')).toHaveAttribute('value','0');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
