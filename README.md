# sentinel-test-arena
Guinea pig repo for Sentinel Review E2E regression testing

## Latest additions
- Added `hello-world.txt` as a concrete artifact for the NIN-66 smoke test so the workout harness can detect file creation/removal without touching production assets.

To exercise the new smoke test, check that `hello-world.txt` is present and contains the expected greeting before running the broader Sentinel smoke suite.
