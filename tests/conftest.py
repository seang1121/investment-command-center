"""Shared fixtures for Investment Command Center tests."""

import os
import sqlite3
import tempfile
from unittest.mock import MagicMock, patch

import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def _isolate_database(tmp_path, monkeypatch):
    """Use a temp SQLite DB for every test so nothing touches the real DB."""
    db_path = str(tmp_path / "test.db")
    monkeypatch.setenv("DB_PATH", db_path)

    # Reset the Database singleton so it picks up the new path
    from api.models.database import Database

    Database._instance = None


@pytest.fixture()
def client():
    """FastAPI TestClient with all external API calls mocked."""
    from api.main import app

    return TestClient(app)


# ---------------------------------------------------------------------------
# Reusable mock data
# ---------------------------------------------------------------------------

@pytest.fixture()
def mock_quote():
    """Minimal quote dict matching get_quote return shape."""
    return {
        "ticker": "AAPL",
        "name": "Apple Inc.",
        "price": 175.50,
        "previous_close": 174.00,
        "change": 1.50,
        "change_pct": 0.86,
        "volume": 52_000_000,
        "market_cap": 2_800_000_000_000,
        "sector": "Technology",
        "dividend_yield": 0.005,
        "pe_ratio": 28.5,
        "52w_high": 198.23,
        "52w_low": 124.17,
        "exchange": "NMS",
        "type": "Stock",
    }


@pytest.fixture()
def mock_history():
    """100 days of fabricated price history for AAPL."""
    base = 170.0
    dates = pd.bdate_range(end="2025-12-31", periods=100)
    records = []
    for i, d in enumerate(dates):
        price = base + np.sin(i / 10) * 5 + i * 0.05
        records.append({
            "date": d.strftime("%Y-%m-%d"),
            "open": round(price - 0.5, 2),
            "high": round(price + 1.0, 2),
            "low": round(price - 1.0, 2),
            "close": round(price, 2),
            "volume": 50_000_000 + i * 10_000,
        })
    return records


@pytest.fixture()
def mock_dividend_info():
    """Fabricated dividend info matching get_dividend_info shape."""
    return {
        "ticker": "AAPL",
        "dividend_yield": 0.005,
        "dividend_rate": 0.96,
        "payout_ratio": 0.15,
        "ex_dividend_date": "2025-11-10",
        "history": [
            {"date": "2025-08-10", "amount": 0.24},
            {"date": "2025-05-10", "amount": 0.24},
            {"date": "2025-02-09", "amount": 0.23},
            {"date": "2024-11-10", "amount": 0.23},
            {"date": "2024-08-10", "amount": 0.22},
        ],
        "five_year_avg_yield": 0.006,
        "trailing_eps": 6.50,
    }


@pytest.fixture()
def mock_returns(mock_history):
    """Daily log-returns Series matching get_returns shape."""
    closes = pd.Series(
        [h["close"] for h in mock_history],
        index=pd.to_datetime([h["date"] for h in mock_history]),
    )
    return np.log(closes / closes.shift(1)).dropna()


@pytest.fixture()
def sample_portfolio_csv(tmp_path):
    """CSV file bytes ready for portfolio upload."""
    csv_content = "ticker,shares,cost_basis\nAAPL,10,150.00\nMSFT,5,300.00\nVTI,20,200.00\n"
    return csv_content.encode()
