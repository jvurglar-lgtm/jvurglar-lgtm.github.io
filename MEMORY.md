# MEMORY.md

## Goal
- `jvurglar-lgtm.github.io`에 반응형 개인 프로페셔널 웹사이트와 `Games` 지렁이 게임을 정적 `HTML`, `CSS`, `JavaScript`로 구현한다.

## Scope / Out of Scope
- In: 반응형 개인 사이트, `Games` 메뉴, 키보드/터치 지렁이 게임, GitHub Pages 호환성
- Out: 백엔드, DB, 로그인, 외부 서비스, 프레임워크 임의 추가

## Execution
- Mode: `CLAUDE_VERIFIER`
- Claude model: `claude-sonnet-4-6`
- Last test: `PASS`

## Current State
- 상태: `DEPLOY_APPROVAL_REQUIRED`
- 완료 루프: Step 9 변경 요청 구현 및 회귀 검증
- 다음 루프: 사용자 승인 대기
- Retry: 0
- fingerprint: 없음
- blocker: `ANTHROPIC_API_KEY`가 있으면 Claude 실행 충돌
- 마지막 정상 commit·URL: `92a5025` / `https://jvurglar-lgtm.github.io`
- git 상태: dirty
- rollback 기준: 승인 전 변경은 `92a5025`로 되돌린다.
- 요약: 어두운 모던 테마와 랜덤 적 2개를 반영했고, 회귀 검증까지 통과했다.

## Acceptance
- 데스크톱, 태블릿, 모바일에서 반응형으로 보인다.
- `Games` 메뉴가 보이고 이동 가능하다.
- 지렁이 게임이 키보드와 터치로 조작된다.
- GitHub Pages에서 정상 노출된다.

## Guardrails
- 확인되지 않은 개인 정보 생성 금지
- 기존 콘텐츠 임의 삭제 금지
- 테스트 삭제·완화 금지
- 대규모 재작성 금지
- 토큰 출력·로그·코드·문서·Git 저장 금지

## Retry / HITL
- 동일 원인 3회 또는 동일 fingerprint 2회면 중지한다.
- 프로필, 디자인, 게임 규칙이 불명확하면 `[사람 확인 필요]`로 둔다.

## Recent Loops
| Loop | 상태 | 실행 모드·모델 | 변경 파일 | 테스트 결과 | Retry | 다음 작업 |
|---|---|---|---|---|---:|---|
| 1 | DEPLOY_APPROVAL_REQUIRED | CLAUDE_VERIFIER / claude-sonnet-4-6 | styles.css, step9-c1.test.mjs | PASS | 0 | C1 배포 승인 대기 |
| 2 | DEPLOY_APPROVAL_REQUIRED | CLAUDE_VERIFIER / claude-sonnet-4-6 | index.html, script.js, step9-c2.test.mjs | PASS | 1 | C2 회귀 검증 완료 |
| 3 | DEPLOY_APPROVAL_REQUIRED | CLAUDE_VERIFIER / claude-sonnet-4-6 | index.html, styles.css, script.js, step9-c1.test.mjs, step9-c2.test.mjs | PASS | 0 | 사용자 승인 대기 |
