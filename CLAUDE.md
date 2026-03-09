# Fund Analyzer v2 — Investment Command Center

Full-stack financial analysis platform with professional-grade models.

**Local dev:** API http://localhost:8000 | Frontend http://localhost:3000
**API Docs:** http://localhost:8000/docs

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + TailwindCSS + Plotly.js
- **Backend:** FastAPI (Python 3.11+)
- **Database:** SQLite (WAL mode) — market data cache + portfolio storage
- **Data Sources:** yfinance (primary) + Alpha Vantage (secondary, 25 req/day)
- **Financial Models:** PyPortfolioOpt, numpy, scipy, pandas

## Running

```bash
# Both services
start.bat

# API only
python -m uvicorn api.main:app --reload --port 8000

# Frontend only
cd frontend && npm run dev
```

## Project Structure

```
Fidelity-Fund-Analyzer/
├── api/                    # FastAPI backend
│   ├── main.py             # App entry, CORS, router mounting
│   ├── routers/            # API endpoints
│   │   ├── data.py         # Quotes, history, dividends, fundamentals
│   │   ├── risk_metrics.py # Sharpe, Sortino, VaR, drawdown
│   │   ├── monte_carlo.py  # Monte Carlo simulation
│   │   ├── optimization.py # Efficient frontier
│   │   ├── dividends.py    # DDM analysis
│   │   ├── portfolio.py    # Portfolio CRUD + upload
│   │   └── screener.py     # Scanner + screener
│   ├── services/           # Business logic
│   │   ├── data_fetcher.py # yfinance + Alpha Vantage wrapper
│   │   ├── cache_service.py # Two-tier cache (memory + SQLite)
│   │   ├── risk_service.py
│   │   ├── monte_carlo_service.py
│   │   ├── optimization_service.py
│   │   ├── dividend_service.py
│   │   ├── portfolio_service.py
│   │   └── screener_service.py
│   └── models/
│       ├── database.py     # SQLite singleton
│       └── schemas.py      # Pydantic models
├── frontend/               # Next.js app
│   └── src/
│       ├── app/            # Pages (App Router)
│       ├── components/     # Charts, UI, layout
│       ├── lib/            # API client, types, utils
│       └── hooks/          # React hooks
├── start.bat               # Launch both services
└── .env.example            # Config template
```

## API Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| GET | /api/quote/{ticker} | Live quote |
| GET | /api/history/{ticker} | Historical prices |
| GET | /api/dividends/{ticker} | Dividend info |
| POST | /api/risk-metrics | Risk analysis |
| POST | /api/monte-carlo | Monte Carlo sim |
| POST | /api/optimize | Efficient frontier |
| POST | /api/dividends/analyze | DDM + sustainability |
| POST | /api/portfolio/upload | Upload CSV/Excel |
| GET | /api/portfolio | Portfolio summary |
| GET | /api/scanner/dividends | Dividend stock scanner |
| GET | /api/scanner/tech | Emerging tech scanner |
| GET | /api/screener | Custom screener |

## Caching Strategy

- Quotes: 15 min TTL
- Historical prices: 24h TTL
- Dividends: 24h TTL
- Fundamentals: 7 day TTL
- Two-tier: in-memory dict + SQLite persistent
