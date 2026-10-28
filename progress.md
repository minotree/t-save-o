# t-save-o 구현 진행표

## PWA 최소 실행 기반 생성 (2026-10-28)

- 요청: 공통 README/AGENTS 적용, 환경 확인, 프로젝트별 지침과 실행 가능한 최소 구조 생성.
- 확인: 기존 docs/planning의 DOCX 4개를 읽고 보존했다. 서비스는 ‘ㅇ 구하기’ 퍼즐이며 원본 인수인계서는 발견되지 않았다. 기존 소스·package.json·Git 저장소는 없었다.
- 환경: Windows PowerShell, Node 24.22.0, pnpm 10.34.7, Git 2.55.0.windows.5. wrangler/supabase 전역 명령은 발견되지 않았으며 현재 범위에는 필요 없어 설치하지 않았다.
- 변경: AGENTS.md, README.md, docs/architecture.md, pnpm workspace/lockfile, apps/web React·TypeScript strict·Vite·PWA 시작 화면, 아이콘, Git 초기화. 게임·SDK·미사용 패키지와 플랫폼 폴더는 생성하지 않았다.
- 검증 통과: pnpm.cmd install(승인된 네트워크 재시도), pnpm.cmd typecheck, pnpm.cmd build. generateSW에서 10개 항목 234.96 KiB precache 생성. 메인 JS gzip 70.39 kB, Workbox window gzip 2.20 kB.
- 실행 확인: pnpm.cmd preview:web으로 127.0.0.1:4173 실행. Node fetch로 /, /manifest.webmanifest, /sw.js, /icon-192.png, /icon-512.png 모두 HTTP 200·정상 MIME·비어 있지 않은 응답 확인. 확인 후 서버 종료.
- 경고/실패: 최초 샌드박스 패키지 조회·설치는 네트워크 EACCES로 중단 후 승인된 재시도로 성공. 전이 의존성 glob@11.1.0 deprecated 경고 1개. pnpm.cmd install --offline --frozen-lockfile 추가 검사는 ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY로 중단; 모듈 디렉터리 삭제·강제 재설치는 하지 않았다. lockfile은 설치 성공 시 생성됐고 웹 importer/peer 조합을 검토했다.
- Git: git diff --check 통과. 신규 저장소라 파일들이 untracked이며 이 명령의 검사 범위에 신규 파일 본문은 포함되지 않는다. Node fs 기반 별도 공백 검사에서 신규 텍스트 파일 13개 통과. 커밋·원격·푸시 없음.
- 사용자 확인: 브라우저 화면·설치·오프라인·업데이트·실기기 검증 미실행. 수동 절차는 README.md 참조.
- 적용: 로컬만 변경. 계정 생성·외부 업로드·배포·운영 DB 변경 없음.
- 남은 작업: 게임 구현 단계 범위 결정, 공통 퍼즐 계약/풀이 검증 엔진, 미확정 정책 확인. 광고·백업·Supabase·콘텐츠·각 플랫폼 연동과 출시 검증은 후속 범위.

## 단계별 진행 현황

- [x] 공통 기반: 지침·구조·명령·문서·workspace·Git 초기화
- [x] Web/PWA: 시작 화면·manifest·서비스 워커 설정·타입 검사·빌드·HTTP 확인
- [ ] Web/PWA: 퍼즐 게임 및 저장 기능
- [ ] Web/PWA: 브라우저 화면·설치·오프라인·갱신·기기 검증·출시
- [ ] Toss: 구현·자동 검사·번들·토스 기기 검증·출시
- [ ] Android: 구현·sync·네이티브 빌드·기기 검증·출시
- [ ] iOS: 구현·sync·네이티브 빌드·기기 검증·출시 (macOS/Xcode 환경 미확인)
