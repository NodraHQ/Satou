/*
 * Gera os arquivos estáticos derivados do site:
 *   media-kit/satou-media-kit-pt.pdf   (a partir de media-kit/index.html)
 *   media-kit/satou-media-kit-en.pdf   (media-kit/index.html?lang=en)
 *   assets/og/og-image.png             (a partir de scripts/og.html)
 *   assets/og/apple-touch-icon.png     (a partir de favicon.svg)
 *
 * Uso:  node scripts/build-assets.js
 * Requer Playwright (npm i -D playwright && npx playwright install chromium).
 * Rode sempre que mudar números ou textos do media kit e faça commit dos arquivos gerados.
 */
const path = require('path');
const http = require('http');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.pdf': 'application/pdf' };

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const file = path.join(ROOT, p);
      if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, () => resolve(srv));
  });
}

(async () => {
  const srv = await serve();
  const base = `http://localhost:${srv.address().port}`;
  const browser = await chromium.launch();
  let failed = false;

  try {
    // ---- Media kit PDFs
    for (const lang of ['pt', 'en']) {
      const page = await browser.newPage();
      await page.goto(`${base}/media-kit/?lang=${lang}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);

      // Confere se nenhum conteúdo passou do tamanho da folha A4
      const overflow = await page.evaluate(() =>
        [...document.querySelectorAll('.page')].map((pg, i) => {
          const box = pg.getBoundingClientRect();
          const cs = getComputedStyle(pg);
          const maxY = box.bottom - parseFloat(cs.paddingBottom) + 1;
          const maxX = box.right - parseFloat(cs.paddingRight) + 1;
          const els = [...pg.querySelectorAll('*')].filter((el) => el.getClientRects().length);
          const worstY = Math.max(...els.map((el) => el.getBoundingClientRect().bottom));
          const worstX = Math.max(...els.map((el) => el.getBoundingClientRect().right));
          const msg = [];
          if (worstY > maxY) msg.push(`página ${i + 1} estourou ${Math.round(worstY - maxY)}px embaixo`);
          if (worstX > maxX) msg.push(`página ${i + 1} estourou ${Math.round(worstX - maxX)}px na lateral`);
          return msg.join(', ') || null;
        }).filter(Boolean)
      );
      if (overflow.length) { console.error(`[${lang}] ATENÇÃO:`, overflow.join(', ')); failed = true; }

      const out = path.join(ROOT, `media-kit/satou-media-kit-${lang}.pdf`);
      await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
      console.log('ok', path.relative(ROOT, out));
      await page.close();
    }

    // ---- Open Graph image
    const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await og.goto(`${base}/scripts/og.html`, { waitUntil: 'networkidle' });
    await og.evaluate(() => document.fonts.ready);
    await og.screenshot({ path: path.join(ROOT, 'assets/og/og-image.png') });
    console.log('ok assets/og/og-image.png');

    // ---- Apple touch icon
    const icon = await browser.newPage({ viewport: { width: 180, height: 180 } });
    await icon.setContent(`<body style="margin:0"><img src="${base}/favicon.svg" style="width:180px;height:180px;display:block"></body>`, { waitUntil: 'networkidle' });
    await icon.screenshot({ path: path.join(ROOT, 'assets/og/apple-touch-icon.png') });
    console.log('ok assets/og/apple-touch-icon.png');
  } finally {
    await browser.close();
    srv.close();
  }
  if (failed) process.exit(1);
})();
