"""Split the legacy monolith into ordered source modules (legacy/src) and reassemble it byte-identically.
   split:    python3 tools/split.py split source/po-punch-pro-v4.0.html src
   assemble: python3 tools/split.py assemble src   (writes to stdout)"""
import sys, os, re, json
def split(path, out):
    s = open(path, encoding="utf-8").read(); os.makedirs(out, exist_ok=True)
    parts, pos, n = [], 0, 0
    for m in re.finditer(r"(<(script|style)\b[^>]*>)(.*?)(</\2>)", s, re.S):
        if m.group(1).startswith("<script") and "src=" in m.group(1): continue
        n += 1; kind = "js" if m.group(2) == "script" else "css"
        if "text/plain" in m.group(1): kind = "txt"
        tag = re.search(r"id=\"([\w-]+)\"", m.group(1)) or re.search(r"/\*\s*=+\s*([\w &/.-]{3,40}?)\s*=", m.group(3))
        body = m.group(3)
        cm = re.search(r"/\*\s*[=\-]*\s*([A-Za-z][\w &/.,()-]{3,40}?)\s*[=\-]*\s*\*/|^\s*//\s*[=\-]*\s*([A-Za-z][\w &/.,()-]{3,40})", body, re.M)
        fn = re.search(r"function\s+([A-Za-z_$][\w$]*)", body)
        label = (tag.group(1) if tag else (cm.group(1) or cm.group(2)) if cm else ("fn-" + fn.group(1)) if fn else "block").strip()
        label = re.sub(r"[^A-Za-z0-9-]+", "-", label)[:40].strip("-") or "block"
        name = "%03d-%s.%s" % (n, label, kind)
        parts.append({"markup": "%03d-markup.html" % n, "code": name})
        open(os.path.join(out, "%03d-markup.html" % n), "w", encoding="utf-8").write(s[pos:m.start(3)])
        open(os.path.join(out, name), "w", encoding="utf-8").write(m.group(3))
        pos = m.end(3)
    open(os.path.join(out, "zzz-tail.html"), "w", encoding="utf-8").write(s[pos:])
    json.dump({"parts": parts, "tail": "zzz-tail.html", "source": os.path.basename(path)}, open(os.path.join(out, "manifest.json"), "w"), indent=1)
    return len(parts)
def assemble(out):
    M = json.load(open(os.path.join(out, "manifest.json")))
    r = "".join(open(os.path.join(out, p["markup"]), encoding="utf-8").read() + open(os.path.join(out, p["code"]), encoding="utf-8").read() for p in M["parts"])
    return r + open(os.path.join(out, M["tail"]), encoding="utf-8").read()
if __name__ == "__main__":
    if sys.argv[1] == "split": print(split(sys.argv[2], sys.argv[3]), "modules")
    else: sys.stdout.write(assemble(sys.argv[2]))
