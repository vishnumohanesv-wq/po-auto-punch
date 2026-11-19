# Code audit and status (v4.0 → v5.3)

| # | Finding (v4.0) | Status |
|---|---|---|
| 1 | Restore button did nothing; downloaded backups could not be restored | **Fixed in 5.1** (tested in `tools/restoretest.py`) |
| 2 | Downloaded backups left out report and verification data | **Fixed in 5.1** |
| 3 | Secret keys sent in URL query strings | Open; needs matching Apps Script change |
| 4 | "Late" = no stage change in 4 hours, hardcoded; doesn't separate buyer appointment waits | Open; needs a business-rule decision |
| 5 | Purplle detected anywhere the word appears, before 4 other buyers | Open; needs sample POs to change safely |
| 6 | Element ID `asnOut` used twice | Open (harmless today) |
| 7 | 17 timers; history re-parsed every second | Open; Phase 3 |
| 8 | 239 empty `catch` blocks hide errors | Open |
| 9 | ~420 KB CSS across 20 blocks and 42 skins | **Reduced in 5.3**: six looks ship, unchanged; CSS for the other 36 removed |
| 10 | Many font families loaded | **Reduced in 5.3**: fonts used only by removed looks dropped |

## Not yet tested
- Real buyer PDFs for all 7 buyers (needs sample POs).
- Live Google Sheets, Gmail and quick-commerce sync (tests run offline).
- Printing.
