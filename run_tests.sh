#!/usr/bin/env bash
# Rebuilds index.html from the v4.0 source, then runs the full regression suite.
# One-time setup:  pip install -r tools/requirements.txt && python -m playwright install chromium
#                  (cd tools && npm install)
set -euo pipefail
cd "$(dirname "$0")/.."
ORIG=source/po-punch-pro-v4.0.html
BUILD=index.html
T=tools

echo "== Build (original design; pass --design enterprise to build.py for the v5.0 redesign)"
python3 $T/build.py $ORIG $BUILD

cd $T
O=$(cd .. && pwd)/$ORIG; B=$(cd .. && pwd)/$BUILD; OUT=$(mktemp -d)
fail=0
for vp in "1440 900" "820 1180" "390 844"; do
  r=$(python3 harness.py "$B" "$OUT/${vp%% *}" seed.json $vp)
  e=$(echo "$r" | head -1); h=$(echo "$r" | grep -c "hs=True" || true)
  echo "== All modules at ${vp/ /x}: $e, sideways-scroll screens: $h"
  [[ "$e" == "errors 0" && "$h" == "0" ]] || fail=1
done
e=$(python3 harness.py "$B" "$OUT/dark" seed_dark.json | head -1); echo "== Dark mode: $e"; [[ "$e" == "errors 0" ]] || fail=1
r=$(python3 funcdiff.py "$O" "$B" | tail -1); echo "== Outputs vs v4.0: $r"; [[ "$r" == "IDENTICAL" ]] || fail=1
for vp in "1440 900" "390 844"; do
  r=$(python3 uidiff.py "$O" "$B" $vp | tail -1); echo "== Missing controls: $r"; [[ "$r" == *"items: 0" ]] || fail=1
done
LOOKS=graphite,pro,emerald,porcelain,indigo,material
r=$(python3 lookstest.py "$B" $LOOKS | tail -1); echo "== Style picker: $r"; [[ "$r" == "LOOKS TESTS PASSED" ]] || fail=1
for sk in ${LOOKS//,/ }; do
  r=$(python3 stylediff.py "$O" "$B" $sk 1440 900 | tail -1); echo "== Design & animation ($sk skin): $r"; [[ "$r" == *"25/25"* ]] || fail=1
done
echo "== Backup & restore"; python3 restoretest.py "$O" "$B"
[[ $fail == 0 ]] && echo "ALL CHECKS PASSED" || { echo "SOME CHECKS FAILED"; exit 1; }
