# sentinel-test-arena
Guinea pig repo for Sentinel Review E2E regression testing

## Smoke Check

Run `./smoke_check.sh` from this workspace to regenerate the minimal Symphony proof artifacts:

- `SYMPHONY_SMOKE_RESULT.md`
- `SYMPHONY_SMOKE_RESULT.json`

The script anchors itself to the issue workspace, verifies that `README.md` is present, and records the observed `.git` pointer and any `git status` failure caused by a missing worktree target.
