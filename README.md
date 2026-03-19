# Investment Command Center

Full-stack investment intelligence platform with professional-grade financial models and AI-powered analysis.

![Status](https://img.shields.io/badge/status-active-green)
![Python](https://img.shields.io/badge/python-3.11+-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![License](https://img.shields.io/github/license/seang1121/investment-command-center)

## What It Does

Investment Command Center is a full-stack financial analysis platform combining a FastAPI backend with a Next.js frontend. It provides 12 AI agents and analyzers including Monte Carlo simulation (10k paths), Markowitz portfolio optimization, Gordon Growth valuation, risk analysis, and 5 stock/fund scanners -- all backed by real-time market data.

## Features

- **Monte Carlo Simulation** -- 10,000-path probabilistic forecasting
- **Markowitz Portfolio Optimizer** -- efficient frontier via PyPortfolioOpt
- **Gordon Growth Model** -- dividend discount valuation and sustainability scoring
- **Risk Analyzer** -- Sharpe, Sortino, VaR, max drawdown
- **5 Stock Scanners** -- dividend, tech, custom screener, and more
- **Financial Health Scoring** -- comprehensive fund and portfolio evaluation
- **Proactive Advisor** -- AI-driven portfolio recommendations
- **Two-Tier Caching** -- in-memory + SQLite with configurable TTLs
- **Portfolio Upload** -- CSV/Excel import with full analysis

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 (App Router), TypeScript, TailwindCSS, Plotly.js |
| **Backend** | FastAPI, Python 3.11+ |
| **Database** | SQLite (WAL mode) |
| **Data** | yfinance (primary), Alpha Vantage (secondary) |
| **Models** | PyPortfolioOpt, NumPy, SciPy, Pandas |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+

### Run Both Services

```bash
# Clone the repo
git clone https://github.com/seang1121/investment-command-center.git
cd investment-command-center

# Install backend dependencies
pip install -r api/requirements.txt

# Install frontend dependencies
cd frontend && npm install && cd ..

# Start both services
start.bat
```

### Run Individually

```bash
# API only (http://localhost:8000)
python -m uvicorn api.main:app --reload --port 8000

# Frontend only (http://localhost:3000)
cd frontend && npm run dev
```

API docs available at `http://localhost:8000/docs`.

## API Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/quote/{ticker}` | Live quote |
| GET | `/api/history/{ticker}` | Historical prices |
| GET | `/api/dividends/{ticker}` | Dividend info |
| POST | `/api/risk-metrics` | Risk analysis |
| POST | `/api/monte-carlo` | Monte Carlo simulation |
| POST | `/api/optimize` | Efficient frontier |
| POST | `/api/dividends/analyze` | DDM + sustainability |
| POST | `/api/portfolio/upload` | Upload CSV/Excel |
| GET | `/api/portfolio` | Portfolio summary |
| GET | `/api/scanner/dividends` | Dividend stock scanner |
| GET | `/api/scanner/tech` | Emerging tech scanner |
| GET | `/api/screener` | Custom screener |

## Project Structure

```
investment-command-center/
├── api/                    # FastAPI backend
│   ├── main.py             # App entry, CORS, router mounting
│   ├── routers/            # API endpoints
│   ├── services/           # Business logic
│   └── models/             # Pydantic schemas, DB singleton
├── frontend/               # Next.js 14 app
│   └── src/
│       ├── app/            # Pages (App Router)
│       ├── components/     # Charts, UI, layout
│       ├── lib/            # API client, types, utils
│       └── hooks/          # React hooks
├── start.bat               # Launch both services
└── .env.example            # Config template
```

## License

See [LICENSE](./LICENSE) for details.
