import { useCallback, useEffect, useRef, useState } from 'react';
import { Game } from './Game';
import { cuteCourses } from './game/cute-courses';
import type { CuteDifficulty } from './game/cute-courses';
import { PhraseLayoutReview } from './PhraseLayoutReview';

export function EasyCourse({onHome}:{onHome:()=>void}){
  const [difficulty,setDifficulty]=useState<CuteDifficulty|null>(null);
  const [active,setActive]=useState<number|null>(null);
  const [cleared,setCleared]=useState<ReadonlySet<string>>(()=>new Set());
  const heading=useRef<HTMLHeadingElement>(null);
  const course=cuteCourses.find(item=>item.id===difficulty);
  useEffect(()=>{
    document.querySelector('main')?.scrollTo(0,0);
    if(active===null)heading.current?.focus({preventScroll:true});
  },[difficulty,active]);
  const solved=useCallback(()=>{
    if(active===null||difficulty===null)return;
    const key=`${difficulty}-${active}`;
    setCleared(previous=>previous.has(key)?previous:new Set([...previous,key]));
  },[active,difficulty]);
  if(course&&active!==null)return <Game key={`${difficulty}-${active}`} onHome={onHome} puzzle={course.puzzles[active]}
    lesson={{index:active,total:course.puzzles.length,difficulty:course.name}} onChoose={()=>setActive(null)}
    onNext={active<course.puzzles.length-1?()=>setActive(active+1):undefined} onSolved={solved}/>;
  return <section className="easy-course" aria-labelledby="course-title">
    <header className="game-heading"><span className="eyebrow">아기자기{course?` · ${course.name}`:''}</span><h1>ㅇ 구하기</h1>
      <h2 id="course-title" ref={heading} tabIndex={-1}>{course?course.title:'어떤 도전을 해 볼까요?'}</h2>
      <p>{course?'마음에 드는 문제부터 골라도 좋아요.':'쉬움·보통·어려움 모두 자유롭게 골라요.'}</p></header>
    {!course?<>
      <div className="difficulty-grid">{cuteCourses.map(item=>{
        const count=item.puzzles.filter((_,i)=>cleared.has(`${item.id}-${i}`)).length;
        return <button key={item.id} className="difficulty-choice" data-difficulty={item.id} onClick={()=>setDifficulty(item.id)}>
          <strong>{item.name}</strong><span>{item.description}</span><small>{item.puzzles.length}문제 · 완료 {count}/{item.puzzles.length}</small>
        </button>;
      })}</div>
      <p className="home-footnote">시간 제한 없이, 내 속도로 즐겨요.</p>
    </>:<>
      <button className="course-back secondary-action" onClick={()=>setDifficulty(null)}>← 난이도 선택</button>
      {difficulty==='hard'&&<details className="layout-review-details"><summary>기존 배치와 크기 비교</summary><PhraseLayoutReview/></details>}
      <div className="course-caption"><span>{course.puzzles.length}문제</span><span>이번에 구한 문제 <strong>{course.puzzles.filter((_,i)=>cleared.has(`${difficulty}-${i}`)).length} / {course.puzzles.length}</strong></span></div>
      <div className={`lesson-grid ${course.puzzles.length===1?'single-lesson':''}`}>{course.puzzles.map((puzzle,i)=><button key={puzzle.letter} className={`lesson-choice ${cleared.has(`${difficulty}-${i}`)?'is-cleared':''}`} data-lesson-index={i}
        aria-label={`${i+1}. ${puzzle.letter} 시작${cleared.has(`${difficulty}-${i}`)?' (완료)':''}`} onClick={()=>setActive(i)}>
        <span className="lesson-number">{i+1}</span><strong>{puzzle.letter.replace(' / ','\n')}</strong>
        <span className="lesson-detail">획 {puzzle.arrows.length}개 · 친구 {puzzle.targets.length}명</span>
        <span className="lesson-state">{cleared.has(`${difficulty}-${i}`)?'✓ 구출 완료':'구하러 가기 →'}</span>
      </button>)}</div>
      <p className="home-footnote">서두르지 말고, 한 획씩 톡!</p>
    </>}
  </section>;
}
