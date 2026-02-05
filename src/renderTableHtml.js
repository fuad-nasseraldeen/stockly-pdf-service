// renderTableHtml.js

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCellValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return String(value);
  return String(value);
}

function formatPrintDate(printedAtISO) {
  if (!printedAtISO) return "";
  const d = new Date(printedAtISO);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function isNumericColumn(column) {
  if (!column || !column.label) return false;
  const label = String(column.label);
  return /מחיר|כמות|סה\"כ|סה״כ|עלות|מלאי|מספר|quantity|qty|price|total|sku|מק״ט/i.test(
    label
  );
}

function isCostColumn(column) {
  if (!column || !column.label) return false;
  const label = String(column.label);
  return /עלות/i.test(label); // "מחיר עלות", "עלות נטו/ברוטו" וכו'
}

function isProductNameColumn(column) {
  return column?.label === "שם מוצר";
}

// ✅ EXACT column order (by label) + index first.
// If labels differ slightly, we try a few variants.
// Any columns not listed here will be appended at the end (stable, not lost).
function orderColumnsForDisplay(columns) {
  const cols = Array.isArray(columns) ? columns : [];

  const ORDER = [
    { key: "__index", label: "מס׳" },
    { label: "שם מוצר", alt: ["שם מוצר "] },
    { label: "ספק" },
    { label: "מק״ט", alt: ["מקט", 'מק"ת', "SKU"] },

    // prices
    { label: 'מחיר לפני מע"מ', alt: ['מחיר לפני מע״מ', 'מחיר לפני מע"מ '] },
    { label: "מחיר עלות", alt: ["עלות", "עלות מוצר", "עלות (מחיר)"] },
    { label: "מחיר לאחר הנחה", alt: ["לאחר הנחה", "מחיר אחרי הנחה"] },

    // carton
    { label: "כמות בקרטון", alt: ["כמות בקרטון ", "כמות/קרטון"] },
    { label: "מחיר לקרטון", alt: ["מחיר קרטון", "מחיר לקרטון "] },

    // date
    { label: "תאריך עדכון", alt: ["תאריך", "תאריך עדכון "] }
  ];

  const byLabel = new Map();
  cols.forEach((c) => byLabel.set(c.label, c));

  const picked = [];
  const pickedKeys = new Set();

  for (const item of ORDER) {
    if (item.key === "__index") {
      picked.push({ key: "__index", label: "מס׳" });
      pickedKeys.add("__index");
      continue;
    }

    // exact label
    let found = byLabel.get(item.label);

    // try alternates
    if (!found && item.alt) {
      for (const altLabel of item.alt) {
        found = byLabel.get(altLabel);
        if (found) break;
      }
    }

    if (found && !pickedKeys.has(found.key)) {
      picked.push(found);
      pickedKeys.add(found.key);
    }
  }

  // append leftovers (so we don't drop columns)
  const leftovers = cols.filter((c) => !pickedKeys.has(c.key));
  return [...picked, ...leftovers];
}

function buildTableHtml({ storeName, printedAtISO, rtl, columns, rows }) {
  const dir = rtl ? "rtl" : "ltr";
  const lang = rtl ? "he" : "en";

  const formattedDate = formatPrintDate(printedAtISO);
  const safeRows = Array.isArray(rows) ? rows : [];
  const totalCount = safeRows.length;

  const renderColumns = orderColumnsForDisplay(columns);

  // ✅ widths: product name wide; everything else tight
  const colgroup = renderColumns
    .map((c) => {
      let style = "";

      if (c.key === "__index") style = `style="width:9mm"`;
      else if (c.label === "שם מוצר") style = `style="width:42%"`;
      else if (c.label === "ספק") style = `style="width:16%"`;
      else if (c.label === "מק״ט") style = `style="width:12%"`;
      else if (c.label && /תאריך/i.test(c.label)) style = `style="width:14%"`;
      else if (c.label && /כמות/i.test(c.label)) style = `style="width:12mm"`;
      else if (c.label && /מחיר|עלות/i.test(c.label)) style = `style="width:14mm"`;
      else style = `style="width:12mm"`; // default narrow

      return `<col ${style} />`;
    })
    .join("");

  const thead = `<thead><tr>${renderColumns
    .map((c) => {
      const numeric = isNumericColumn(c);
      const cost = isCostColumn(c);
      const classes = ["th-cell"];
      if (numeric) classes.push("th-number");
      if (cost) classes.push("th-cost");
      if (isProductNameColumn(c)) classes.push("th-name");
      if (c.key === "__index") classes.push("th-index");
      return `<th scope="col" class="${classes.join(" ")}">${escapeHtml(
        c.label
      )}</th>`;
    })
    .join("")}</tr></thead>`;

  const tbody = `<tbody>${safeRows
    .map((row, idx) => {
      const tds = renderColumns
        .map((c) => {
          let val = null;

          if (c.key === "__index") {
            val = idx + 1;
          } else {
            val = Object.prototype.hasOwnProperty.call(row, c.key)
              ? row[c.key]
              : null;
          }

          const numeric = isNumericColumn(c);
          const cost = isCostColumn(c);
          const isName = isProductNameColumn(c);

          const classes = ["td-cell"];
          if (c.key === "__index") classes.push("td-index");
          if (numeric) classes.push("td-number");
          if (isName) classes.push("td-name");
          else if (!numeric && c.key !== "__index") classes.push("td-text-narrow");
          if (cost) classes.push("td-cost");

          return `<td class="${classes.join(" ")}">${escapeHtml(
            formatCellValue(val)
          )}</td>`;
        })
        .join("");

      return `<tr>${tds}</tr>`;
    })
    .join("")}</tbody>`;

  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap" rel="stylesheet" />
    <style>
      @page { size: A4 landscape; margin: 12mm 10mm 12mm 10mm; }
      html, body { padding: 0; margin: 0; }
      body {
        font-family: "Assistant", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, "Noto Sans Hebrew", "Noto Sans", "Helvetica Neue", sans-serif;
        font-size: 12px;
        color: #111;
        direction: ${dir};
        unicode-bidi: plaintext;
      }

      /* ✅ Header: main content on RIGHT; date on LEFT (your request) */
      .header {
        display: flex;
        flex-direction: column;
        align-items: flex-end; /* always right */
        text-align: right;
        gap: 4px;
        margin-bottom: 10px;
      }
      .store { font-weight: 700; font-size: 15px; }
      .title { font-weight: 700; font-size: 12.5px; }
      .meta-row {
        width: 100%;
        display: flex;
        justify-content: space-between;
       _toggle-: none;
        align-items: center;
        gap: 8px;
        font-size: 10.5px;
        color: #444;
      }
      .meta-right { text-align: right; }
      .meta-left { text-align: left; }

      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        direction: ${dir};
      }

      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
      tr { break-inside: avoid; }

      th, td {
        border: 1px solid #d7d7d7;
        padding: 5px 6px;
        vertical-align: top;
        text-align: right;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.25;
        unicode-bidi: plaintext;
      }

      th {
        background: #f3f4f6;
        font-weight: 700;
      }

      .th-number { text-align: left; }
      .th-index { text-align: center; }
      .th-cost { font-weight: 700; }

      .td-cell { font-size: 12px; }

      /* ✅ product name: wide + wrap + bold */
      .td-name {
        text-align: right;
        white-space: normal;
        overflow: visible;
        text-overflow: clip;
        font-weight: 700;
      }

      /* ✅ narrow text columns */
      .td-text-narrow {
        text-align: right;
        white-space: nowrap;
      }

      /* ✅ numeric columns */
      .td-number {
        text-align: left;
        white-space: nowrap;
        direction: ltr;
      }

      /* ✅ cost values bold */
      .td-cost { font-weight: 700; }

      /* ✅ index column */
      .td-index {
        text-align: center;
        white-space: nowrap;
        direction: ltr;
      }

      tbody tr:nth-child(even) td { background: #fafafa; }
    </style>
  </head>

  <body>
    <div class="header">
      <div class="store">${escapeHtml(storeName || "")}</div>
      <div class="title">דוח מוצרים</div>

      <div class="meta-row">
        <div class="meta-right">${escapeHtml(`סך הכול: ${totalCount} מוצרים`)}</div>
        <div class="meta-left">${
          formattedDate ? `תאריך הפקה: ${escapeHtml(formattedDate)}` : ""
        }</div>
      </div>
    </div>

    <table>
      <colgroup>${colgroup}</colgroup>
      ${thead}
      ${tbody}
    </table>
  </body>
</html>`;
}

module.exports = { buildTableHtml };
