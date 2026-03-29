# sentinel-test-arena
Guinea pig repo for Sentinel Review E2E regression testing.

## Smoke test scaffold
- `hello-world.txt` is a tiny artifact that proves the workspace clone succeeded and can be read by automation pipelines.
- `scripts/run-hello-world-smoke.sh` reads `hello-world.txt` and reports the contents so a smoke job can signal success before chaos testing begins.
- Run `./scripts/run-hello-world-smoke.sh` to verify the smoke harness before you push other E2E artifacts.
