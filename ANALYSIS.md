# PO Punch Pro: analysis (input: index.html v6.3, 1,338,919 bytes)

Line numbers refer to the uploaded v6.3 file. The file is generated: `legacy/src/` (47 modules) + `legacy/tools/build.py`.

## (a) Feature inventory

| Area | Screen (nav key) | What it does | Data |
|---|---|---|---|
| PO intake | PO Processing (`convert`) | PDF/Excel/ZIP/paste → per-buyer parser (7 buyers) → spot check (mapping, qty, amount vs printed total, MRP) → EasyEcom rows/CSV, Master row | `po_all_history`, maps |
| | Processing History (`history`) | Last 60 POs (+starred), reopen, delete | `po_all_history` |
| | PO Hold & Cancellation (`hold`) | Hold list, MOQ near/far/Purplle, freight %, ageing, reports | `po_hold_list`, `po_hold_cfg` |
| | SKU Mapping (`mapping`) | EAN/FCID/article → EasyEcom SKU per buyer | `po_all_map_*` |
| | FirstCry rate fix + EasyEcom MRP (v5.6) | Auto-correct to EasyEcom MRP at PO margin; inventory CSV as MRP source; conflicts flagged | `po_fc_fix`, `po_ee_mrp` |
| | Purplle bulk (batch card) | Many POs (PDF / EXECL_ATTACHED / open PO master Excel) → per-PO or combined CSVs, Master rows | `po_lo_extra` |
| | New POs from mail (v6.1) | Apps Script watcher on ops@ → list → auto check & process → report | `po_pm_*` |
| Fulfilment | Dispatch Management (`desk`) | Stage board 0–4, tags, packing/label messages, follows Master (v6.0) | `po_desk` |
| | Packing List (`packing`) | Reliance packing list builder (SAP code, shelf, capacity) | config |
| | Appointment Management (`appt`) | Master-driven board (today/tomorrow/7 days/missed/late/requested), daily alert, manual lifecycle | `ms_master`, `po_life` |
| | Delivery Tracking (`dlv`) | Lifecycle records: transit, delivered, POD | `po_life` |
| Documents | Invoice Verification (`invoice`) | PO vs invoice compare; Purplle ASN; Reliance packing; Maharaja bill | session |
| | Bulk Invoice Check (`mailinv`) | Gmail invoice collector (Apps Script) | `po_gm_*` |
| | Purplle ASN (`asn`) | SKU_Data builder, invoice PDFs, appointment list | session |
| | GRN Sync (`grn`) | FirstCry/Purplle GRN to Master | session |
| Channel ops | Quick Commerce Sync (`qcom`), FirstCry Weekly (`fcw`) | Weekly Qcom sheet sync, FC weekly report | `rp_*` |
| Finance | Demurrage & Courier (`dmc`) | Maharaja demurrage cause/action per row | session |
| Analytics | Executive Overview (`dash`), Performance (`perf`), Reports (`reports`), Master records (`sheet`), Operations Register (`book`) | KPIs, buyer/warehouse/channel charts, Record Book | `po_record_book`, `ms_master` |
| Admin | Integrations, Backup & Restore, Org & Branding, Settings, Help | Apps Script links, IndexedDB safety copies, brand, zones/WH | `po_gs_*`, IDB |

Buyers parsed: Reliance Retail, Tata 1MG, FirstCry, Purplle, Health & Glow, DMart, FirstClub. Nodes: Emiza BLR, Emiza GGN, Delhivery MUM, Delhivery KOL.

## (b) Bug list (v6.3 line numbers)

| # | Line(s) | Problem | Phase 0 status |
|---|---|---|---|
| B1 | 4310 vs 4766 | `bkRows` defined twice in one block; the ASN version wins, so Record Book **CSV/Excel export silently did nothing** | **Fixed** (`bkBookRows`), proven by test |
| B2 | 4448 vs 6822 | `asnClear` overridden by the PO-list cleaner: ASN builder **"Clear all" (913) and "Clear" (945) did not clear** POs/invoices | **Fixed** (`asnPoClear` for the cleaner), proven |
| B3 | 3010, 5192, 5456, 5787, 5849, 7651, 7657, 7711, 9405, 9741, 10004, 10211 | 12 stacked `navTo` wrappers; order-dependent, hard to reason about | **Fixed**: 10 → `po:nav-base`/`po:nav` listeners (same order, same key); page router kept |
| B4 | 3014, 5438, 7649, 8014, 8016, 8282, 8328, 8338, 8455, 8875, 9407, 10003 | DOM pollers every 1–6 s re-parsing storage | **Fixed**: `poWatch` (data/nav/input-driven + 10 s safety); idle work −41% |
| B5 | 9623, 9762 | `eval()` to read app globals | **Fixed**: `PO_STATE.get()` allow-list |
| B6 | 2848, 8482 | Secret key in URL query (Sheet ping, Gmail ZIP) → browser history + Google logs | Open: needs matching Apps Script change; removed in Phase 1 (server holds secrets) |
| B7 | localStorage | `po_gs_key`, `po_gm_key`, `po_pm_key` stored in the browser | Open → Phase 1 (server-side secrets) |
| B8 | 85× `toFixed(2)`, 31× `parseFloat` | Float money | Open in legacy; `packages/parsers/money.js` (paise) used by all new code |
| B9 | 4 ad-hoc date parsers | dd/mm ambiguity | Open in legacy; `dates.js` rejects ambiguous input |
| B10 | 1853 | DMart supplier GSTIN is a placeholder (`27AAAAA0000A1Z5`, fails checksum); CGST+SGST assumed always | Flagged → OPEN_QUESTIONS Q6 |
| B11 | 2920, 2928 | "Waiting > 4h" hardcoded; counts buyer-side appointment waits as delays | Flagged → Q7 |
| B12 | detectMode | Purplle detected if the word "purplle" appears anywhere (before 4 buyers) | Flagged → Q8 |
| B13 | 51 names | Other duplicate names (`renderDash`×3, `toast`×6, `msg`×4) are mostly scoped inside IIFEs; listed in `legacy/docs/duplicates.json` | Reviewed; only B1/B2 were live clashes |

## (c) Business-rule catalogue (from code)

| Rule | Where | Value / logic |
|---|---|---|
| MOQ (hold) | `hdMoq`, `hdCfg` | Near node ₹15,000 · far ₹25,000 · Purplle flat ₹20,000 (any location). Near = location text matches node keywords |
| Freight cap | `hdCfg.cap` | 10 % of PO value; ageing amber > 3 days, red > 7 |
| FirstCry MRP | `fcFixItem` (v5.6) | EasyEcom MRP is final; rate = PO rate × EE MRP ÷ PO MRP; manual rate fix wins; CSV-vs-built-in conflict → not corrected |
| FirstCry line | `extractFirstcryItems` | FCID(8) · HSN+EAN+Style cells · MRP · base · GST% · landing rate · qty · amount; totals vs "Sub Total" |
| Purplle price | `extractLofoodsItems`, open PO master | EasyEcom price = net × (1 + CGST + SGST + IGST), 2 dp; line total = net value + tax amounts |
| EasyEcom rounding | verify(), L2614 | Price rounded to 2 dp per unit → paise-level differences vs PO line totals are expected |
| GST % snap | L1715 | Parsed GST snaps to nearest of 0/5/12/18/28 |
| DMart tax | L1853 | Always CGST+SGST (Maharashtra → Maharashtra) |
| Dispatch stages | `DK_ST` | 0 Processing · 1 Packing pending · 2 Packed · 3 Ready (label) · 4 Dispatched; late = no stage change > 4 h |
| Master → board | v6.0 | cancelled/RTO removed · delivered/dispatched → 4 · label → 3 · packed → 2 · newer board change kept · open POs ≤ 45 days added |
| Appointments | v5.5 | Missed = appt date passed & not delivered; late = delivered after appt date; on-time % = last 30 days |
| Lifecycle alerts | `po_life_cfg` | Buyer confirmation delay 2 d, warehouse packing 1 d, courier in-transit 6 d (defaults) |
| Demurrage | DMC | Free days 10, rate ₹2/kg/day (defaults, editable) |
| Purplle batch | renderLoBatch | POs older than 3 weeks move to History |
| Mail intake | Apps Script | Channels by sender/subject; replies/forwards ignored except JIT forwards; unreadable POs never marked processed |

## (d) Proposed ERD and API → see `ERD.md`, `API.md`.
