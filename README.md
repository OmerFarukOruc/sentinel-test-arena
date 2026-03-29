# sentinel-test-arena
Guinea pig repo for Sentinel Review E2E regression testing. This workspace is dedicated to the NIN-65 smoke test.

## Smoke Check

Run `./smoke_check.sh` from this workspace to regenerate the minimal Symphony proof artifacts.

- `SYMPHONY_SMOKE_RESULT.md`
- `SYMPHONY_SMOKE_RESULT.json`

The script anchors itself to the issue workspace, verifies the README is readable, and records the observed node, file hash, and any `git status` failure caused by a missing worktree target.

`smoke_check.sh` is intentionally minimal: it keeps the workspace listing in sync, captures the SHA-256 of `README.md`, and writes a short narrative proof along with a structured JSON record.
