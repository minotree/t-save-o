import { useCallback, useState } from 'react';
import { Game } from './Game';
import { cuteEasyPuzzles, cuteEasyWords } from './game/cute-easy';

export function EasyCourse({onHome}:{onHome:()=>void}){
  const [active,setActive]=useState<number|null>(null);
  const [cleared,setCleared]=useState<ReadonlySet<number>>(()=>new Set());
  const solved=useCallback(()=>{
    if(active===null)return;
    setCleared(previous=>previous.has(active)?previous:new Set([...previous,active]));
  },[active]);
  if(active!==null)return <Game key={active} onHome={onHome} puzzle={cuteEasyPuzzles[active]}
    lesson={{index:active,total:cuteEasyPuzzles.length}} onChoose={()=>setActive(null)}
    onNext={active<cuteEasyPuzzles.length-1?()=>{setActive(active+1);window.scrollTo(0,0);}:undefined} onSolved={solved}/>;
  return <section className="easy-course" aria-labelledby="course-title">
    <header className="game-heading"><span className="eyebrow">아기자기 · 쉬움</span><h1>ㅇ 구하기</h1>
      <h2 id="course-title">작은 단어부터 구해요</h2><p>하나씩 이어서 풀어도, 마음에 드는 단어부터 골라도 좋아요.</p></header>
    <div className="course-caption"><span>한 줄 단어 10개</span><span>이번에 구한 문제 <strong>{cleared.size} / 10</strong></span></div>
    <div className="lesson-grid">
      {cuteEasyWords.map((word,i)=><button key={word} className={`lesson-choice ${cleared.has(i)?'is-cleared':''}`} data-lesson-index={i}
        aria-label={`${i+1}. ${word} 시작${cleared.has(i)?' (완료)':''}`} onClick={()=>{setActive(i);window.scrollTo(0,0);}}>
        <span className="lesson-number">{i+1}</span><strong>{word}</strong>
        <span className="lesson-detail">획 {cuteEasyPuzzles[i].arrows.length}개 · 친구 {cuteEasyPuzzles[i].targets.length}명</span>
        <span className="lesson-state">{cleared.has(i)?'✓ 구출 완료':'구하러 가기 →'}</span>
      </button>)}
    </div>
    <p className="home-footnote">서두르지 말고, 한 획씩 톡!</p>
  </section>;
}
