import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './style.css';

function App() {
  const [ready, setReady] = useState(false);
  const [update, setUpdate] = useState(false);
  const [failure, setFailure] = useState(false);
  const applyUpdate = useRef<ReturnType<typeof registerSW> | null>(null);
  useEffect(() => {
    if (applyUpdate.current) return;
    applyUpdate.current = registerSW({
      onOfflineReady: () => setReady(true),
      onNeedRefresh: () => setUpdate(true),
      onRegisterError: () => setFailure(true)
    });
  }, []);

  return <main>
    <p className="eyebrow">한글 자모 화살표 퍼즐</p>
    <div className="character" aria-hidden="true">ㅇ</div>
    <h1>ㅇ 구하기</h1>
    <p>화살표 획을 보드 밖으로 보내고<br />동그란 ㅇ을 구해 주세요.</p>
    <section aria-labelledby="status-title">
      <h2 id="status-title">퍼즐을 준비하고 있어요</h2>
      <p>지금은 첫 화면만 열려 있어요.<br />퍼즐 플레이는 다음 단계에서 만나요.</p>
    </section>
    <div role="status" aria-live="polite">
      {ready && <p>이 시작 화면은 오프라인에서도 열 수 있어요.</p>}
      {failure && <p>오프라인 준비에 실패했어요. 연결을 확인한 뒤 새로고침해 주세요.</p>}
      {update && <p>새 버전이 준비됐어요.</p>}
    </div>
    {update && <button onClick={() => { void applyUpdate.current?.(true).catch(() => setFailure(true)); }}>새 버전 열기</button>}
  </main>;
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element missing');
createRoot(root).render(<StrictMode><App /></StrictMode>);
