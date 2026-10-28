import { expect,test } from '@playwright/test';

for(const mood of [
  {id:'cute',name:'아기자기',body:'#258C78',head:'#FFFF00',blocked:'#FF727E'},
  {id:'modern',name:'모던',body:'#385A70',head:'#F4D576',blocked:'#FF727E'},
  {id:'calm',name:'여유',body:'#315B4B',head:'#FFF17A',blocked:'#D94A58'},
]){
  test(`${mood.name}: select atmosphere, shared gameplay, return home with selection`,async({page},testInfo)=>{
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await page.clock.install();await page.goto('/');
    await expect(page.getByRole('group',{name:'어떤 분위기로 즐길까요?'})).toBeVisible();
    await page.getByRole('radio',{name:new RegExp(mood.name)}).check();
    await expect(page.locator('.app-shell')).toHaveAttribute('data-mood',mood.id);
    await page.screenshot({path:testInfo.outputPath(`home-${mood.id}.png`),fullPage:true,animations:'disabled'});
    expect(await page.locator('main').innerText()).not.toMatch(/초등|청소년|노년|연령|[0-9]+대/);
    await page.getByRole('button',{name:'게임 시작'}).click();
    if(mood.id==='cute')await page.locator('[data-difficulty=easy]').click();
    if(mood.id==='cute')await page.locator('[data-lesson-index="0"]').click();
    const count=mood.id==='cute'?3:37,targets=mood.id==='cute'?2:4;
    const freeId=mood.id==='cute'?'easy-0-0-a-upper':'wu-u-bar';
    const blockedId=mood.id==='cute'?'easy-0-0-a-lower':'jeo-eo-bar';
    await expect(page.locator('.active-mood')).toHaveText(mood.name);
    await expect(page.locator('[data-arrow]')).toHaveCount(count);
    await expect(page.locator('.target-ring')).toHaveCount(targets);
    await expect(page.locator(`[data-arrow="${freeId}"] .arrow-head`)).toHaveAttribute('fill',mood.head);
    const initial=await page.locator(`[data-arrow="${blockedId}"] .arrow-body`).getAttribute('d');
    await page.screenshot({path:testInfo.outputPath(`game-${mood.id}.png`),fullPage:true,animations:'disabled'});
    if(mood.id==='calm'){
      expect(await page.getByRole('button',{name:'다시 시작'}).evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(60);
    }
    expect(await page.locator('.board-frame').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
    expect(await page.locator('.board').evaluate(e=>e.getBoundingClientRect().width<=e.parentElement!.clientWidth+1)).toBe(true);
    await expect(page.getByText('좌우로 밀어 전체 글자를 살펴보세요.')).toHaveCount(0);
    const blocked=page.locator(`[data-arrow="${blockedId}"]`);
    await blocked.focus();await page.keyboard.press('Enter');await page.clock.runFor(430);
    await expect(blocked.locator('.arrow-head')).toHaveAttribute('fill',mood.blocked);
    await page.clock.runFor(550);await expect(blocked).not.toHaveClass(/is-attempting/);
    await expect(blocked.locator('.arrow-body')).toHaveAttribute('d',initial!);
    await expect(page.locator('[data-arrow]')).toHaveCount(count);
    const free=page.locator(`[data-arrow="${freeId}"]`);await free.focus();await page.keyboard.press('Enter');await page.clock.fastForward(1200);
    await expect(free).toHaveCount(0);
    await page.getByRole('button',{name:'← 홈으로'}).click();
    await expect(page.getByRole('radio',{name:new RegExp(mood.name)})).toBeChecked();
    await page.getByRole('button',{name:'게임 시작'}).click();
    if(mood.id==='cute')await page.locator('[data-difficulty=easy]').click();
    if(mood.id==='cute')await page.locator('[data-lesson-index="0"]').click();
    await expect(page.locator('[data-arrow]')).toHaveCount(count);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('atmosphere can be selected with the keyboard',async({page})=>{
  await page.goto('/');await page.getByRole('radio',{name:/아기자기/}).focus();
  await page.keyboard.press('ArrowRight');await expect(page.getByRole('radio',{name:/모던/})).toBeChecked();
  await page.keyboard.press('ArrowRight');await expect(page.getByRole('radio',{name:/여유/})).toBeChecked();
});
