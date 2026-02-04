function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCellValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(value);
  return String(value);
}

function buildTableHtml({ storeName, title, printedAtISO, rtl, columns, rows }) {
  const dir = rtl ? "rtl" : "ltr";
  const lang = rtl ? "he" : "en";
  const alignStart = rtl ? "right" : "left";
  const alignEnd = rtl ? "left" : "right";

  // Reverse columns for RTL rendering (rightmost column first logically)
  const renderColumns = rtl ? [...columns].reverse() : columns;

  const colgroup = renderColumns
    .map((c) => {
      if (c.width && Number.isFinite(c.width)) {
        return `<col style="width:${c.width}mm" />`;
      }
      return `<col />`;
    })
    .join("");

  const thead = `<thead><tr>${renderColumns
    .map((c) => `<th scope="col">${escapeHtml(c.label)}</th>`)
    .join("")}</tr></thead>`;

  const tbody = `<tbody>${rows
    .map((row) => {
      const tds = renderColumns
        .map((c) => {
          const val = Object.prototype.hasOwnProperty.call(row, c.key)
            ? row[c.key]
            : null;
          return `<td>${escapeHtml(formatCellValue(val))}</td>`;
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
        gap: 2px;
        margin-bottom: 8px;
      }
      .store { font-weight: 700; font-size: 12px; }
      .meta { color: #444; font-size: 10px; }
      .title { font-weight: 700; font-size: 12px; margin-top: 2px; }

      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }

      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
      tr { break-inside: avoid; }

      th, td {
        border: 1px solid #d7d7d7;
        padding: 4px 6px;
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
      tbody tr:nth-child(even) td { background: #fafafa; }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="store">${escapeHtml(storeName)}</div>
      ${printedAtISO ? `<div class="meta">${escapeHtml(printedAtISO)}</div>` : ""}
      <div class="title">${escapeHtml(title)}</div>
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

