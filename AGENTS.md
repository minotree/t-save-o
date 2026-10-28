# t-save-o 프로젝트 지침

공통 기준: `D:/DEV/project-guidelines/README.md`, `D:/DEV/project-guidelines/AGENTS.md`를 2026-10-28에 읽고 적용했다. 보고는 한국어로 한다.

| 항목 | 결정 |
| --- | --- |
| 프로젝트 / scope | t-save-o / @t-save-o |
| 서비스 | ‘ㅇ 구하기’: 한글 자모 화살표 획을 제거해 고정 원형 ㅇ(ㅎ 내부 포함)을 구출하는 모바일 퍼즐 |
| 이번 범위 | React PWA 시작 화면·manifest·앱 셸 캐시·갱신 안내·실행 명령. 게임 기능은 미구현 |
| 플랫폼·순서 | PWA 우선 개발, 토스·Android·iOS 후속 순서는 미정. PRD의 웹·토스 동시 첫 출시 목표는 유지 |
| 플랫폼 상태 | PWA 최소 기반 구현; 토스·Android·iOS 미착수. 브라우저·설치·실기기·출시 미검증 |
| 데이터 | 진행 기록 IndexedDB, 원격 퍼즐 Supabase가 기획 기준. 현재 SDK·스키마·연결 없음. 계정 동기화 미확정 |
| 호스팅 | Cloudflare 정적 호스팅 우선 후보, 미연결. Vercel·지도는 필요할 때만 검토 |
| 도구 | 확인 Node 24.22.0, pnpm 10.34.7, Git 2.55.0.windows.5. Node 24 계열 engines 및 packageManager 유지 |
| 업로드·검토·출시 | 담당자 미정. 커밋·푸시·원격 생성·배포·유료 전환·운영 DB 변경은 명시 승인 필요 |
| 문서 | 요구사항 docs/planning/*.docx, 구조·결정 docs/architecture.md, 실행·운영 README.md, 진행 progress.md |

## 요구사항과 작업 범위

- `docs/planning`의 PRD·TRD·UserFlow·Codex 작업지시서를 읽고 확정/제안/미확정을 구분한다. 문서 원본을 보존한다.
- 작업지시서의 이전 ‘검토 단계’ 제한에 대해 이번 사용자 요청은 최소 구조 생성까지 명시 승인했다. 완성 게임 구현까지 확대하지 않는다.
- 원본 인수인계서는 현재 폴더에서 발견되지 않았다. PRD의 확정 규칙 1~44를 사용한다.
- 모든 합법적 제거 순서의 풀이 가능성, 중복 점수 방지, 진행 중 버전 유지, 원격 원자적 병합은 후속 구현 시 회귀 테스트 필수다.
- 레벨 수식·입력 정규화·백업 병합/교체·광고 공급자·터치 기준·50개 원문·Supabase 공개 정책은 임의 확정하지 않는다. 구현에 필요한 시점에 한 가지씩 확인한다.

## 구조와 의존성

- pnpm workspace, TypeScript strict. apps/web은 UI·스타일·라우팅·브라우저 어댑터를 소유한다.
- 후속 apps/toss는 독립 React+TDS+토스 SDK, apps/mobile은 독립 Ionic React+Capacitor UI다. 미사용 폴더·빈 패키지를 미리 만들지 않는다.
- 공유 코드가 생길 때 packages/contracts·core·data·utils를 추가하고 workspace:* 및 공개 exports로 연결한다. 공유 UI·라우팅은 만들지 않는다.
- contracts/utils는 플랫폼 SDK를 참조하지 않는다. core는 contracts·순수 utils만 참조하며 React·브라우저 전역·구체 Supabase 클라이언트를 참조하지 않는다.
- data는 앱을 import하지 않는다. 플랫폼별 세션 초기화·의존성 조립은 앱에서 한다. 다른 앱 import·경계 밖 상대 소스 import·순환 의존성 금지.
- 플랫폼별 React/SDK 호환성은 각각 검토한다. 공식 요구사항·peer·라이선스·번들 크기를 확인하고 lockfile을 관리한다.
- 토스 작업 시 공통 가이드의 references/toss-local-development.md 및 toss-miniapp-deployment-lessons.md 관련 절을 먼저 읽는다.

## 검증·보안·운영

- pnpm.cmd dev:web (127.0.0.1:5173), typecheck, build, preview:web (127.0.0.1:4173)을 사용한다.
- 변경에 맞는 검사와 git diff --check를 실행하고 progress.md에 실제 결과를 남긴다. 기기 검증·출시와 빌드 성공을 구분한다.
- 서비스 워커는 운영 빌드에서만 동작한다. 앱 셸만 캐시하고 API·개인정보는 캐시하지 않는다. 갱신은 사용자 버튼으로 적용한다.
- 좁은 화면·Safe Area·키보드·포커스·터치·네트워크 실패·서비스 워커 교체를 검증한다.
- Supabase 도입 시 migration·RLS·권한·응답 검증을 포함한다. service-role 및 배포 키를 클라이언트·Git·로그에 넣지 않는다.
- 개인 .env·서명 키·빌드 결과는 커밋하지 않는다. 원격/운영값은 추측하지 않는다.
- 사용자 변경과 기존 문서를 보존한다. 강제 푸시·파괴적 명령 금지. ‘마무리하자’는 문서·검사·커밋·일반 푸시 승인으로 해석하며 배포·운영 DB 변경·삭제는 제외한다.
