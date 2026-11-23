import sys, json, os, asyncio
HERE = os.path.dirname(os.path.abspath(__file__))
# Chromium: set CHROME_PATH to use a specific binary; otherwise Playwright's bundled browser is used
CHROME = os.environ.get('CHROME_PATH') or None
from playwright.async_api import async_playwright

CDN = os.path.join(HERE, 'node_modules') + '/'   # filled by `npm install` (see package.json)
MAP = {
 'pdf.js/3.11.174/pdf.min.js': CDN+'pdfjs-dist/build/pdf.min.js',
 'pdf.js/3.11.174/pdf.worker.min.js': CDN+'pdfjs-dist/build/pdf.worker.min.js',
 'xlsx/0.18.5/xlsx.full.min.js': CDN+'xlsx/dist/xlsx.full.min.js',
 'exceljs/4.4.0/exceljs.min.js': CDN+'exceljs/dist/exceljs.min.js',
 'jszip/3.10.1/jszip.min.js': CDN+'jszip/dist/jszip.min.js',
 'pdf-lib/1.17.1/pdf-lib.min.js': CDN+'pdf-lib/dist/pdf-lib.min.js',
}
NAV = ['dash','convert','history','hold','mapping','desk','appt','dlv','packing','invoice','mailinv','asn',
       'grn','qcom','fcw','dmc','reports','perf','sheet','book','integrations','backup','org','settings','help']

async def route(r):
    u = r.request.url
    for k, p in MAP.items():
        if u.endswith(k):
            return await r.fulfill(path=p, content_type='application/javascript')
    if u.startswith('file:') or u.startswith('data:'):
        return await r.continue_()
    return await r.abort()   # fonts / Apps Script: offline in tests

async def main(path, out, seed=None, w=1440, h=900, tag=''):
    os.makedirs(out, exist_ok=True)
    res = {'errors': [], 'views': {}}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        ctx = await b.new_context(viewport={'width': w, 'height': h})
        await ctx.route('**/*', route)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: res['errors'].append('PAGEERR ' + str(e)[:300]))
        pg.on('console', lambda m: m.type == 'error' and 'net::' not in m.text and 'Failed to load resource' not in m.text and res['errors'].append('CONSOLE ' + m.text[:300]))
        if seed:
            await pg.goto('file://' + path)
            await pg.evaluate('(d)=>{localStorage.clear();for(const k in d)localStorage.setItem(k,d[k])}', seed)
        await pg.goto('file://' + path)
        await pg.wait_for_timeout(1500)
        for k in NAV:
            before = len(res['errors'])
            try:
                await pg.evaluate(f"navTo('{k}')")
            except Exception as e:
                res['errors'].append(f'NAV {k}: {e}'[:300])
            await pg.wait_for_timeout(350)
            info = await pg.evaluate('''()=>{
              const vis=[...document.querySelectorAll('main *, #app *, body *')].filter(e=>e.offsetParent!==null);
              return {title:(document.getElementById('pageTitle')||{}).textContent||document.title,
                      buttons:vis.filter(e=>e.tagName==='BUTTON').length,
                      inputs:vis.filter(e=>/INPUT|SELECT|TEXTAREA/.test(e.tagName)).length,
                      tables:vis.filter(e=>e.tagName==='TABLE').length,
                      text:document.body.innerText.length,
                      hscroll:document.documentElement.scrollWidth>innerWidth+2}
            }''')
            info['newErrors'] = res['errors'][before:]
            res['views'][k] = info
            await pg.screenshot(path=f'{out}/{tag}{k}.png', full_page=False)
        res['storageKeys'] = await pg.evaluate('Object.keys(localStorage).sort()')
        await b.close()
    json.dump(res, open(f'{out}/{tag}result.json', 'w'), indent=1)
    print('errors', len(res['errors']))
    for e in res['errors'][:25]: print(' ', e)
    for k, v in res['views'].items():
        print(f"{k:13} btn={v['buttons']:3} in={v['inputs']:3} tbl={v['tables']} txt={v['text']:6} hs={v['hscroll']} {v['title'][:40]}")

if __name__ == '__main__':
    a = sys.argv
    seed = json.load(open(a[3])) if len(a) > 3 and a[3] != '-' else None
    w = int(a[4]) if len(a) > 4 else 1440
    h = int(a[5]) if len(a) > 5 else 900
    tag = a[6] if len(a) > 6 else ''
    asyncio.run(main(a[1], a[2], seed, w, h, tag))
