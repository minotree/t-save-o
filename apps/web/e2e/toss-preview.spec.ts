import { expect,test } from '@playwright/test';

test('Toss preview reserves top and bottom through navigation without overlapping content',async({page},info)=>{
  await page.goto('/');
  const header=page.getByRole('banner',{name:'토스 상단 영역 모의 표시'});
  await expect(header).toBeVisible();
  expect(await page.locator('.toss-preview-bar').evaluate(e=>e.getBoundingClientRect().height)).toBe(54);
  async function layout(){
    const bounds=await page.evaluate(()=>{
      const h=document.querySelector('.toss-preview-header')!.getBoundingClientRect();
      const m=document.querySelector('main')!.getBoundingClientRect();
      const f=document.querySelector('.banner-reservation')!.getBoundingClientRect();
      return {top:m.top>=h.bottom,bottom:m.bottom<=f.top,footer:f.bottom<=innerHeight+1,overflow:document.documentElement.scrollWidth>innerWidth};
    });
    expect(bounds).toEqual({top:true,bottom:true,footer:true,overflow:false});
  }
  await layout();await page.screenshot({path:info.outputPath('toss-home.png')});
  await page.getByRole('button',{name:'게임 시작'}).click();await layout();
  await page.locator('[data-difficulty=easy]').click();await page.locator('[data-lesson-index="0"]').click();await layout();
  await expect(header).toBeVisible();await page.screenshot({path:info.outputPath('toss-game.png')});
  await page.getByRole('button',{name:'← 홈으로'}).click();await layout();
  await page.getByRole('button',{name:'토스 상단 미리보기 끄기'}).click();await expect(header).toHaveCount(0);
  await page.getByRole('button',{name:'토스 상단 미리보기 켜기'}).click();await expect(header).toBeVisible();
});

test('Toss preview phone home shows start button before scrolling in each atmosphere',async({page})=>{
  for(const viewport of [{width:390,height:844},{width:375,height:667}]){
    await page.setViewportSize(viewport);await page.goto('/');
    for(const mood of ['cute','modern','calm']){
      await page.locator(`input[value="${mood}"]`).check({force:true});await page.locator('main').evaluate(e=>e.scrollTop=0);
      expect(await page.locator('.start-button').evaluate(e=>{
        const b=e.getBoundingClientRect(),m=document.querySelector('main')!.getBoundingClientRect();return b.top>=m.top&&b.bottom+5<=m.bottom;
      }),`${viewport.width}x${viewport.height}: ${mood}`).toBe(true);
    }
  }
});
