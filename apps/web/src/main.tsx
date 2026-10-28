import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { Game } from './Game';
import { EasyCourse } from './EasyCourse';
import { MoodContext } from './MoodContext';
import { MoodPicker } from './MoodPicker';
import { moods } from './moods';
import { PlayGuide } from './CuteScreens';
import type { MoodId } from './moods';
import './style.css';

function App() {
  const [tossPreview,setTossPreview] = useState(true);
  const [started, setStarted] = useState(false);
  const [moodId,setMoodId]=useState<MoodId>('cute');
  const mood=moods.find(item=>item.id===moodId)!;
  const [ready, setReady] = useState(false);
  const [update, setUpdate] = useState(false);
  const [failure, setFailure] = useState(false);
  const applyUpdate = useRef<ReturnType<typeof registerSW> | null>(null);
  const contentRef = useRef<HTMLElement>(null);
  useEffect(()=>{contentRef.current?.scrollTo(0,0);},[started]);
  useEffect(() => {
    if (applyUpdate.current) return;
    applyUpdate.current = registerSW({
      onOfflineReady: () => setReady(true),
      onNeedRefresh: () => setUpdate(true),
      onRegisterError: () => setFailure(true)
    });
  }, []);

  return <MoodContext.Provider value={mood}><div className="app-shell" data-mood={mood.id} data-preview={tossPreview?'toss':undefined}>
    {tossPreview&&<header className="toss-preview-header" aria-label="토스 상단 영역 모의 표시">
      <div className="toss-preview-bar"><span aria-hidden="true">‹</span><span>토스 화면 미리보기</span><button className="preview-toggle" onClick={()=>setTossPreview(false)} aria-label="토스 상단 미리보기 끄기">×</button></div>
    </header>}
    {!tossPreview&&<div className="preview-switch"><button className="preview-toggle" onClick={()=>setTossPreview(true)}>토스 상단 미리보기 켜기</button></div>}
    <main ref={contentRef} className={started ? 'play-screen' : 'home-screen'}>
    {started ? <>
      <nav className="play-nav" aria-label="게임 메뉴"><button className="home-link" onClick={() => setStarted(false)}>← 홈으로</button><span className="active-mood">{mood.name}</span></nav>
      {mood.id==='cute'?<EasyCourse onHome={()=>setStarted(false)}/>:<Game onHome={()=>setStarted(false)}/>}
    </> : <div className={`home-content ${mood.id==='cute'?'cute-home':''}`}>
      <header className="home-heading">
        <span className="home-badge">톡톡! 한글 화살표 퍼즐</span>
        <h1><span>ㅇ</span> 구하기</h1>
        <p>길을 열어 주면, 동그라미가 웃어요!</p>
      </header>
      <svg className="home-mascot" viewBox="0 0 280 260" role="img" aria-labelledby="mascot-title">
        <title id="mascot-title">발그레한 볼과 웃는 얼굴을 가진 동그란 ㅇ 캐릭터</title>
        <ellipse cx="140" cy="233" rx="65" ry="9" fill="#F1D99F" opacity=".5" />
        <circle cx="140" cy="125" r="104" fill="var(--soft)" />
        <path d="M 62 140 Q 39 130 35 110 M 218 140 Q 241 130 245 110" className="mascot-arms" />
        <circle cx="140" cy="125" r="76" fill="var(--surface)" stroke="var(--orange)" strokeWidth="23" />
        <ellipse cx="110" cy="137" rx="12" ry="7" fill="#FF727E" opacity=".55" />
        <ellipse cx="170" cy="137" rx="12" ry="7" fill="#FF727E" opacity=".55" />
        <ellipse cx="119" cy="117" rx="5" ry="7" fill="#684832" />
        <ellipse cx="161" cy="117" rx="5" ry="7" fill="#684832" />
        <path d="M 128 139 Q 140 154 152 139" className="mascot-smile" />
      </svg>
      <MoodPicker selected={moodId} onChange={setMoodId}/>
      <p className="mood-invitation" aria-live="polite">{mood.invitation}</p>
      {mood.id==='cute'&&<PlayGuide/>}
      <button className="start-button" onClick={() => setStarted(true)}>게임 시작 <span aria-hidden="true">▶</span></button>
      <p className="home-footnote">{mood.id==='cute'?'쉬움·보통·어려움, 내 속도로 즐겨요.':'서두르지 말고, 한 획씩 톡!'}</p>
    </div>}
    <div className="pwa-status" role="status" aria-live="polite">
      {ready && <p>오프라인 플레이 준비가 됐어요.</p>}
      {failure && <p>오프라인 준비에 실패했어요. 연결을 확인한 뒤 새로고침해 주세요.</p>}
      {update && <p>새 버전이 준비됐어요.</p>}
    </div>
    {update && <button onClick={() => { void applyUpdate.current?.(true).catch(() => setFailure(true)); }}>새 버전 열기</button>}
  </main><footer className="banner-reservation" aria-label="배너 광고 예정 영역"><div className="banner-placeholder"><span>광고 영역</span></div><div className="banner-safe-area" /></footer></div></MoodContext.Provider>;
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element missing');
createRoot(root).render(<StrictMode><App /></StrictMode>);
