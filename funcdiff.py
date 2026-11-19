import os
import asyncio, json, sys
from harness import route, CHROME
from playwright.async_api import async_playwright

ACTIONS = r'''async ()=>{
  const out={}; window.__dl=[];
  window.download=async (blob,name)=>{ window.__dl.push([name.replace(/\d{4}-\d{2}-\d{2}/,'DATE'), await blob.text()]); };
  const strip=t=>String(t).replace(/\d{1,2}:\d{2}(:\d{2})?\s*(am|pm)?/gi,'T').replace(/\s+/g,' ').trim();
  // 1. PO conversion via the app's own sample (Reliance, EAN paste)
  loadDemo(); await new Promise(r=>setTimeout(r,500));
  out.rows = JSON.stringify(rows.map(r=>[r.sku,r.code,r.qty,r.price,r.mapped,r.warn]));
  out.outputTable = strip((document.getElementById('outputCard')||{}).textContent||'');
  easyCsvMain(); await new Promise(r=>setTimeout(r,200));
  // 2. Mapping applied on a second conversion
  setMode('reliance'); document.getElementById('input').value='8901000000011\t10\t349\n8901000000099\t5\t120'; convert();
  await new Promise(r=>setTimeout(r,300));
  out.rows2 = JSON.stringify(rows.map(r=>[r.sku,r.code,r.qty,r.price,r.mapped]));
  easyCsvMain(); await new Promise(r=>setTimeout(r,200));
  try{ exportCSV(); }catch(e){ out.exportErr=String(e); }
  await new Promise(r=>setTimeout(r,200));
  // 3. Dashboard / register / desk computations
  navTo('dash'); await new Promise(r=>setTimeout(r,2500));
  out.kpis = strip(document.getElementById('ccKpis').innerText);
  out.lifecycle = strip((document.querySelector('.cc-lc')||{}).textContent||'');
  out.bookSummary = strip(bkSummaryText());
  bkCsv(); await new Promise(r=>setTimeout(r,200));
  navTo('desk'); await new Promise(r=>setTimeout(r,300));
  out.deskCount = document.querySelectorAll('.hx-item').length;
  out.deskLate = document.querySelectorAll('.hx-item.late').length;
  // 4. Storage after all actions (timestamps normalised)
  const ls={}; Object.keys(localStorage).sort().forEach(k=>{ ls[k]=String(localStorage.getItem(k)).replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/g,'TS').replace(/\d{1,2}\/\d{1,2}\/\d{4}, [\d:]+ [AP]M/g,'TS').replace(/"t":\[[\d,]+\]/g,'"t":[]').replace(/\b1\d{12}\b/g,'MS'); });
  delete ls.po_all_skin;                       // intentionally changed: pro -> enterprise
  out.storage = ls;
  out.downloads = window.__dl.map(([n,t])=>[n.replace(/\d{13}/,'MS'), t.replace(/\d{4}-\d{2}-\d{2}/g,'DATE')]);
  return out;
}'''

async def run(path):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        c = await b.new_context(viewport={'width': 1440, 'height': 900}, timezone_id='Asia/Kolkata')
        await c.route('**/*', route)
        pg = await c.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        seed = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'seed.json')))
        await pg.goto('file://' + path)
        await pg.evaluate('(d)=>{localStorage.clear();for(const k in d)localStorage.setItem(k,d[k])}', seed)
        await pg.goto('file://' + path); await pg.wait_for_timeout(1200)
        o = await pg.evaluate(ACTIONS); o['errors'] = errs
        await b.close(); return o

async def main(a, b):
    A, B = await run(a), await run(b)
    same = True
    for k in A:
        if A[k] != B.get(k):
            same = False
            if k == 'storage':
                for kk in sorted(set(A[k]) | set(B[k])):
                    if A[k].get(kk) != B[k].get(kk): print('DIFF storage', kk, str(A[k].get(kk))[:120], '|', str(B[k].get(kk))[:120])
            else:
                print('DIFF', k, '\n  A:', str(A[k])[:300], '\n  B:', str(B[k])[:300])
    print('downloads:', [d[0] for d in A['downloads']])
    print('rows:', A['rows'][:200]); print('rows2:', A['rows2'][:200])
    print('storage keys compared:', len(A['storage']), '| errors', A['errors'], B['errors'])
    print('IDENTICAL' if same else 'DIFFERENCES FOUND')

asyncio.run(main(sys.argv[1], sys.argv[2]))
