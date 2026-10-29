import { useCallback, useEffect, useRef, useState } from 'react';
import { touchArrow } from './touch-selection';
import type { KeyboardEvent, ReactNode } from 'react';
import { findHeadContact } from './game/engine';
import type { Puzzle } from './game/engine';
import { createPhrasePuzzle } from './game/phrase-puzzle';
import { RescueParade, RescueTarget, WaitingFriend } from './RescueFriends';
import { activeTargets, waitingParadePuzzle } from './game/ai-demo';
import { PullStroke } from './PullStroke';
import { BUMP_MS, PULL_MS } from './game/rope';
import { useMood } from './MoodContext';
import { CompletionCard, GameProgress } from './CuteScreens';

const BLOCKED = '다른 화살표에 막혀 있어요. 순서를 다시 생각해 보세요!';
const EXIT_MS = PULL_MS;
const reviewPuzzle=createPhrasePuzzle();

export function Game({onHome,puzzle=reviewPuzzle,lesson,onChoose,onNext,onSolved,boardOverlay}:{
  onHome:()=>void;puzzle?:Puzzle;lesson?:{index:number;total:number;difficulty?:string};onChoose?:()=>void;onNext?:()=>void;onSolved?:()=>void;
  boardOverlay?:ReactNode;
}) {
  const mood=useMood();

  const [removed, setRemoved] = useState<string[]>([]);
  const [exiting, setExiting] = useState<string | null>(null);
  const [rejected, setRejected] = useState<{ id: string } | null>(null);
  const [attempt,setAttempt]=useState<{id:string;distance:number;blocker:string}|null>(null);
  const [paradeFinished,setParadeFinished]=useState(false);
  const [arrived,setArrived]=useState<string[]>([]);
  const friendArrived=useCallback((id:string)=>setArrived(previous=>previous.includes(id)?previous:[...previous,id]),[]);
  const finishParade=useCallback(()=>{setParadeFinished(true);onSolved?.();},[onSolved]);
  const [message, setMessage] = useState('화살표를 눌러 동그란 ㅇ을 구해 주세요.');
  const remaining = puzzle.arrows.filter(arrow => !removed.includes(arrow.id));
  const complete = remaining.length === 0;
  const fixedTargets=activeTargets(puzzle,removed);
  const busy=!!exiting||!!attempt;
  const touchStart=useRef<{id:number;x:number;y:number;moved:boolean}|null>(null);
  const suppressClickUntil=useRef(0);



  useEffect(()=>{
    if(!attempt)return;
    const timer=window.setTimeout(()=>{
      setAttempt(null);
      setRejected({id:attempt.id});
      setMessage(attempt.blocker.startsWith('ieung')?(puzzle.waitingY!==undefined?'ㅇ이 길을 막고 있어요. 그 글자의 화살표를 먼저 보내 주세요!':'고정된 ㅇ에 막혀 있어요. 다른 화살표를 먼저 살펴보세요!'):BLOCKED);
    },BUMP_MS);
    return()=>window.clearTimeout(timer);
  },[attempt,puzzle.waitingY]);

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
    const contact = findHeadContact(arrow, remaining, {...puzzle,targets:fixedTargets});
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
    setArrived([]);

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
    {lesson&&<div className="lesson-nav"><span>{lesson.difficulty??'쉬움'} · {lesson.index+1} / {lesson.total}</span><button className="secondary-action" onClick={onChoose}>문제 목록</button></div>}
    <section className={`puzzle-card ${lesson?'lesson-card':''}`} aria-label={`${puzzle.letter} 퍼즐`}>
      <div className="puzzle-caption"><span>{lesson?`${puzzle.letter.split(' / ').length}줄 문제`:'첫 번째 구출'}</span><span>{lesson?'오늘의 문제':'오늘의 문장'} <strong>{puzzle.letter.split(' / ').map(line=><span key={line}>{line}</span>)}</strong></span></div>
      {mood.id==='cute'&&<GameProgress removed={removed.length} total={puzzle.arrows.length} friends={puzzle.targets.length}/>}
      <div className="board-frame" role="region" aria-label="한글 퍼즐" style={lesson?{maxWidth:puzzle.width,marginInline:'auto'}:undefined}>
      <svg className={`board phrase-board ${puzzle.waitingY!==undefined?'ai-demo-board':''} ${complete ? 'is-complete' : ''}`} viewBox={`0 0 ${puzzle.width} ${puzzle.height}`} aria-labelledby="board-title board-description"
        onPointerDown={event=>{
          if(event.pointerType==='mouse'){suppressClickUntil.current=0;return;}
          if(!event.isPrimary){touchStart.current=null;return;}
          touchStart.current={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};
        }}
        onPointerMove={event=>{
          const start=touchStart.current;
          if(start&&Math.hypot(event.clientX-start.x,event.clientY-start.y)>10)start.moved=true;
        }}
        onPointerCancel={()=>{touchStart.current=null;}}
        onPointerUp={event=>{
          const start=touchStart.current;touchStart.current=null;
          if(!start||start.id!==event.pointerId)return;
          suppressClickUntil.current=performance.now()+800;
          if(start.moved||Math.hypot(event.clientX-start.x,event.clientY-start.y)>10)return;
          if(event.target instanceof Element&&event.target.closest('.rescue-target'))return;
          const id=touchArrow(event.currentTarget,event.clientX,event.clientY);
          if(id)select(id);
        }}
        onClickCapture={event=>{
          if(event.detail!==0&&performance.now()<suppressClickUntil.current){event.preventDefault();event.stopPropagation();}
        }}>
        <title id="board-title">{puzzle.letter} 한글 화살표 퍼즐</title>
        <desc id="board-description">{puzzle.letter}의 화살표 {puzzle.arrows.length}개를 제거해 동그라미 {puzzle.targets.length}명을 구하세요. 막힌 획은 장애물까지 당겨졌다 돌아옵니다. 클릭, 터치 또는 탭 키와 엔터로 선택할 수 있습니다.</desc>
        {puzzle.waitingY!==undefined&&<g className="waiting-area" aria-label="구출된 친구들이 기다리는 곳">
          <path d={`M35 ${puzzle.waitingY-42} H${puzzle.width-35}`} stroke="#E1DAD0" strokeDasharray="3 7"/>
          <text x={puzzle.width/2} y={puzzle.waitingY+39} textAnchor="middle" fill="#82766E" fontSize="15">친구들을 기다려요</text>
        </g>}
        {complete&&(puzzle.waitingY===undefined||arrived.length===puzzle.targets.length)?<RescueParade puzzle={waitingParadePuzzle(puzzle)} onFinished={finishParade}/>:puzzle.targets.map((target,index)=>fixedTargets.includes(target)
          ?<RescueTarget key={target.id} target={target}/>
          :<WaitingFriend key={target.id} target={target} puzzle={puzzle} index={index} onArrived={friendArrived}/>)}
        {remaining.map(arrow => <PullStroke key={arrow.id} arrow={arrow} board={puzzle}
          exiting={exiting===arrow.id} attemptDistance={attempt?.id===arrow.id?attempt.distance:undefined}
          busy={busy} blocked={rejected?.id===arrow.id}
          onSelect={()=>select(arrow.id)} onKeyDown={event=>activate(event,arrow.id)}/>)}
        {boardOverlay}
      </svg>
      </div>

      <div className={`feedback ${complete ? 'success' : ''}`} role="status" aria-live="polite" aria-atomic="true">
        {complete ? <><strong>ㅇ 구출 성공!</strong><span>모든 화살표를 보내고 ㅇ을 구했어요.</span></> : <span>{message}</span>}
      </div>
    </section>
    <p className="how-to">{puzzle.waitingY!==undefined?<>분홍·파랑 한글과 검정 화살표를 모두 보내 주세요.<br/>글자의 획을 모두 보내면 ㅇ이 내려와 친구를 기다려요.</>:<>화살표 끝이 향하는 쪽으로 빠져나가요.<br />막힌 화살표는 그대로 남아요. 다른 획부터 살펴보세요.</>}</p>
    <button className="restart" onClick={restart}>↻ 다시 시작</button>
  </>;
}

