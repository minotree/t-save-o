import {StrictMode,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Game} from './Game';
import {MoodContext} from './MoodContext';
import {moods} from './moods';
import {createGridReview,gridPoint,gridReviewCoverage,gridReviewData} from './game/grid-review';
import './style.css';
import './grid-review.css';

const puzzle=createGridReview(),coverage=gridReviewCoverage();
const usable=coverage.filter(n=>!n.excluded),covered=usable.filter(n=>n.owners.length===1);
function GridReview(){
  const [dots,setDots]=useState(false);
  return <MoodContext.Provider value={moods[0]}><div className="app-shell grid-review" data-mood="cute">
    <header className="toss-preview-header"><div className="toss-preview-bar"><span>ㅇ 구하기</span><span>새 배치 검토</span><a href="/">기존 게임</a></div></header>
    <main className="play-screen">
      <header className="grid-review-heading"><span className="eyebrow">사선이 있는 한 판</span><h1>성</h1>
        <p>{gridReviewData.size} × {gridReviewData.size} · 초기 배치 점 <strong>{covered.length} / {usable.length}</strong><br/>ㅇ에 닿거나 내부에 있는 점 {coverage.length-usable.length}개 제외</p>
        <label><input type="checkbox" checked={dots} onChange={e=>setDots(e.target.checked)}/> 격자점 표시</label>
      </header>
      <Game puzzle={puzzle} onHome={()=>{window.location.href='/';}}
        boardOverlay={dots?<g className="review-grid-points" pointerEvents="none" aria-hidden="true">{coverage.map(n=>{
          const p=gridPoint(n.x,n.y);
          return <circle key={`${n.x},${n.y}`} cx={p.x} cy={p.y} r={n.excluded?2:2.5}
            fill={n.excluded?'#A8A29B':'#129B7B'} data-grid-node={`${n.x},${n.y}`} data-excluded={n.excluded} data-owner-count={n.owners.length}/>;
        })}</g>:undefined}/>
    </main>
    <footer className="banner-reservation" aria-label="배너 광고 예정 영역"><div className="banner-placeholder"><span>광고 영역</span></div><div className="banner-safe-area"/></footer>
  </div></MoodContext.Provider>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><GridReview/></StrictMode>);
