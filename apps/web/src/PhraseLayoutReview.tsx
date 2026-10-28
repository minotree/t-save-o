import { createPhrasePuzzle } from './game/phrase-puzzle';
import { pathData } from './game/vector-shape';
import { headGeometry, readableHead } from './game/pen-stroke';
import { RescueTarget } from './RescueFriends';
import { useMood } from './MoodContext';

const layouts=[
  {name:'기존 · 2줄',puzzle:createPhrasePuzzle()},
  {name:'현재 · 한 줄 최대 4글자',puzzle:createPhrasePuzzle('four-per-line-playable')}
];

export function PhraseLayoutReview(){
  const {colors}=useMood();
  return <section className="layout-review" aria-labelledby="layout-review-title">
    <h3 id="layout-review-title">글자와 화살표 크기를 비교해요</h3>
    <p>한 줄 최대 네 글자로 나눈 문제를 아래에서 직접 풀어 보세요.</p>
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
