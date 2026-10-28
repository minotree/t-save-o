import type { Arrow, Point } from './engine';
import type { PathCommand } from './vector-shape';

// Use the other natural terminal without changing the body's font contour.
export function reverseArrow(arrow:Arrow):Arrow {
  const segments:{command:PathCommand;from:Point}[]=[];
  let current:Point={x:0,y:0};
  for(const command of arrow.rope!.path){
    if(command.type==='Z')throw new Error('Expected an open writing path');
    if(command.type!=='M')segments.push({command,from:current});
    current={x:command.x,y:command.y};
  }
  const path:PathCommand[]=[{type:'M',...current}];
  for(const {command,from} of segments.reverse()){
    if(command.type==='C')path.push({type:'C',x1:command.x2,y1:command.y2,x2:command.x1,y2:command.y1,...from});
    else if(command.type==='Q')path.push({type:'Q',x1:command.x1,y1:command.y1,...from});
    else path.push({type:'L',...from});
  }
  const points=[...arrow.points].reverse(),cap=points.at(-1)!,previous=points.at(-2)!;
  const dx=cap.x-previous.x,dy=cap.y-previous.y,m=Math.hypot(dx,dy);
  if(!m)throw new Error(`Invalid terminal: ${arrow.id}`);
  const direction={x:dx/m,y:dy/m};
  const anchor={x:cap.x-direction.x*(11.02+arrow.head!.length!),y:cap.y-direction.y*(11.02+arrow.head!.length!)};
  const heading=Math.abs(direction.x)<.001?(direction.y<0?'위':'아래')
    :Math.abs(direction.y)<.001?(direction.x<0?'왼쪽':'오른쪽')
    :`${direction.x<0?'왼쪽':'오른쪽'} ${direction.y<0?'위':'아래'}`;
  return {...arrow,points,direction,label:`${arrow.label.split(',')[0]}, ${heading} 방향`,
    rope:{...arrow.rope!,path},head:{...arrow.head!,anchor,direction,capCenter:cap}};
}
