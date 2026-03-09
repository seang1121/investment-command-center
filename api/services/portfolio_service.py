"""Portfolio management — import, valuation, P&L calculation."""

import io
import logging
import time

import pandas as pd

from api.models.database import db
from api.services.data_fetcher import get_dividend_info, get_quote

logger = logging.getLogger(__name__)


def import_from_file(file_bytes: bytes, filename: str) -> dict:
    """Parse CSV or Excel file and store holdings in database."""
    if filename.endswith(".xlsx") or filename.endswith(".xls"):
        df = pd.read_excel(io.BytesIO(file_bytes))
    else:
        df = pd.read_csv(io.BytesIO(file_bytes))

    # Normalize column names
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    required = {"ticker", "shares"}
    if not required.issubset(set(df.columns)):
        raise ValueError(
            f"File must have columns: ticker, shares. "
            f"Found: {list(df.columns)}"
        )

    # Clear existing holdings and insert new ones
    now = time.time()
    db.execute("DELETE FROM portfolio_holdings")

    for _, row in df.iterrows():
        ticker = str(row["ticker"]).strip().upper()
        shares = float(row["shares"])
        cost_basis = (
            float(row["cost_basis"])
            if "cost_basis" in df.columns and pd.notna(row.get("cost_basis"))
            else None
        )
        purchase_date = (
            str(row["purchase_date"])
            if "purchase_date" in df.columns
            and pd.notna(row.get("purchase_date"))
            else None
        )

        db.execute(
            "INSERT INTO portfolio_holdings "
            "(ticker, shares, cost_basis, purchase_date, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (ticker, shares, cost_basis, purchase_date, now, now),
        )
    db.commit()

    return get_portfolio_summary()


def get_portfolio_summary() -> dict:
    """Get current portfolio with live prices and P&L."""
    rows = db.fetchall(
        "SELECT ticker, shares, cost_basis, purchase_date "
        "FROM portfolio_holdings ORDER BY ticker"
    )

    if not rows:
        return {
            "holdings": [],
            "total_value": 0,
            "total_cost": 0,
            "total_gain": 0,
            "total_gain_pct": 0,
            "allocation": [],
        }

    holdings = []
    total_value = 0
    total_cost = 0

    for row in rows:
        try:
            quote = get_quote(row["ticker"])
            price = quote["price"]
        except Exception:
            price = 0

        market_value = price * row["shares"]
        cost = (row["cost_basis"] or price) * row["shares"]
        gain = market_value - cost
        gain_pct = (gain / cost * 100) if cost > 0 else 0

        holdings.append({
            "ticker": row["ticker"],
            "shares": row["shares"],
            "cost_basis": row["cost_basis"],
            "purchase_date": row["purchase_date"],
            "current_price": price,
            "market_value": round(market_value, 2),
            "gain": round(gain, 2),
            "gain_pct": round(gain_pct, 2),
        })

        total_value += market_value
        total_cost += cost

    # Allocation percentages
    allocation = []
    for h in holdings:
        pct = (h["market_value"] / total_value * 100) if total_value > 0 else 0
        allocation.append({
            "ticker": h["ticker"],
            "pct": round(pct, 1),
        })

    total_gain = total_value - total_cost
    total_gain_pct = (total_gain / total_cost * 100) if total_cost > 0 else 0

    return {
        "holdings": holdings,
        "total_value": round(total_value, 2),
        "total_cost": round(total_cost, 2),
        "total_gain": round(total_gain, 2),
        "total_gain_pct": round(total_gain_pct, 2),
        "allocation": sorted(allocation, key=lambda x: x["pct"], reverse=True),
    }


def get_dividend_calendar() -> list[dict]:
    """Get upcoming dividends for all portfolio holdings."""
    rows = db.fetchall(
        "SELECT ticker, shares FROM portfolio_holdings ORDER BY ticker"
    )

    calendar = []
    for row in rows:
        try:
            div_info = get_dividend_info(row["ticker"])
            if div_info.get("ex_dividend_date"):
                est_payment = div_info.get("dividend_rate", 0)
                if est_payment:
                    quarterly = est_payment / 4
                else:
                    quarterly = 0

                calendar.append({
                    "ticker": row["ticker"],
                    "shares": row["shares"],
                    "ex_date": div_info["ex_dividend_date"],
                    "estimated_per_share": round(quarterly, 4),
                    "estimated_total": round(quarterly * row["shares"], 2),
                    "yield": div_info.get("dividend_yield"),
                })
        except Exception:
            continue

    return sorted(calendar, key=lambda x: x.get("ex_date", ""))
