import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

async function choose(page:Page,item:Locator,isMobile:boolean){
  await item.locator('.arrow-head').scrollIntoViewIfNeeded();
  const point=await item.locator('.arrow-head').evaluate(element=>{
    const head=element as SVGPathElement,box=head.getBBox(),matrix=head.getScreenCTM()!;
    const p=new DOMPoint(box.width*.35,0).matrixTransform(matrix);
    return {x:p.x,y:p.y};
  });
  if(isMobile)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
}
async function legalIds(page:Page){
  const ids=await page.locator('[data-arrow]').evaluateAll(elements=>elements.map(e=>e.getAttribute('data-arrow')));
  return page.evaluate(async ids=>{
    const source='/src/game/phrase-puzzle.ts',engine='/src/game/engine.ts';
    const p=(await import(/* @vite-ignore */source)).createPhrasePuzzle('four-per-line-playable');
    const query=await import(/* @vite-ignore */engine);
    const remaining=p.arrows.filter((a:{id:string})=>ids.includes(a.id));
    return remaining.filter((a:unknown)=>query.findHeadBlocker(a,remaining,p)===null).map((a:{id:string})=>a.id) as string[];
  },ids);
}

test('우리가 저마다 힘에겨운: mouse/touch, blocked return, full rescue and restart',async({page,isMobile},testInfo)=>{
  test.setTimeout(90000);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.getByRole('radio',{name:/모던/}).check();await page.getByRole('button',{name:'게임 시작'}).click();
  const arrows=page.locator('[data-arrow]'),first=page.locator('[data-arrow="wu-u-bar"]'),second=page.locator('[data-arrow="jeo-eo-bar"]');
  await expect(arrows).toHaveCount(37);

  await page.screenshot({path:testInfo.outputPath('success-word-initial.png'),fullPage:true});
  const rightPath=await second.locator('.arrow-body').getAttribute('d');
  await choose(page,second,isMobile);await expect(second).toHaveClass(/is-attempting/);
  await expect(second).not.toHaveClass(/is-blocked/);
  await expect(second).toHaveClass(/is-blocked/);
  await expect(page.getByText('다른 화살표에 막혀 있어요. 순서를 다시 생각해 보세요!')).toBeVisible();
  await expect(arrows).toHaveCount(37);
  await choose(page,first,isMobile);await expect(first).toHaveCount(0);

  await expect(second.locator('.arrow-body')).toHaveAttribute('d',rightPath!);

  for(let i=0;i<36;i++){
    const ids=await legalIds(page);expect(ids.length).toBeGreaterThan(0);
    const item=page.locator(`[data-arrow="${ids[0]}"]`);
    await choose(page,item,isMobile);await expect(item).toHaveCount(0);
  }
  await expect(page.getByText('ㅇ 구출 성공!',{exact:true})).toBeVisible();
  await expect(page.locator('.target-ring')).toHaveCount(4);
  await page.screenshot({path:testInfo.outputPath('success-word-complete.png'),fullPage:true});
  const parade=page.locator('.rescue-parade');
  await expect(parade).toHaveAttribute('data-phase','walking');
  await expect(page.locator('.rescued-friend')).toHaveCount(4);
  await expect(page.locator('.friend-leg')).toHaveCount(8);
  const joined=await page.locator('.rescued-friend').evaluateAll(elements=>elements.slice(0,-1).map((element,i)=>{
    const hand=(e:Element,side:number)=>{
      const circle=e.querySelectorAll('.friend-hand')[side] as SVGCircleElement;
      const point=new DOMPoint(circle.cx.baseVal.value,circle.cy.baseVal.value).matrixTransform(circle.getScreenCTM()!);
      return point;
    };
    const a=hand(element,1),b=hand(elements[i+1],0);return Math.hypot(a.x-b.x,a.y-b.y);
  }));
  expect(joined.every(gap=>gap<.1)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('friends-holding-hands.png'),fullPage:true});
  await expect(parade).toHaveAttribute('data-phase','gone');
  await page.screenshot({path:testInfo.outputPath('cute-completion.png'),fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:'다시 시작'}).click();await expect(arrows).toHaveCount(37);
  await expect(parade).toHaveCount(0);
  await expect(page.getByText('ㅇ 구출 성공!',{exact:true})).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('interior high contrast heads and rope pulling: fixed body, tail clip, straight connected head',async({page,isMobile},testInfo)=>{
  await page.goto('/');await page.getByRole('radio',{name:/모던/}).check();await page.getByRole('button',{name:'게임 시작'}).click();
  const item=page.locator('[data-arrow="wu-u-bar"]'),head=item.locator('.arrow-head'),body=item.locator('.arrow-body');
  await expect(head).toHaveAttribute('fill','#F4D576');
  const before=await head.evaluate(e=>{const m=(e as SVGPathElement).getScreenCTM()!;return {x:m.e,y:m.f,ux:m.a,uy:m.b};});
  const initialBody=await body.getAttribute('d'),group=await item.getAttribute('transform');
  await choose(page,item,isMobile);await expect(item).toHaveClass(/is-exiting/);
  await page.waitForTimeout(110);
  const after=await head.evaluate(e=>{const m=(e as SVGPathElement).getScreenCTM()!;return {x:m.e,y:m.f};});
  expect((after.x-before.x)*before.ux+(after.y-before.y)*before.uy).toBeGreaterThan(0);
  expect(Math.abs((after.x-before.x)*before.uy-(after.y-before.y)*before.ux)).toBeLessThan(.001);
  await expect(body).toHaveAttribute('d',initialBody!);expect(await item.getAttribute('transform')).toBe(group);
  await expect(body).toHaveAttribute('mask',/url/);await expect(item.locator('.pulled-rope')).toHaveCount(1);
  await page.screenshot({path:testInfo.outputPath('success-word-pulling.png'),fullPage:true});
  await expect(item).toHaveCount(0);
});

test('keyboard and restart during pull cancel delayed removals',async({page})=>{
  await page.goto('/');await page.getByRole('radio',{name:/모던/}).check();await page.getByRole('button',{name:'게임 시작'}).click();
  const first=page.locator('[data-arrow="wu-u-bar"]');await first.focus();await page.keyboard.press('Enter');
  await expect(first).toHaveClass(/is-exiting/);await page.getByRole('button',{name:'다시 시작'}).click();
  await page.waitForTimeout(1300);await expect(page.locator('[data-arrow]')).toHaveCount(37);
  await expect(first).not.toHaveClass(/is-exiting/);
});

test('blocked pen turns coral AT contact, returns red, then recovers after a pause',async({page,isMobile},testInfo)=>{
  await page.clock.install();
  await page.goto('/');await page.getByRole('radio',{name:/모던/}).check();await page.getByRole('button',{name:'게임 시작'}).click();
  const item=page.locator('[data-arrow="jeo-eo-bar"]'),head=item.locator('.arrow-head'),body=item.locator('.arrow-body');
  const originalHead=await head.getAttribute('transform'),originalBody=await body.getAttribute('d');
  await choose(page,item,isMobile);await expect(item).toHaveClass(/is-attempting/);
  await expect(item).not.toHaveClass(/is-blocked/);
  await expect(page.getByText('다른 화살표에 막혀 있어요. 순서를 다시 생각해 보세요!')).toHaveCount(0);
  const distance=Number(await item.getAttribute('data-contact'));expect(distance).toBeGreaterThan(0);
  await page.clock.runFor(200);
  const approach=Number(await item.getAttribute('data-travel'));expect(approach).toBeGreaterThan(0);expect(approach).toBeLessThan(distance);
  await page.clock.runFor(230);
  expect(Number(await item.getAttribute('data-travel'))).toBeCloseTo(distance,3);
  await expect(item).toHaveClass(/is-blocked/);await expect(head).toHaveAttribute('fill','#FF727E');
  await expect(page.getByText('다른 화살표에 막혀 있어요. 순서를 다시 생각해 보세요!')).toHaveCount(0);
  await page.screenshot({path:testInfo.outputPath('two-row-contact.png'),fullPage:true});
  await page.clock.runFor(270);
  const returning=Number(await item.getAttribute('data-travel'));expect(returning).toBeGreaterThan(0);expect(returning).toBeLessThan(approach);
  await expect(head).toHaveAttribute('fill','#FF727E');
  await page.clock.runFor(250);
  await expect(item).not.toHaveClass(/is-attempting/);await expect(item).toHaveClass(/is-blocked/);
  await expect(head).toHaveAttribute('transform',originalHead!);await expect(body).toHaveAttribute('d',originalBody!);
  await expect(body).not.toHaveAttribute('mask');await expect(head).toHaveAttribute('fill','#FF727E');
  await expect(page.getByText('다른 화살표에 막혀 있어요. 순서를 다시 생각해 보세요!')).toBeVisible();
  await expect(page.locator('[data-arrow]')).toHaveCount(37);
  await page.clock.runFor(1500);await expect(item).not.toHaveClass(/is-blocked/);
});

test('restart during blocked return cancels pending warning and restores paths',async({page,isMobile})=>{
  await page.clock.install();await page.goto('/');await page.getByRole('radio',{name:/모던/}).check();await page.getByRole('button',{name:'게임 시작'}).click();
  const item=page.locator('[data-arrow="jeo-eo-bar"]'),head=item.locator('.arrow-head');
  const original=await head.getAttribute('transform');
  await choose(page,item,isMobile);await page.clock.runFor(450);await expect(item).toHaveClass(/is-attempting/);
  await page.getByRole('button',{name:'다시 시작'}).click();await page.clock.runFor(2000);
  await expect(item).not.toHaveClass(/is-attempting|is-blocked/);await expect(head).toHaveAttribute('transform',original!);
  await expect(page.getByText('다른 화살표에 막혀 있어요. 순서를 다시 생각해 보세요!')).toHaveCount(0);
  await expect(page.locator('[data-arrow]')).toHaveCount(37);
});

test('friends gather, grow linked limbs, and restart cancels their departure',async({page},testInfo)=>{
  test.setTimeout(60000);
  await page.clock.install();await page.goto('/');await page.getByRole('radio',{name:/모던/}).check();await page.getByRole('button',{name:'게임 시작'}).click();
  for(let i=0;i<37;i++){
    const ids=await legalIds(page);expect(ids.length).toBeGreaterThan(0);
    const item=page.locator(`[data-arrow="${ids[0]}"]`);
    await item.focus();await page.keyboard.press('Enter');await page.clock.fastForward(1150);
    await expect(item).toHaveCount(0);
  }
  const parade=page.locator('.rescue-parade');
  await expect(parade).toHaveAttribute('data-phase','gathering');
  await page.clock.runFor(600);await expect(parade).toHaveAttribute('data-phase','gathering');
  await expect(page.locator('.friend-limbs').first()).toHaveAttribute('opacity','0');
  await page.clock.runFor(1100);await expect(parade).toHaveAttribute('data-phase','holding-hands');
  await expect(page.locator('.friend-limbs').first()).toHaveAttribute('opacity','1');
  await page.screenshot({path:testInfo.outputPath('friends-gathered.png'),fullPage:true});
  await page.getByRole('button',{name:'다시 시작'}).click();await page.clock.runFor(6000);
  await expect(parade).toHaveCount(0);await expect(page.locator('[data-arrow]')).toHaveCount(37);
  await expect(page.locator('.target-ring')).toHaveCount(4);
  await expect(page.locator('.friend-limbs')).toHaveCount(0);
});

