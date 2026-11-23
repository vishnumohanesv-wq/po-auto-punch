"""Remove CSS that only applies to the 41 retired skins and their skin-only layout attributes.
A selector is dropped only if it requires an html attribute value that can no longer occur:
  data-skin="<anything but enterprise>"  (positive match, not inside :not())
  data-lay/shape/type/head/motion/hover/amb="..."  (only ever set by skin personalities)
Rules whose every selector is dropped are removed; mixed rules keep their surviving selectors.
At-rules (@media, @supports, @keyframes) are recursed into; empty ones are removed."""
import re, tinycss2, sys, collections

DEAD = re.compile(r'\[data-(skin|lay|shape|type|head|motion|hover|amb)(?:="([^"]*)")?\]')
# What survives. Default = enterprise build. build.py sets these for a chosen set of looks.
KEEP_SKINS = {'enterprise'}
KEEP_ATTR = {}          # e.g. {'lay': {'float','top'}, 'motion': {'zoom','blur'}}
stats = collections.Counter()

def split_top(sel):
    out, depth, cur = [], 0, ''
    for ch in sel:
        if ch in '([': depth += 1
        elif ch in ')]': depth -= 1
        if ch == ',' and depth == 0:
            out.append(cur); cur = ''
        else:
            cur += ch
    out.append(cur)
    return out

def strip_not(sel):
    # remove :not(...) groups (balanced) so attributes inside them don't count as requirements
    res, i = '', 0
    while i < len(sel):
        if sel.startswith(':not(', i):
            d, j = 0, i + 4
            while j < len(sel):
                if sel[j] == '(': d += 1
                elif sel[j] == ')':
                    d -= 1
                    if d == 0: break
                j += 1
            i = j + 1
        else:
            res += sel[i]; i += 1
    return res

def dead(sel):
    core = strip_not(sel)
    for m in DEAD.finditer(core):
        attr, val = m.group(1), m.group(2)
        if val is None: continue                       # generic "any skin / any layout" rules still apply
        if attr == 'skin':
            if val not in KEEP_SKINS: return True
        elif val not in KEEP_ATTR.get(attr, ()):
            return True
    return False

def process(nodes):
    out = []
    for n in nodes:
        if n.type == 'qualified-rule':
            sels = [s.strip() for s in split_top(tinycss2.serialize(n.prelude))]
            keep = [s for s in sels if not dead(s)]
            stats['sel_total'] += len(sels); stats['sel_dropped'] += len(sels) - len(keep)
            if not keep:
                stats['rule_dropped'] += 1; continue
            out.append(','.join(keep) + '{' + tinycss2.serialize(n.content) + '}')
        elif n.type == 'at-rule':
            kw = n.lower_at_keyword
            if n.content is not None and kw in ('media', 'supports', 'container', 'layer'):
                inner = process(tinycss2.parse_rule_list(n.content, skip_comments=True, skip_whitespace=True))
                if inner.strip():
                    out.append('@' + n.at_keyword + tinycss2.serialize(n.prelude) + '{' + inner + '}')
                else:
                    stats['at_dropped'] += 1
            else:
                out.append(tinycss2.serialize([n]))
        elif n.type == 'error':
            stats['parse_errors'] += 1
    return ''.join(out)

def strip_css(css):
    rules = tinycss2.parse_stylesheet(css, skip_comments=True, skip_whitespace=True)
    return process(rules)

def run(html):
    def rep(m):
        attrs, body = m.group(1), m.group(2)
        new = strip_css(body)
        return '<style' + attrs + '>' + new + '</style>' if new.strip() else ''
    # only top-level <style> blocks: never touch <style> text that lives inside <script> strings
    parts = re.split(r'(<script\b[^>]*>.*?</script>)', html, flags=re.S)
    for i in range(0, len(parts), 2):
        parts[i] = re.sub(r'<style([^>]*)>(.*?)</style>', rep, parts[i], flags=re.S)
    return ''.join(parts)

if __name__ == '__main__':
    src = open(sys.argv[1], encoding='utf-8').read()
    out = run(src)
    open(sys.argv[2], 'w', encoding='utf-8').write(out)
    print(dict(stats), len(src), '->', len(out))
