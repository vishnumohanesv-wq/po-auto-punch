import os
import asyncio, json, sys
from harness import route, CHROME, NAV
from playwright.async_api import async_playwright

GRAB = r'''()=>{
  const vis=e=>{ if(!e.offsetParent && getComputedStyle(e).position!=='fixed') return false;
    const r=e.getBoundingClientRect(), cs=getComputedStyle(e);
    return r.width>1 && r.height>1 && cs.visibility!=='hidden' && +cs.opacity>0.05; };
  const norm=t=>String(t||'').replace(/\d{1,2}:\d{2}(:\d{2})?/g,'T').replace(/\s+/g,' ').trim().slice(0,60).toLowerCase();
  const ctl=[...document.querySelectorAll('button,a,input,select,textarea,[role=button],summary,[onclick]')]
     .filter(vis).map(e=>e.tagName+':'+(e.id||'')+':'+norm(e.getAttribute('aria-label')||e.innerText||e.value||e.placeholder||e.title||e.getAttribute('onclick')));
  const ids=[...document.querySelectorAll('[id]')].filter(vis).map(e=>e.id);
  return {ctl:[...new Set(ctl)], ids:[...new Set(ids)]};
}'''

async def grab(path, vw, vh):
    out = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        c = await b.new_context(viewport={'width': vw, 'height': vh}); await c.route('**/*', route)
        pg = await c.new_page(); seed = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'seed.json')))
        await pg.goto('file://' + path)
        await pg.evaluate('(d)=>{localStorage.clear();for(const k in d)localStorage.setItem(k,d[k])}', seed)
        await pg.goto('file://' + path); await pg.wait_for_timeout(1500)
        for k in NAV:
            await pg.evaluate(f"navTo('{k}')"); await pg.wait_for_timeout(900)
            out[k] = await pg.evaluate(GRAB)
            # also open every <details> so collapsed panels are compared too
            await pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)")
            await pg.wait_for_timeout(200)
            out[k + '+open'] = await pg.evaluate(GRAB)
        await b.close()
    return out

async def main(a, b, vw, vh):
    A, B = await grab(a, vw, vh), await grab(b, vw, vh)
    lost = 0
    for k in A:
        for kind in ('ctl', 'ids'):
            EXPECT = {'BUTTON::style','BUTTON:styleBtn:style','fx','styleBtn','themeBtn','BUTTON:themeBtn:theme: auto'}
            miss = sorted(x for x in set(A[k][kind]) - set(B[k][kind]) if x not in EXPECT)
            new = sorted(x for x in set(B[k][kind]) - set(A[k][kind]) if x not in EXPECT)
            if miss: lost += len(miss); print(f'[{vw}] {k} MISSING {kind}:', miss)
            if new: print(f'[{vw}] {k} new {kind}:', new)
    print(f'[{vw}] total missing items:', lost)

asyncio.run(main(sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])))
