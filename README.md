# t-save-o · ㅇ 구하기

한글 자모 화살표 획을 제거해 고정 원형 ㅇ을 구출하는 모바일 퍼즐 프로젝트다. 현재는 PWA 시작 화면과 설치·캐시 기반만 구현했다. 퍼즐 플레이·저장·광고·원격 콘텐츠는 아직 없다.

## 실행

Node 24.22.0 이상 24.x, pnpm 10.34.7을 사용한다. PowerShell 실행 정책에 영향받지 않도록 pnpm.cmd로 실행할 수 있다.

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd dev:web
```

개발 주소: http://127.0.0.1:5173 (포트 충돌 시 종료). 서비스 워커는 개발 서버에서 활성화하지 않는다.

```powershell
pnpm.cmd typecheck
pnpm.cmd build
pnpm.cmd preview:web
```

운영 빌드 미리보기: http://127.0.0.1:4173. 빌드 출력은 apps/web/dist다. 루트의 build/typecheck는 현재 존재하는 웹 앱을 검사한다. 별도 dev 별칭은 없다.

## PWA 수동 확인

1. build 후 preview:web을 실행하고 브라우저에서 연다.
2. 개발자 도구 Application에서 manifest와 활성 서비스 워커를 확인한다.
3. 첫 로딩·서비스 워커 활성화 후 오프라인으로 전환하고 새로고침해 시작 화면을 확인한다. 게임 오프라인 기능은 아직 없다.
4. 화면 문구를 변경해 다시 빌드한 뒤 온라인으로 재접속한다. 새 버전 안내와 버튼 적용을 확인한다.
5. 캐시 저장소에서 오래된 precache 정리, 좁은 화면·가로 화면·키보드 포커스를 확인한다.
6. HTTPS 배포 후 Android 설치와 iOS 홈 화면 추가를 각각 검증한다. localhost 예외 외에는 HTTPS가 필요하다.

## 운영과 다음 단계

Cloudflare 정적 호스팅 후보: 빌드 명령 pnpm build, 출력 apps/web/dist, 런타임은 Node 24 계열로 맞춘다. 실제 배포 전 호스팅의 pnpm 지원과 HTTPS·manifest MIME·캐시 헤더를 확인한다. index.html·sw.js·manifest.webmanifest는 재검증하도록 하고 해시 자산에만 장기 캐시를 적용한다. 계정 연결·업로드·배포는 아직 수행하지 않았다.

Supabase는 원격 퍼즐 배포 후보이며 스키마·키·인증 정책은 아직 없다. 현재 환경 변수 없이 실행한다. 키가 필요해지면 자리표시자만 있는 .env.example을 추가하고 실제 비밀값은 Git에서 제외한다.

기획은 [docs/planning](docs/planning), 구조·기술 근거는 [docs/architecture.md](docs/architecture.md), 작업 기준은 [AGENTS.md](AGENTS.md), 실제 검사 상태는 [progress.md](progress.md)에 있다. PWA 다음 플랫폼 순서는 미정이며 기획의 웹·토스 동시 첫 출시 목표는 유지한다.
