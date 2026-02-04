# stockly-pdf-service

Small PDF microservice for Stockly (Node.js + Express + Playwright). Designed to run as a standard **Render Web Service** (non-serverless).

## Requirements

- Node.js 18+
- An environment variable `PDF_API_KEY` (required)

## Local run

```bash
cd stockly-pdf-service
npm install
PDF_API_KEY=dev-key npm start
```

Health check:

```bash
curl http://localhost:3000/health
```

Generate a PDF:

```bash
curl -X POST "http://localhost:3000/pdf/table" ^
  -H "content-type: application/json" ^
  -H "x-api-key: dev-key" ^
  --data "{\"storeName\":\"Stockly\",\"title\":\"Inventory\",\"printedAtISO\":\"2026-02-04T12:00:00Z\",\"rtl\":true,\"columns\":[{\"id\":\"sku\",\"label\":\"SKU\",\"width\":null},{\"id\":\"name\",\"label\":\"Name\",\"width\":null},{\"id\":\"qty\",\"label\":\"Qty\",\"width\":null}],\"rows\":[{\"sku\":\"A-001\",\"name\":\"Long product name that should wrap\",\"qty\":12},{\"sku\":\"A-002\",\"name\":\"Another item\",\"qty\":3}]}" ^
  --output table.pdf
```

## Deploy on Render

Create a new **Web Service** and set:

- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `PDF_API_KEY`: your secret API key

Render will provide `PORT` automatically; the service listens on `process.env.PORT`.
