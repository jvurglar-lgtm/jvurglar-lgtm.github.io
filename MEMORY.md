# MEMORY.md

## Goal
- Build a static, responsive personal portfolio for `jvurglar-lgtm` with a `Games` section.
- Current request: game-developer profile copy, Facebook-style theme, Snake game, and a Tetris mini-game.

## Scope
- In: responsive layout, top navigation, profile content, Snake/Tetris mini-games, GitHub Pages compatibility.
- Out: backend, database, auth flows, server rendering, analytics, and non-static deployment targets.

## Execution
- Mode: `CLAUDE_VERIFIER`
- Claude model: `claude-sonnet-4-6`
- Last local test result: `PASS`

## Current State
- State: `TESTS_PASSED`
- Current loop: implementation complete for the step-9 request; deployment not run yet.
- Next loop: deploy approval / release steps, if requested.
- Retry: `0`
- Last normal commit/reference: `d392efd` / `https://jvurglar-lgtm.github.io`
- Git state: dirty
- Rollback anchor: return to `d392efd` if a rollback is needed.

## Acceptance
- Page is responsive on desktop and mobile.
- `Games` section includes Snake and Tetris.
- Snake and Tetris are playable with keyboard and touch controls.
- GitHub Pages serves the site without errors.

## Guardrails
- Do not expose tokens, secrets, or GitHub credentials.
- Do not commit generated secrets or machine-specific files.
- Do not remove user-owned unrelated changes.
- Do not deploy or push without approval.

## Notes
- `[사람 확인 필요]` stays on any claim that could imply real-world experience or biography.
- Tetris rule details were implemented as a reasonable browser-game approximation.
