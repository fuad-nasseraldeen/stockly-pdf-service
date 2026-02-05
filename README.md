# stockly-pdf-service

Small PDF microservice for Stockly (Node.js + Express + Playwright). Designed to run as a standard **Render Web Service** (non-serverless).

## Requirements

- Node.js 18+
- An environment variable `PDF_API_KEY` (required)

## Local run (development)

```bash
cd stockly-pdf-service
npm install
PDF_API_KEY=dev-key npm start
```

Health check:

```bash
curl http://localhost:3000/health
```

Generate a PDF (example):

```bash
curl -X POST "http://localhost:3000/pdf/table" ^
  -H "content-type: application/json" ^
  -H "x-api-key: dev-key" ^
  --data "{\"storeName\":\"מאפיית פואד\",\"title\":\"Inventory\",\"printedAtISO\":\"2026-02-04T12:00:00Z\",\"rtl\":true,\"columns\":[{\"key\":\"name\",\"label\":\"שם מוצר\"},{\"key\":\"sku\",\"label\":\"מק\"\"ט\"},{\"key\":\"supplier\",\"label\":\"ספק\"},{\"key\":\"price\",\"label\":\"מחיר\"},{\"key\":\"qty\",\"label\":\"כמות\"}],\"rows\":[{\"sku\":\"A-001\",\"name\":\"לחם חלה\",\"supplier\":\"מאפייה מרכזית\",\"price\":12.5,\"qty\":12},{\"sku\":\"A-002\",\"name\":\"עוגת שוקולד\",\"supplier\":\"מאפיית פואד\",\"price\":35,\"qty\":3}]}" ^
  --output table.pdf
```

## Deploy on Render

Create a new **Web Service** and set:

- **Build Command**: `npm ci && npx playwright install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `PDF_API_KEY`: your secret API key
  - (optional) `FRONTEND_ORIGINS`: comma-separated list of allowed frontend origins, for example: `http://localhost:5173,https://your-frontend.vercel.app`

Render will provide `PORT` automatically; the service listens on `process.env.PORT`.

## How the API works

- **Endpoint**: `POST /pdf/table`
- **Auth**: header `x-api-key: <PDF_API_KEY>` (no API keys in body).
- **Body shape**:
  - `storeName`: string (will appear as the store name in the header)
  - `title`: string (used for internal logic only, header shows a fixed `דוח מוצרים`)
  - `printedAtISO`: optional ISO date string, used to render `תאריך הפקה: dd.MM.yyyy`
  - `rtl`: boolean, optional (when `true` layout is RTL Hebrew)
  - `columns`: array of objects `{ key: string, label: string, width?: number }`
  - `rows`: array of objects – each row key should match one of the column `key`s

## CORS / Frontend usage

- Service URL on Render, for example: `https://stockly-pdf-service.onrender.com`.
- Allowed origins by default: `http://localhost:5173`, `http://localhost:3000`, and any `*.vercel.app`.
- You can override with `FRONTEND_ORIGINS` (comma separated).
- From the frontend, send `POST https://stockly-pdf-service.onrender.com/pdf/table` with:
  - `Content-Type: application/json`
  - `x-api-key: <PDF_API_KEY>`

## Debugging on Render

- **Health**: `GET /health` → `{ "status": "ok" }`.
- **Playwright check**: `GET /debug/browser` → `{ ok: true }` when Chromium launches correctly.
- On failures, the service logs detailed errors to the Render logs and returns JSON:
  - `{"error":"Failed to generate PDF","details":"<message>"}`
