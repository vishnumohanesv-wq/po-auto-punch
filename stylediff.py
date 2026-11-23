"""Design-equivalence check: computed styles + animation definitions of every visible element, per module.
Deterministic (no timing noise). Identical output = identical design and animations."""
import asyncio, json, os, sys
from harness import route, NAV, CHROME
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
PROPS = ['display','position','color','background-color','background-image','font-family','font-size','font-weight',
 'letter-spacing','text-transform','line-height','border-top','border-left','border-radius','box-shadow','padding','margin',
 'width','height','gap','grid-template-columns','animation-name','animation-duration','animation-timing-function',
 'animation-delay','animation-iteration-count','transition','backdrop-filter','cursor','z-index']
GRAB = '''(P)=>{ const out=[]; let i=0;
  for (const e of document.querySelectorAll('body *')){
    if (!e.offsetParent && getComputedStyle(e).position!=='fixed') continue;
    if (e.closest('#apMaster,#apDaily,#poChk,#jumpBar') || ['nbAppt','densBtn','toTop'].includes(e.id)) continue;   // v5.4 appointment section: new by design
    const cs=getComputedStyle(e), b=getComputedStyle(e,'::before'), a=getComputedStyle(e,'::after');
    let t=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim().slice(0,40);
    out.push([e.tagName, e.id, String(e.className).slice(0,60), t, P.map(p=>cs.getPropertyValue(p)).join('|'),
      [b.content,b.backgroundColor,b.animationName].join('|'), [a.content,a.backgroundColor,a.animationName].join('|')]);
  } return out; }'''
# live / counting values that legitimately change between runs
VOLATILE = ('clockTime','clockDate','sbClock','dkClock','abClock')

async def grab(path, skin, vw, vh):
    res = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        c = await b.new_context(viewport={'width': vw, 'height': vh}); await c.route('**/*', route)
        pg = await c.new_page()
        seed = json.load(open(os.path.join(HERE, 'seed.json'))); seed['po_all_skin'] = skin; seed['po_pro_seen'] = '1'; seed['po_density'] = 'comfortable'
        await pg.goto('file://' + path)
        await pg.evaluate('(d)=>{localStorage.clear();for(const k in d)localStorage.setItem(k,d[k])}', seed)
        await pg.goto('file://' + path); await pg.wait_for_timeout(1500)
        res['skin'] = await pg.evaluate("document.documentElement.dataset.skin")
        for k in NAV:
            await pg.evaluate(f"navTo('{k}')"); await pg.wait_for_timeout(2500)
            res[k] = await pg.evaluate(GRAB, PROPS)
        await b.close()
    return res

def clean(rows):
    out = []
    for r in rows:
        if r[1] in VOLATILE or any(r[1].startswith(v) for v in VOLATILE): r = r[:3] + ['~'] + r[4:]
        if r[2] in ('vtag',): r = r[:3] + ['~'] + r[4:]          # version label text changes by design
        if any(ch.isdigit() for ch in r[3]):                               # live numbers / timers
            st = r[4].split('|'); st[PROPS.index('width')] = st[PROPS.index('height')] = '~'
            r = r[:3] + ['#', '|'.join(st)] + r[5:]
        st = r[4].split('|')
        if r[2] == 'wrap':                                  # page container: centring margin/height settle at different moments
            for p in ('margin', 'height'): st[PROPS.index(p)] = '~'
        if st[PROPS.index('animation-name')] != 'none':     # running animation: compare its definition, not the in-flight frame
            for p in ('box-shadow', 'background-color', 'color', 'border-top', 'border-left', 'background-image'): st[PROPS.index(p)] = '~'
        r = r[:4] + ['|'.join(st)] + r[5:]
        out.append(tuple(r))
    return out

async def main(a, b, skin, vw, vh):
    A, B = await grab(a, skin, vw, vh), await grab(b, skin, vw, vh)
    print(f'skin applied: {A["skin"]} / {B["skin"]}')
    same = 0
    for k in NAV:
        x, y = clean(A[k]), clean(B[k])
        if x == y: same += 1; continue
        import difflib
        d = [l for l in difflib.unified_diff([str(r) for r in x], [str(r) for r in y], lineterm='', n=0) if l[:1] in '+-' and l[:3] not in ('+++','---')]
        print(f'  {k}: {len(x)} vs {len(y)} elements differ:')
        for ra, rb in [(ra, rb) for ra, rb in zip(x, y) if ra != rb][:4]:
            sa, sb = ra[4].split('|'), rb[4].split('|')
            props = [(PROPS[j], sa[j], sb[j]) for j in range(len(PROPS)) if sa[j] != sb[j]]
            print(f'     <{ra[0].lower()} id={ra[1]!r} class={ra[2][:30]!r}>', props, '(pseudo-elements differ)' if ra[5:] != rb[5:] else '')
    print(f'{skin} {vw}x{vh}: {same}/{len(NAV)} modules identical in design and animation')
asyncio.run(main(sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])))
