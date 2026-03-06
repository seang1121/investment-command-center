"""FastAPI entry point for Fund Analyzer API."""

import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import (
    cashflow,
    data,
    dividends,
    health,
    monte_carlo,
    networth,
    optimization,
    portfolio,
    risk_metrics,
    screener,
)

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="Fund Analyzer API",
    description="Financial analysis engine — Monte Carlo, risk metrics, "
    "portfolio optimization, dividend analysis",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3100",
        "http://127.0.0.1:3100",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(cashflow.router)
app.include_router(data.router)
app.include_router(risk_metrics.router)
app.include_router(monte_carlo.router)
app.include_router(optimization.router)
app.include_router(dividends.router)
app.include_router(health.router)
app.include_router(networth.router)
app.include_router(portfolio.router)
app.include_router(screener.router)


@app.get("/api/health")
def api_health() -> dict:
    return {"status": "ok", "version": "2.0.0"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run("api.main:app", host="0.0.0.0", port=port, reload=True)
