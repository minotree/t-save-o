import { expect,test } from '@playwright/test';

for(const difficulty of ['normal','hard']){
  test(`${difficulty}: all ten puzzles, next/reset, completion retained across difficulties`,async({page},info)=>{
    test.setTimeout(240000);await page.clock.install();await page.goto('/');
    await page.getByRole('button',{name:'게임 시작'}).click();
    await expect(page.locator('[data-difficulty]')).toHaveCount(3);
    await page.locator(`[data-difficulty=${difficulty}]`).click();
    await expect(page.locator('[data-lesson-index]')).toHaveCount(10);
    await page.screenshot({path:info.outputPath(`${difficulty}-ten-list.png`),animations:'disabled'});
    await page.locator('[data-lesson-index="0"]').click();
    for(let index=0;index<10;index++){
      await expect(page.locator('.lesson-nav')).toContainText(`${index+1} / 10`);
      await expect(page.getByRole('progressbar')).toHaveAttribute('value','0');
      const count=await page.locator('[data-arrow]').count();
      expect(count).toBeGreaterThan(0);
      await expect(page.locator('.stroke-end')).toHaveCount(count);
      expect(await page.locator('.board-frame').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
      expect(await page.locator('.banner-placeholder').evaluate(e=>e.getBoundingClientRect().height)).toBe(102);
      if(index===0||index===9)await page.screenshot({path:info.outputPath(`${difficulty}-problem-${index+1}.png`),animations:'disabled'});
      for(let n=0;n<count;n++){
        const ids=await page.locator('[data-arrow]').evaluateAll(es=>es.map(e=>e.getAttribute('data-arrow')));
        const id=await page.evaluate(async({ids,difficulty,index})=>{
          const source='/src/game/cute-courses.ts',engine='/src/game/engine.ts';
          const {cuteCourses}=await import(source),{findHeadBlocker}=await import(engine);
          const puzzle=cuteCourses.find((c:{id:string})=>c.id===difficulty).puzzles[index];
          const remaining=puzzle.arrows.filter((a:{id:string})=>ids.includes(a.id));
          return remaining.find((a:unknown)=>!findHeadBlocker(a,remaining,puzzle))?.id as string|undefined;
        },{ids,difficulty,index});
        expect(id).toBeTruthy();const arrow=page.locator(`[data-arrow="${id}"]`);
        await arrow.focus();await page.keyboard.press('Enter');await page.clock.fastForward(850);await expect(arrow).toHaveCount(0);
      }
      await page.clock.runFor(1500);
      expect(await page.locator('.friend-hand').evaluateAll(es=>{
        const board=document.querySelector('.board')!.getBoundingClientRect();
        return es.every(e=>{const hand=e as SVGCircleElement,m=hand.getScreenCTM()!;
          const p=new DOMPoint(hand.cx.baseVal.value,hand.cy.baseVal.value).matrixTransform(m);
          return p.x>=board.left&&p.x<=board.right;});
      })).toBe(true);
      await page.clock.runFor(2700);
      await expect(page.getByRole('heading',{name:'모두 함께 탈출했어요!'})).toBeFocused();
      if(index===9)await page.screenshot({path:info.outputPath(`${difficulty}-all-complete.png`),animations:'disabled'});
      if(index<9)await page.getByRole('button',{name:'다음 문제'}).click();
      else {
        await expect(page.getByRole('button',{name:'다음 문제'})).toHaveCount(0);
        await page.getByRole('button',{name:'문제 목록 보기'}).click();
      }
    }
    await expect(page.locator('.lesson-choice.is-cleared')).toHaveCount(10);
    await page.getByRole('button',{name:'← 난이도 선택'}).click();
    await expect(page.locator(`[data-difficulty=${difficulty}]`)).toContainText('완료 10/10');
    await page.locator('[data-difficulty=easy]').click();await expect(page.locator('[data-lesson-index]')).toHaveCount(10);
    await page.getByRole('button',{name:'← 난이도 선택'}).click();
    await expect(page.locator(`[data-difficulty=${difficulty}]`)).toContainText('완료 10/10');
    await page.locator(`[data-difficulty=${difficulty}]`).click();await page.locator('[data-lesson-index="0"]').click();
    await expect(page.getByRole('progressbar')).toHaveAttribute('value','0');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
}
