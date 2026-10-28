import { expect,test } from '@playwright/test';

for(const difficulty of ['normal','hard']){
  test(`${difficulty}: freely choose, solve representative puzzle, retain completion across difficulties`,async({page},info)=>{
    test.setTimeout(90000);await page.clock.install();await page.goto('/');
    await page.getByRole('button',{name:'게임 시작'}).click();
    await expect(page.locator('[data-difficulty]')).toHaveCount(3);
    if(difficulty==='normal')await page.screenshot({path:info.outputPath('difficulty-selection.png'),animations:'disabled'});
    await page.locator(`[data-difficulty=${difficulty}]`).click();
    await expect(page.locator('[data-lesson-index]')).toHaveCount(1);
    await page.locator('[data-lesson-index="0"]').click();
    const count=difficulty==='normal'?13:37;
    await expect(page.locator('[data-arrow]')).toHaveCount(count);
    if(difficulty==='hard')await page.screenshot({path:info.outputPath('hard-colored-arrows.png'),animations:'disabled'});
    const footer=page.locator('.banner-placeholder');
    expect(await footer.evaluate(e=>e.getBoundingClientRect().height)).toBe(102);
    expect(await page.locator('.board-frame').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
    for(let n=0;n<count;n++){
      const ids=await page.locator('[data-arrow]').evaluateAll(es=>es.map(e=>e.getAttribute('data-arrow')));
      const id=await page.evaluate(async({ids,difficulty})=>{
        const source='/src/game/cute-courses.ts',engine='/src/game/engine.ts';
        const {cuteCourses}=await import(source),{findHeadBlocker}=await import(engine);
        const puzzle=cuteCourses.find((c:{id:string})=>c.id===difficulty).puzzles[0];
        const remaining=puzzle.arrows.filter((a:{id:string})=>ids.includes(a.id));
        return remaining.find((a:unknown)=>!findHeadBlocker(a,remaining,puzzle))?.id as string|undefined;
      },{ids,difficulty});
      expect(id).toBeTruthy();const arrow=page.locator(`[data-arrow="${id}"]`);
      await arrow.focus();await page.keyboard.press('Enter');await page.clock.fastForward(1150);await expect(arrow).toHaveCount(0);
    }
    await page.clock.runFor(4200);
    await expect(page.getByRole('heading',{name:'모두 함께 탈출했어요!'})).toBeVisible();
    await expect(page.getByRole('button',{name:'다음 문제'})).toHaveCount(0);
    await page.getByRole('button',{name:'문제 목록 보기'}).click();
    await expect(page.locator('.lesson-choice.is-cleared')).toHaveCount(1);
    await page.getByRole('button',{name:'← 난이도 선택'}).click();
    await expect(page.locator(`[data-difficulty=${difficulty}]`)).toContainText('완료 1/1');
    await page.locator('[data-difficulty=easy]').click();await expect(page.locator('[data-lesson-index]')).toHaveCount(10);
    await page.getByRole('button',{name:'← 난이도 선택'}).click();
    await expect(page.locator(`[data-difficulty=${difficulty}]`)).toContainText('완료 1/1');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
}
