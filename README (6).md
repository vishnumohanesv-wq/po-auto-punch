# Tools

| File | Purpose |
|---|---|
| `build.py` | Builds `index.html` from `source/po-punch-pro-v4.0.html`: original design plus fixes. `--looks a,b,c` chooses which looks ship (first = default; `all` keeps 42). `--design enterprise` builds the v5.0 redesign instead. Every edit is anchored to exact code and stops if the anchor has moved. |
| `strip.py` | Removes CSS used only by looks that are not shipped (keeps every layout and animation rule the shipped looks use). Never touches `<style>` text inside scripts. |
| `ds.css` | Enterprise build only: the v5.0 design system. `E` expands to `html[data-skin="enterprise"]`. |
| `stylediff.py` | Compares computed styles and animation definitions of every element against v4.0, per look. |
| `appt_master.js` | The Master-driven appointments section and daily alerts (inserted by `build.py`). |
| `appttest.py` | Appointments: tabs and counts, daily alert once a day, badge, bell, search, WhatsApp copy (made-up data). |
| `lookstest.py` | Style picker: first-run default, fallback for removed looks, every look selectable by click and key. |
| `pixeldiff.py` | Pixel comparison (informational; animations make it noisy). |
| `run_tests.sh` | Build plus the whole suite. |
| `harness.py` | Opens all 25 modules; reports errors and sideways scrolling. |
| `funcdiff.py` | Runs the same actions on v4.0 and the build; outputs must be identical. |
| `uidiff.py` | Lists any button or control present in v4.0 but missing from the build. |
| `restoretest.py` | Backup download and restore, end to end. |
| `sweep.py` | Finds remaining all-caps labels. |
| `shots.py` | Screenshots for the README. |
| `seed*.json` | Synthetic test data (made-up POs). No real data. |

Set `CHROME_PATH` to use a specific Chromium; otherwise Playwright's bundled browser is used.
