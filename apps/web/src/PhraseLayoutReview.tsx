import { createPhrasePuzzle } from './game/phrase-puzzle';
import { pathData } from './game/vector-shape';
import { headGeometry, readableHead } from './game/pen-stroke';
import { RescueTarget } from './RescueFriends';
import { useMood } from './MoodContext';

const layouts=[
  {name:'현재 · 2줄',puzzle:createPhrasePuzzle()},
  {name:'비교 · 한 줄 최대 4글자',puzzle:createPhrasePuzzle('four-per-line')}
];

export function PhraseLayoutReview(){
  const {colors}=useMood();
  return <section className="layout-review" aria-labelledby="layout-review-title">
    <h3 id="layout-review-title">글자와 화살표 크기를 비교해요</h3>
    <p>새 배치는 디자인 검토용이에요. 아래 문제는 기존 배치로 플레이해요.</p>
    <div className="layout-comparisons">{layouts.map(({name,puzzle})=><figure key={name}>
      <figcaption>{name}</figcaption>
      <svg className="board" viewBox={`0 0 ${puzzle.width} ${puzzle.height}`} role="img" aria-label={`${name}: ${puzzle.letter}`}>
        {puzzle.targets.map(target=><RescueTarget key={target.id} target={target}/>)}
        {puzzle.arrows.map(arrow=>{
          const head=headGeometry(readableHead(arrow));
          return <g key={arrow.id}>
            <path d={pathData(arrow.shape!.commands)} fill={colors.body} fillRule="evenodd"/>
            <path d={head.d} transform={head.transform} fill={colors.head} stroke={colors.hover} strokeWidth={1} strokeLinejoin="round"/>
          </g>;
        })}
      </svg>
    </figure>)}</div>
  </section>;
}
