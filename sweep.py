import os
import asyncio,json,sys,collections
from harness import route, CHROME,NAV
from playwright.async_api import async_playwright
JS='''()=>{const out={};document.querySelectorAll('body *').forEach(e=>{if(e.offsetParent===null)return;const t=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();if(!t||!/[a-z]/i.test(t))return;const cs=getComputedStyle(e);if(cs.textTransform==='uppercase'){const sig=e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\\s+/).join('.'):'')+' < '+(e.parentElement.className||e.parentElement.tagName);out[sig]=t.slice(0,30)}});return out}'''
async def m(path,theme=None):
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=CHROME)
    c=await b.new_context(viewport={'width':1440,'height':900}); await c.route('**/*',route)
    pg=await c.new_page(); seed=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'seed.json')))
    await pg.goto('file://'+path); await pg.evaluate('(d)=>{localStorage.clear();for(const k in d)localStorage.setItem(k,d[k])}',seed)
    await pg.goto('file://'+path); await pg.wait_for_timeout(1200)
    allo={}
    for k in NAV:
      await pg.evaluate(f"navTo('{k}')"); await pg.wait_for_timeout(250)
      for s,t in (await pg.evaluate(JS)).items(): allo.setdefault(s,(k,t))
    for s,(k,t) in sorted(allo.items()): print(f'{k:12} {s[:70]:70} {t}')
    await b.close()
asyncio.run(m(sys.argv[1]))
