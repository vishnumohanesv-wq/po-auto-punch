# PO Punch ERP

Monorepo for turning **PO Punch Pro** (single-file browser tool) into a multi-user, SAP-style supply-chain ERP.

| Path | What | Status |
|---|---|---|
| `legacy/` | The current tool. `src/` = 47 modules, `tools/build.py` → `index.html` (**v7.0**), browser regression suite | Phase 0 ✔ |
| `packages/parsers/` | Pure, tested business logic (paise money, ISO dates, GSTIN, FirstCry, MRP rule, MOQ, Purplle open PO) | Phase 0 ✔ (9 golden tests) |
| `apps/api`, `apps/web`, `infra/` | NestJS API, React web, docker-compose | Phase 1 |
| `docs/` | ANALYSIS (inventory, bugs, rules), ERD, API, ADRs, PHASE0_REPORT | ✔ |

```bash
cd legacy && python3 tools/split.py split source/po-punch-pro-v4.0.html src && cd ..   # first time: create legacy/src
cd packages/parsers && npm test                       # unit + golden + parity tests
cd legacy && python3 tools/build.py src index.html    # build the tool
bash legacy/tools/run_tests.sh                        # full browser regression (see legacy/tools/README.md)
```
The website is `index.html` at the top of this repository (a copy of `legacy/index.html`, v7.2). GitHub Pages: Settings → Pages → main / (root).
