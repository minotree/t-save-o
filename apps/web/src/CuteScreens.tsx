import { useEffect, useRef } from 'react';

function FriendPortrait({index=0}:{index?:number}){
  return <svg viewBox="0 0 90 100" aria-hidden="true" className={`friend-portrait portrait-${index}`}>
    <path d="M19 57 Q7 54 6 42 M71 57 Q83 54 84 42" fill="none" stroke="#43C6AC" strokeWidth="5" strokeLinecap="round"/>
    <circle cx="45" cy="43" r="29" fill="#FFFCF2" stroke="#FFB84D" strokeWidth="10"/>
    <g fill="#684832"><circle cx="37" cy="42" r="2.4"/><circle cx="53" cy="42" r="2.4"/></g>
    <g fill="#FFADB8"><ellipse cx="32" cy="50" rx="4" ry="2.5"/><ellipse cx="58" cy="50" rx="4" ry="2.5"/></g>
    <path d="M39 51 Q45 58 51 51 M34 76 l-4 11 M56 76 l4 11" fill="none" stroke="#684832" strokeWidth="3" strokeLinecap="round"/>
  </svg>;
}

export function PlayGuide(){
  return <details className="play-guide">
    <summary><span aria-hidden="true">?</span> 어떻게 구하나요?</summary>
    <ol>
      <li><strong>방향을 보고 톡!</strong><span>획 안의 뾰족한 표시가 나갈 방향이에요.</span></li>
      <li><strong>막히면 다른 획부터</strong><span>다시 돌아와도 괜찮아요. 다른 길을 찾아봐요.</span></li>
      <li><strong>모두 보내면 구출 성공!</strong><span>친구들이 손을 잡고 떠나는 모습을 만나 보세요.</span></li>
    </ol>
  </details>;
}

export function GameProgress({removed,total,friends}:{removed:number;total:number;friends:number}){
  return <div className="game-progress">
    <div className="progress-friends"><FriendPortrait/><span>기다리는 친구 <strong>{friends}명</strong></span></div>
    <div className="progress-count"><span>남은 획 <strong>{total-removed}개</strong></span>
      <progress aria-label="획 제거 진행" max={total} value={removed}/>
    </div>
  </div>;
}

export function CompletionCard({friends,onReplay,onHome,word,lesson,onNext,onChoose}:{
  friends:number;onReplay:()=>void;onHome:()=>void;word?:string;lesson?:{index:number;total:number;difficulty?:string};onNext?:()=>void;onChoose?:()=>void;
}){
  const heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{heading.current?.focus();},[]);
  return <section className="completion-card" aria-labelledby="completion-title">
    <span className="completion-badge">{lesson?`${lesson.difficulty??'쉬움'} · ${lesson.index+1} / ${lesson.total} 완료`:'오늘의 구출 완료'}</span>
    {word&&<p className="completed-word">{word}</p>}
    <div className="completion-friends">{Array.from({length:friends},(_,i)=><FriendPortrait key={i} index={i}/>)}</div>
    <h2 ref={heading} id="completion-title" tabIndex={-1}>모두 함께 탈출했어요!</h2>
    <p>길을 열어 줘서 고마워요.<br/>동그라미 친구 {friends}명이 모두 웃고 있어요.</p>
    <div className="rescue-receipt"><span aria-hidden="true">✓</span><span>구출한 친구 <strong>{friends}명</strong></span><span>멋진 한 판이었어요!</span></div>
    <div className="completion-actions">
      {onNext?<button onClick={onNext}>다음 문제 →</button>:onChoose?<button onClick={onChoose}>문제 목록 보기</button>:null}
      <button className={lesson?'secondary-action':undefined} onClick={onReplay}>↻ 다시 시작</button>
      <button className="secondary-action" onClick={onHome}>다른 분위기 고르기</button>
    </div>
  </section>;
}
