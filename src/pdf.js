const { chromium } = require("playwright");
const { buildTableHtml } = require("./renderTableHtml");

let _browser;

async function checkBrowser() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  await browser.close();
}

async function getBrowser() {
  if (_browser) return _browser;

  _browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  return _browser;
}

async function renderTablePdf(payload) {
  const browser = await getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const html = buildTableHtml(payload);
    await page.setContent(html, { waitUntil: "networkidle" });
    
    // Wait for fonts to load before generating PDF
    await page.evaluate(() => document.fonts.ready);

    const showPageNumbers = payload.rtl ? "right" : "left";
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:1px;"></div>`,
      footerTemplate: `
        <div style="width:100%; font-size:9px; color:#666; padding:0 10mm;">
          <div style="width:100%; text-align:${showPageNumbers};">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        </div>
      `,
      margin: {
        top: "12mm",
        right: "10mm",
        bottom: "12mm",
        left: "10mm"
      }
    });

    return pdfBuffer;
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
  }
}

async function shutdownPdf() {
  if (_browser) {
    const b = _browser;
    _browser = undefined;
    await b.close().catch(() => {});
  }
}

module.exports = { renderTablePdf, shutdownPdf, checkBrowser };

