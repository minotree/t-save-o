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
    const source='/src/game/cute-courses.ts',engine='/src/game/engine.ts';
    const puzzle=(await import(source)).cuteCourses[0].puzzles[index],{findHeadBlocker}=await import(engine);
    const remaining=puzzle.arrows.filter((a:{id:string})=>ids.includes(a.id));
    const {activeTargets}=await import('/src/game/ai-demo.ts');
    const removed=puzzle.arrows.filter((a:{id:string})=>!ids.includes(a.id)).map((a:{id:string})=>a.id);
    return remaining.filter((a:unknown)=>!findHeadBlocker(a,remaining,{...puzzle,targets:activeTargets(puzzle,removed)})).map((a:{id:string})=>a.id) as string[];
  },{ids,index});
}

test('nested trains: inner waits for surround, surround waits for gate',async({page,isMobile},testInfo)=>{
  await page.goto('/');await page.getByRole('button',{name:'게임 시작'}).click();
  await page.locator('[data-difficulty=easy]').click();await page.locator('[data-lesson-index="0"]').click();
  const inner=page.locator('[data-arrow="ai-fill-4"]'),outer=page.locator('[data-arrow="ai-fill-6"]');
  await choose(page,inner,isMobile);await expect(inner).toHaveClass(/is-blocked/);await expect(inner).not.toHaveClass(/is-attempting/);
  await choose(page,outer,isMobile);await expect(outer).toHaveClass(/is-blocked/);await expect(outer).not.toHaveClass(/is-attempting/);
  for(const id of ['ai-fill-2','ai-fill-6','ai-fill-11','ai-fill-1','ai-fill-3','ai-fill-22']){
    const item=page.locator(`[data-arrow="${id}"]`);await choose(page,item,isMobile);await expect(item).toHaveCount(0);
  }
  await page.locator('.board').screenshot({path:testInfo.outputPath('nested-open.png')});
  await choose(page,inner,isMobile);await expect(inner).toHaveCount(0);
  await expect(page.getByRole('progressbar')).toHaveAttribute('value','7');
});

test('external arrowhead tip directly selects its stroke',async({page,isMobile})=>{
  await page.goto('/');await page.getByRole('button',{name:'게임 시작'}).click();
  await page.locator('[data-difficulty=easy]').click();await page.locator('[data-lesson-index="0"]').click();
  const item=page.locator('[data-arrow="ai-fill-2"]');
  const point=await item.locator('.arrow-head').evaluate(element=>{
    const head=element as SVGPathElement;
    const p=new DOMPoint(head.getBBox().width*.98,0).matrixTransform(head.getScreenCTM()!);
    const bodies=Array.from(head.ownerSVGElement!.querySelectorAll<SVGPathElement>('.arrow-hit'));
    if(bodies.some(body=>body.isPointInFill(p.matrixTransform(body.getScreenCTM()!.inverse()))))throw new Error('Head tip must be outside all bodies');
    if(head.ownerDocument.elementFromPoint(p.x,p.y)!==head)throw new Error('Visible head must receive the direct hit');
    return {x:p.x,y:p.y};
  });
  if(isMobile)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
  await expect(item).toHaveCount(0);
  await expect(page.getByRole('progressbar')).toHaveAttribute('value','1');
  await expect(page.locator('[data-arrow]')).toHaveCount(34);
});

test('first easy word: real mouse/touch blocking, rope removal, replay, next and list',async({page,isMobile},testInfo)=>{
  test.setTimeout(60000);
  await page.goto('/');await page.getByText('어떻게 구하나요?',{exact:false}).click();
  await expect(page.getByText('막히면 다른 획부터',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'게임 시작'}).click();await page.locator('[data-difficulty=easy]').click();
  await expect(page.locator('[data-lesson-index]')).toHaveCount(10);
  await page.screenshot({path:testInfo.outputPath('easy-list.png'),fullPage:true});
  await page.locator('[data-lesson-index="0"]').click();
  await expect(page.locator('[data-arrow]')).toHaveCount(35);
  await page.screenshot({path:testInfo.outputPath('easy-ai.png'),fullPage:true});
  await page.locator('.board').screenshot({path:testInfo.outputPath('ai-board.png')});
  const blocked=page.locator('[data-arrow="ai-a-upper"]');await choose(page,blocked,isMobile);
  await expect(blocked).toHaveClass(/is-blocked/);
  await expect(page.getByText('다른 화살표에 막혀 있어요. 순서를 다시 생각해 보세요!')).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('value','0');
  for(const id of ['ai-fill-11','ai-fill-1','ai-fill-2','ai-fill-6','ai-fill-3','ai-fill-22','ai-fill-4','ai-a-upper','ai-a-lower']){
    const item=page.locator(`[data-arrow="${id}"]`);await choose(page,item,isMobile);await expect(item).toHaveCount(0);
  }
  await expect(page.locator('[data-waiting-friend="ieung-ai-a"]')).toHaveAttribute('data-arrived','true');
  await expect(page.locator('[data-waiting-friend]')).toHaveCount(1);
  await expect(page.locator('[data-arrow]')).toHaveCount(26);
  await page.screenshot({path:testInfo.outputPath('ai-first-friend-waiting.png'),fullPage:true});
  await page.locator('.board').screenshot({path:testInfo.outputPath('ai-waiting-board.png')});
  for(const id of ['ai-fill-25','ai-fill-13','ai-fill-14','ai-fill-12','ai-fill-8','ai-fill-27']){
    const item=page.locator(`[data-arrow="${id}"]`);await choose(page,item,isMobile);await expect(item).toHaveCount(0);
  }
  const newlyFree=page.locator('[data-arrow="ai-fill-9"]');await choose(page,newlyFree,isMobile);await expect(newlyFree).toHaveCount(0);
  for(let i=0;i<19;i++){
    const ids=await legal(page,0);expect(ids.length).toBeGreaterThan(0);
    const item=page.locator(`[data-arrow="${ids[0]}"]`);await choose(page,item,isMobile);await expect(item).toHaveCount(0);
  }
  await expect(page.getByRole('heading',{name:'모두 함께 탈출했어요!'})).toBeVisible({timeout:7000});
  await expect(page.locator('.completed-word')).toHaveText('아이');
  await page.screenshot({path:testInfo.outputPath('easy-complete.png'),fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:'다시 시작'}).click();await expect(page.locator('[data-arrow]')).toHaveCount(35);
  await expect(page.locator('[data-waiting-friend]')).toHaveCount(0);
  await expect(page.getByRole('progressbar')).toHaveAttribute('value','0');
  await page.getByRole('button',{name:'문제 목록',exact:true}).click();
  await expect(page.locator('[data-lesson-index="0"]')).toHaveClass(/is-cleared/);
  await page.getByRole('button',{name:'← 홈으로'}).click();
  await expect(page.getByRole('radio',{name:/아기자기/})).toBeChecked();
});

test('all ten easy words: sequential completion, no overflow, next resets and final list',async({page},testInfo)=>{
  test.setTimeout(90000);await page.clock.install();await page.goto('/');await page.getByRole('button',{name:'게임 시작'}).click();await page.locator('[data-difficulty=easy]').click();
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
    if(index===0)await page.clock.runFor(1000);
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

test('restart while a rescued friend descends restores targets and cancels its arrival',async({page})=>{
  await page.clock.install();await page.goto('/');await page.getByRole('button',{name:'게임 시작'}).click();
  await page.locator('[data-difficulty=easy]').click();await page.locator('[data-lesson-index="0"]').click();
  for(const id of ['ai-fill-11','ai-fill-1','ai-fill-2','ai-fill-6','ai-fill-3','ai-fill-22','ai-fill-4','ai-a-upper','ai-a-lower']){
    const item=page.locator(`[data-arrow="${id}"]`);await item.focus();await page.keyboard.press('Enter');
    await page.clock.runFor(680);await expect(item).toHaveCount(0);
  }
  await expect(page.locator('[data-waiting-friend]')).toHaveCount(1);
  await expect(page.locator('[data-waiting-friend]')).toHaveAttribute('data-arrived','false');
  await page.getByRole('button',{name:'↻ 다시 시작',exact:true}).click();await page.clock.runFor(2000);
  await expect(page.locator('[data-waiting-friend]')).toHaveCount(0);
  await expect(page.locator('[data-arrow]')).toHaveCount(35);
  await expect(page.locator('.rescue-target')).toHaveCount(2);
});
