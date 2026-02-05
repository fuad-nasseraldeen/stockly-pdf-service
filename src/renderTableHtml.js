function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCellValue(value) {
  if (value === null || value === undefined) return "—";
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
  return /מחיר|כמות|סה\"כ|סה״כ|עלות|מלאי|מספר|quantity|qty|price|total/i.test(label);
}

function sortColumnsForDisplay(columns) {
  const PRIORITY_LABELS = ["שם מוצר", "מק״ט", "ספק"];
  return [...columns].sort((a, b) => {
    const ai = PRIORITY_LABELS.indexOf(a.label);
    const bi = PRIORITY_LABELS.indexOf(b.label);
    const av = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
    const bv = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
    if (av !== bv) return av - bv;
    return 0;
  });
}

function buildTableHtml({ storeName, title, printedAtISO, rtl, columns, rows }) {
  const dir = rtl ? "rtl" : "ltr";
  const lang = rtl ? "he" : "en";
  const alignStart = rtl ? "right" : "left";
  const alignEnd = rtl ? "left" : "right";
  const formattedDate = formatPrintDate(printedAtISO);
  const totalCount = Array.isArray(rows) ? rows.length : 0;

  // Presentation-only reordering: ensure key product columns appear first
  const renderColumns = sortColumnsForDisplay(columns);

  const colgroup = renderColumns
    .map((c) => {
      let style = "";
      if (c.width && Number.isFinite(c.width)) {
        style = `style="width:${c.width}mm"`;
      } else if (c.label === "שם מוצר") {
        style = `style="width:35%"`;
      }
      return `<col ${style} />`;
    })
    .join("");

  const thead = `<thead><tr>${renderColumns
    .map((c) => {
      const numeric = isNumericColumn(c);
      const classes = ["th-cell"];
      if (numeric) classes.push("th-number");
      return `<th scope="col" class="${classes.join(" ")}">${escapeHtml(
        c.label
      )}</th>`;
    })
    .join("")}</tr></thead>`;

  const tbody = `<tbody>${rows
    .map((row) => {
      const tds = renderColumns
        .map((c) => {
          const val = Object.prototype.hasOwnProperty.call(row, c.key)
            ? row[c.key]
            : null;
          const numeric = isNumericColumn(c);
          const isName = c.label === "שם מוצר";
          const classes = ["td-cell"];
          if (numeric) {
            classes.push("td-number");
          } else if (isName) {
            classes.push("td-name");
          } else {
            classes.push("td-text-narrow");
          }
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
        font-size: 10.5px;
        color: #111;
        direction: ${dir};
        unicode-bidi: plaintext;
      }

      .header {
        display: flex;
        flex-direction: column;
        align-items: ${alignEnd};
        text-align: ${alignEnd};
        gap: 4px;
        margin-bottom: 10px;
      }
      .store { font-weight: 700; font-size: 14px; }
      .title { font-weight: 700; font-size: 12px; }
      .meta-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        font-size: 10px;
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
        padding: 6px 8px;
        vertical-align: top;
        text-align: ${alignStart};
        overflow-wrap: anywhere;
        word-break: break-word;
        hyphens: auto;
        line-height: 1.25;
        unicode-bidi: plaintext;
      }
      th {
        background: #f3f4f6;
        font-weight: 700;
      }
      .th-cell { font-weight: 700; }
      .th-number { text-align: left; }
      .td-cell { font-size: 10.5px; }
      .td-name {
        text-align: right;
        white-space: normal;
      }
      .td-text-narrow {
        text-align: right;
        white-space: nowrap;
      }
      .td-number {
        text-align: left;
        white-space: nowrap;
        direction: ltr;
      }
      tbody tr:nth-child(even) td { background: #fafafa; }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="store">${escapeHtml(storeName)}</div>
      <div class="title">דוח מוצרים</div>
      <div class="meta-row">
        <div class="meta-right">
          ${
            formattedDate
              ? `תאריך הפקה: ${escapeHtml(formattedDate)}`
              : ""
          }
        </div>
        <div class="meta-left">
          ${escapeHtml(`סך הכול: ${totalCount} מוצרים`)}
        </div>
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

