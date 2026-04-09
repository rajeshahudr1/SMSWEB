/**
 * helpers/puppeteerPool.js
 * Singleton headless browser instance — avoids paying the 1-2s startup cost
 * on every PDF request. Auto-relaunches if it crashes/disconnects.
 */
'use strict';

let browserPromise = null;

async function getBrowser() {
    if (!browserPromise) {
        const puppeteer = require('puppeteer');
        browserPromise = puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--disable-dev-shm-usage'],
        });
        // Auto-clear if it dies
        browserPromise.then(b => {
            b.on('disconnected', () => { browserPromise = null; });
        }).catch(() => { browserPromise = null; });
    }
    return browserPromise;
}

/**
 * Render an HTML string to a PDF buffer using the shared browser.
 * @param {string} html
 * @param {object} pdfOpts  passed to page.pdf()
 */
async function htmlToPdf(html, pdfOpts = {}) {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
        // Use 'domcontentloaded' instead of 'networkidle2' — much faster.
        // Images load asynchronously; we wait for them via document.images below.
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
        // Wait for all <img> elements to either load or fail (with a small cap)
        await page.evaluate(() => Promise.all(
            Array.from(document.images).map(img => {
                if (img.complete) return null;
                return new Promise(resolve => {
                    const t = setTimeout(resolve, 1500); // 1.5s cap per image
                    img.addEventListener('load',  () => { clearTimeout(t); resolve(); }, { once: true });
                    img.addEventListener('error', () => { clearTimeout(t); resolve(); }, { once: true });
                });
            }).filter(Boolean)
        ));
        const buf = await page.pdf(Object.assign({
            format: 'A4',
            printBackground: true,
            margin: { top: '8mm', right: '8mm', bottom: '8mm', left: '8mm' },
        }, pdfOpts));
        return buf;
    } finally {
        try { await page.close(); } catch (_) {}
    }
}

module.exports = { getBrowser, htmlToPdf };
