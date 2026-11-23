# Phase 0 report: stabilise the current tool (v7.0)

## What changed
| Area | Change | Files |
|---|---|---|
| Structure | Monorepo; legacy tool split into 47 modules, byte-identical reassembly; build from modules | `legacy/src/*`, `legacy/tools/split.py`, `legacy/tools/build.py` |
| Bugs | Record Book export (bkRows clash), ASN "Clear all" (asnClear clash) | `legacy/tools/phase0.py` |
| Navigation | 12 stacked navTo wrappers → 1 router + `po:nav-base`/`po:nav` events (order + arguments preserved) | `phase0.py` |
| Polling | 12 DOM pollers → `poWatch` (change-driven); clocks/time jobs kept | `phase0.py` (po-core) |
| Globals | `eval()` → `PO_STATE.get()` | `phase0.py` |
| Rules | Pure functions with golden tests; FirstCry parity test against legacy code | `packages/parsers/*` |
| Docs | Inventory, bugs with lines, rules catalogue, ERD, API, ADRs, open questions | `docs/*`, `OPEN_QUESTIONS.md` |
| CI | Parser tests + full browser regression on every push | `.github/workflows/ci.yml` |

## How to run
```bash
cd packages/parsers && npm test
cd legacy && python3 tools/build.py src index.html
bash legacy/tools/run_tests.sh        # needs: pip install -r legacy/tools/requirements.txt; playwright install chromium; (cd legacy/tools && npm install)
```

## Test results (this build)
| Suite | Result |
|---|---|
| Parsers (money, dates, GST, FirstCry golden + unparsed + parity, MRP rule, MOQ, Purplle golden) | **9/9 pass** |
| All 25 modules at 1440 / 820 / 390 px | 0 errors, 0 sideways scroll |
| Outputs vs v4.0 (rows, EasyEcom CSVs, KPIs, storage) | **identical** |
| Restore, 6 looks, Appointments, Dispatch←Master, Mail, Purplle Excel, FirstCry MRP, compact layout | all pass |
| Phase 0 before/after (v6.3 → v7) | Record Book CSV: no file → 36 rows · ASN Clear all: [1,1] → [0,0] · idle work 132 → 78 (−41%) |
| Script syntax (node --check, 32 scripts) | 0 errors |

## What is risky
- `poWatch` refreshes on data/nav/input + 0.6/1.5/3 s settle + 10 s safety. A panel that updated from background work with no user action may now lag up to 10 s (was 1–1.5 s). None found in tests.
- Secrets still live in the browser and two calls still put keys in URLs (B6, B7): only fixable with a server (Phase 1).
- Legacy screens still use float money and mixed dates; new code uses `packages/parsers`.

## Questions before Phase 1 (max 5)
1. **Backend language:** TypeScript (NestJS, shares parsers with the browser) as proposed, or Python (FastAPI)?
2. **Look:** your brief says light/dark only (drop the skins); you chose to keep Graphite Lime + 5 looks. For the new ERP web app: Graphite Lime as dark + one light theme?
3. **Hosting & sign-in:** Google Workspace SSO for tucokids.com? Where should Postgres run (e.g. Google Cloud SQL Mumbai, Supabase, Neon) and is there a monthly budget?
4. **Master Tracker transition:** after import the database is the source of truth. Who still edits the Google Sheet (warehouse partners?), and do we need two-way sync for a period?
5. **EasyEcom:** do you have API credentials (punch via API in Phase 2), or CSV only for now?

## Next: Phase 1 plan (starts on "continue")
docker-compose (Postgres, Redis, API, worker, web) · Prisma schema from docs/ERD.md (company/plant RLS, number ranges, audit log, document flow) ·
auth (SSO/MFA) + 6 roles · master-data screens (materials, buyers/ship-to, maps, MRP, carriers, MOQ) · importer for Master Tracker + SKU maps + MRP list
with dry-run diff and rollback · secrets moved server-side (Apps Script keys, Sheet URLs) · seed with synthetic data · tests per role.
