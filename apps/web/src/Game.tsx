import { useCallback, useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { findHeadContact } from './game/engine';
import type { Puzzle } from './game/engine';
import { createPhrasePuzzle } from './game/phrase-puzzle';
import { RescueParade, RescueTarget } from './RescueFriends';
import { PullStroke } from './PullStroke';
import { BUMP_MS, PULL_MS } from './game/rope';
import { useMood } from './MoodContext';
import { CompletionCard, GameProgress } from './CuteScreens';

const BLOCKED = '다른 화살표에 막혀 있어요. 순서를 다시 생각해 보세요!';
const EXIT_MS = PULL_MS;
const reviewPuzzle=createPhrasePuzzle();

export function Game({onHome,puzzle=reviewPuzzle,lesson,onChoose,onNext,onSolved}:{
  onHome:()=>void;puzzle?:Puzzle;lesson?:{index:number;total:number};onChoose?:()=>void;onNext?:()=>void;onSolved?:()=>void;
}) {
  const mood=useMood();

  const [removed, setRemoved] = useState<string[]>([]);
  const [exiting, setExiting] = useState<string | null>(null);
  const [rejected, setRejected] = useState<{ id: string } | null>(null);
  const [attempt,setAttempt]=useState<{id:string;distance:number;blocker:string}|null>(null);
  const [paradeFinished,setParadeFinished]=useState(false);
  const finishParade=useCallback(()=>{setParadeFinished(true);onSolved?.();},[onSolved]);
  const [message, setMessage] = useState('화살표를 눌러 동그란 ㅇ을 구해 주세요.');
  const remaining = puzzle.arrows.filter(arrow => !removed.includes(arrow.id));
  const complete = remaining.length === 0;
  const busy=!!exiting||!!attempt;



  useEffect(()=>{
    if(!attempt)return;
    const timer=window.setTimeout(()=>{
      setAttempt(null);
      setRejected({id:attempt.id});
      setMessage(attempt.blocker.startsWith('ieung')?'고정된 ㅇ에 막혀 있어요. 다른 화살표를 먼저 살펴보세요!':BLOCKED);
    },BUMP_MS);
    return()=>window.clearTimeout(timer);
  },[attempt]);

  useEffect(() => {
    if (!rejected) return;
    const timer = window.setTimeout(() => setRejected(null), 1400);
    return () => window.clearTimeout(timer);
  }, [rejected]);

  useEffect(() => {
    if (!exiting) return;
    const timer = window.setTimeout(() => {
      setRemoved(previous => [...previous, exiting]);
      setExiting(null);
    }, EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [exiting]);

  function select(id: string) {
    if (busy) return;
    const arrow = remaining.find(item => item.id === id);
    if (!arrow) return;
    const contact = findHeadContact(arrow, remaining, puzzle);
    if (contact) {
      setRejected(null);
      setMessage('');
      setAttempt({id,distance:contact.distance,blocker:contact.id});
      return;
    }
    setRejected(null);
    setMessage('잘했어요! 화살표가 빠져나가요.');
    setExiting(id);
  }

  function activate(event: KeyboardEvent<SVGGElement>, id: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      select(id);
    }
  }

  function restart() {
    setExiting(null);
    setAttempt(null);
    setRejected(null);
    setRemoved([]);
    setParadeFinished(false);

    setMessage('다시 시작해요. 화살표의 방향을 살펴보세요.');
  }

  if(mood.id==='cute'&&complete&&paradeFinished)return <>
    <header className="game-heading completion-heading"><span className="eyebrow">아기자기 · 한글 화살표 퍼즐</span><h1>ㅇ 구하기</h1></header>
    <CompletionCard friends={puzzle.targets.length} onReplay={restart} onHome={onHome}
      word={lesson?puzzle.letter:undefined} lesson={lesson} onNext={onNext} onChoose={onChoose}/>
  </>;

  return <>
    <header className="game-heading">
      <span className="eyebrow">{mood.name} · 한글 화살표 퍼즐</span>
      <h1>ㅇ 구하기</h1>
      <p>{mood.id==='cute'?'한 획씩 길을 열어, 친구들을 만나 봐요.':'길을 열고, 동그라미를 구해 주세요.'}</p>
    </header>
    {lesson&&<div className="lesson-nav"><span>쉬움 · {lesson.index+1} / {lesson.total}</span><button className="secondary-action" onClick={onChoose}>문제 목록</button></div>}
    <section className={`puzzle-card ${lesson?'lesson-card':''}`} aria-label={`${puzzle.letter} 퍼즐`}>
      <div className="puzzle-caption"><span>{lesson?'한 줄 단어':'첫 번째 구출'}</span><span>{lesson?'오늘의 단어':'오늘의 문장'} <strong>{puzzle.letter.split(' / ').map(line=><span key={line}>{line}</span>)}</strong></span></div>
      {mood.id==='cute'&&<GameProgress removed={removed.length} total={puzzle.arrows.length} friends={puzzle.targets.length}/>}
      <div className="board-frame" role="region" aria-label="한글 퍼즐" style={lesson?{maxWidth:puzzle.width,marginInline:'auto'}:undefined}>
      <svg className={`board phrase-board ${complete ? 'is-complete' : ''}`} viewBox={`0 0 ${puzzle.width} ${puzzle.height}`} aria-labelledby="board-title board-description">
        <title id="board-title">{puzzle.letter} 한글 화살표 퍼즐</title>
        <desc id="board-description">{puzzle.letter}의 화살표 {puzzle.arrows.length}개를 제거해 동그라미 {puzzle.targets.length}명을 구하세요. 막힌 획은 장애물까지 당겨졌다 돌아옵니다. 클릭, 터치 또는 탭 키와 엔터로 선택할 수 있습니다.</desc>
        {complete?<RescueParade puzzle={puzzle} onFinished={finishParade}/>:puzzle.targets.map(target=><RescueTarget key={target.id} target={target}/>)}
        {remaining.map(arrow => <PullStroke key={arrow.id} arrow={arrow} board={puzzle}
          exiting={exiting===arrow.id} attemptDistance={attempt?.id===arrow.id?attempt.distance:undefined}
          busy={busy} blocked={rejected?.id===arrow.id}
          onSelect={()=>select(arrow.id)} onKeyDown={event=>activate(event,arrow.id)}/>)}
      </svg>
      </div>

      <div className={`feedback ${complete ? 'success' : ''}`} role="status" aria-live="polite" aria-atomic="true">
        {complete ? <><strong>ㅇ 구출 성공!</strong><span>모든 화살표를 보내고 ㅇ을 구했어요.</span></> : <span>{message}</span>}
      </div>
    </section>
    <p className="how-to">화살표 끝이 향하는 쪽으로 빠져나가요.<br />막힌 화살표는 그대로 남아요. 다른 획부터 살펴보세요.</p>
    <button className="restart" onClick={restart}>↻ 다시 시작</button>
  </>;
}

