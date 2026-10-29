import data from './grid-review.generated.json';
import { authoredDemoArrow, demoEllipse } from './ai-demo';
import { svgPath } from './jamo-templates';
import type { Puzzle } from './engine';

export const gridReviewData=data;
export const gridPoint=(x:number,y:number)=>({x:data.origin+x*data.pitch,y:data.origin+y*data.pitch});
export function createGridReview():Puzzle {
  const arrows=data.paths.map((path,i)=>authoredDemoArrow(`grid-${i}`,
    `${i<2?'성 ㅅ 사선':i<4?'성 ㅓ':'검정 경로'} ${i+1}`,
    path.map(([x,y])=>{const p=gridPoint(x,y);return [p.x,p.y];}),i<2?'#D85F92':i<4?'#4285C5':'#252832'));
  const center=gridPoint(data.circle.x,data.circle.y),radius=data.circle.radius*data.pitch;
  const outer=demoEllipse(center.x,center.y,radius,radius);
  return {letter:'성',width:432,height:548,waitingY:502,arrows,targets:[{
    id:'ieung-grid',center,radius:radius*.8,requiredArrowIds:arrows.slice(0,4).map(a=>a.id),
    shape:{commands:svgPath(outer+' '+demoEllipse(center.x,center.y,radius-5,radius-5)),fill:true,strokeWidth:0},
    obstacle:{commands:svgPath(outer),fill:true,strokeWidth:0},
  }]};
}

// Coverage uses the actual centerline, including intermediate diagonal lattice points.
export function gridReviewCoverage(){
  const omitted=new Set(data.excluded.map(([x,y])=>`${x},${y}`));
  return Array.from({length:data.size*data.size},(_,i)=>{
    const x=i%data.size,y=Math.floor(i/data.size),owners:number[]=[];
    data.paths.forEach((path,id)=>{
      if(path.slice(1).some(([bx,by],j)=>{
        const [ax,ay]=path[j];
        return Math.abs((x-ax)*(by-ay)-(y-ay)*(bx-ax))<1e-8&&
          x>=Math.min(ax,bx)&&x<=Math.max(ax,bx)&&y>=Math.min(ay,by)&&y<=Math.max(ay,by);
      }))owners.push(id);
    });
    return {x,y,excluded:omitted.has(`${x},${y}`),owners};
  });
}
