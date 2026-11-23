"""README screenshots: python3 tools/shots.py index.html  (writes docs/screenshots/)"""
import asyncio, json, os, sys
from harness import route, CHROME
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, '..', 'docs', 'screenshots')
async def shot(path, skin, views, vw=1440, vh=900, prefix=''):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        c = await b.new_context(viewport={'width': vw, 'height': vh}); await c.route('**/*', route)
        pg = await c.new_page(); seed = json.load(open(os.path.join(HERE, 'seed.json')))
        seed['po_all_skin'] = skin; seed['po_pro_seen'] = '1'
        await pg.goto('file://' + path)
        await pg.evaluate('(d)=>{localStorage.clear();for(const k in d)localStorage.setItem(k,d[k])}', seed)
        await pg.goto('file://' + path); await pg.wait_for_timeout(1500)
        for v, name in views:
            await pg.evaluate(f"navTo('{v}')"); await pg.wait_for_timeout(3000)
            await pg.screenshot(path=os.path.join(OUT, prefix + name + '.png'), animations='disabled')
        await b.close()
async def main(path):
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT): os.remove(os.path.join(OUT, f))
    await shot(path, 'graphite', [('dash', 'dashboard'), ('convert', 'po-processing'), ('desk', 'dispatch')])
    await shot(path, 'graphite', [('dash', 'dashboard-mobile')], 390, 844)
    looks = ['graphite', 'pro', 'emerald', 'porcelain', 'indigo', 'material']
    for lk in looks: await shot(path, lk, [('dash', 'look-' + lk)])
    from PIL import Image, ImageDraw
    W, H = 480, 300; g = Image.new('RGB', (W * 3 + 40, H * 2 + 90), '#ffffff'); d = ImageDraw.Draw(g)
    names = {'graphite': 'Graphite Lime (default)', 'pro': 'Pro', 'emerald': 'Emerald Night',
             'porcelain': 'Porcelain Navy', 'indigo': 'Indigo', 'material': 'Material'}
    for i, lk in enumerate(looks):
        x, y = 10 + (i % 3) * (W + 10), 10 + (i // 3) * (H + 35)
        g.paste(Image.open(os.path.join(OUT, 'look-' + lk + '.png')).resize((W, H)), (x, y))
        d.text((x, y + H + 6), names[lk], fill='#111111')
        os.remove(os.path.join(OUT, 'look-' + lk + '.png'))
    g.save(os.path.join(OUT, 'looks.png'), optimize=True)
asyncio.run(main(os.path.abspath(sys.argv[1])))
