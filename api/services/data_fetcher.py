"""Central data acquisition layer.

Primary: yfinance (unlimited, free)
Secondary: Alpha Vantage (25 req/day, better real-time)
All calls go through cache_service first.
"""

import logging
import os
from datetime import datetime, timedelta
from typing import Any

import numpy as np
import pandas as pd
import yfinance as yf
from dotenv import load_dotenv

from api.services.cache_service import (
    TTL_DIVIDENDS,
    TTL_FUNDAMENTALS,
    TTL_HISTORICAL,
    TTL_QUOTE,
    cache_get,
    cache_set,
)

load_dotenv()
logger = logging.getLogger(__name__)

ALPHA_VANTAGE_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "")


def get_quote(ticker: str) -> dict[str, Any]:
    """Current price, change, volume, and basic info."""
    key = f"quote:{ticker.upper()}"
    cached = cache_get(key)
    if cached:
        return cached

    try:
        stock = yf.Ticker(ticker)
        info = stock.info or {}
        fast = stock.fast_info

        quote = {
            "ticker": ticker.upper(),
            "name": info.get("shortName", ticker.upper()),
            "price": round(fast.get("lastPrice", 0), 2),
            "previous_close": round(fast.get("previousClose", 0), 2),
            "change": round(
                fast.get("lastPrice", 0) - fast.get("previousClose", 0), 2
            ),
            "change_pct": round(
                (
                    (fast.get("lastPrice", 0) - fast.get("previousClose", 0))
                    / fast.get("previousClose", 1)
                )
                * 100,
                2,
            ),
            "volume": fast.get("lastVolume", 0),
            "market_cap": info.get("marketCap"),
            "sector": info.get("sector", "N/A"),
            "dividend_yield": info.get("dividendYield"),
            "pe_ratio": info.get("trailingPE"),
            "52w_high": info.get("fiftyTwoWeekHigh"),
            "52w_low": info.get("fiftyTwoWeekLow"),
            "exchange": info.get("exchange", ""),
            "type": _classify_security(info),
        }
        cache_set(key, quote, TTL_QUOTE)
        return quote
    except Exception as e:
        logger.error("Failed to fetch quote for %s: %s", ticker, e)
        raise ValueError(f"Could not fetch data for {ticker}") from e


def get_history(
    ticker: str, period: str = "2y", interval: str = "1d"
) -> list[dict]:
    """Historical price data as list of dicts."""
    key = f"history:{ticker.upper()}:{period}:{interval}"
    cached = cache_get(key)
    if cached:
        return cached

    try:
        stock = yf.Ticker(ticker)
        df = stock.history(period=period, interval=interval)
        if df.empty:
            raise ValueError(f"No history for {ticker}")

        records = []
        for date, row in df.iterrows():
            records.append({
                "date": date.strftime("%Y-%m-%d"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            })

        cache_set(key, records, TTL_HISTORICAL)
        return records
    except Exception as e:
        logger.error("Failed to fetch history for %s: %s", ticker, e)
        raise ValueError(f"Could not fetch history for {ticker}") from e


def get_returns(ticker: str, period: str = "2y") -> pd.Series:
    """Daily log returns as pandas Series (not cached separately)."""
    history = get_history(ticker, period=period)
    closes = pd.Series(
        [h["close"] for h in history],
        index=pd.to_datetime([h["date"] for h in history]),
    )
    return np.log(closes / closes.shift(1)).dropna()


def get_dividend_info(ticker: str) -> dict[str, Any]:
    """Dividend history, yield, payout ratio, ex-dates."""
    key = f"dividends:{ticker.upper()}"
    cached = cache_get(key)
    if cached:
        return cached

    try:
        stock = yf.Ticker(ticker)
        info = stock.info or {}
        divs = stock.dividends

        div_history = []
        if not divs.empty:
            for date, amount in divs.items():
                div_history.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "amount": round(float(amount), 4),
                })

        result = {
            "ticker": ticker.upper(),
            "dividend_yield": info.get("dividendYield"),
            "dividend_rate": info.get("dividendRate"),
            "payout_ratio": info.get("payoutRatio"),
            "ex_dividend_date": (
                datetime.fromtimestamp(info["exDividendDate"]).strftime(
                    "%Y-%m-%d"
                )
                if info.get("exDividendDate")
                else None
            ),
            "history": div_history[-20:],  # Last 20 payments
            "five_year_avg_yield": info.get("fiveYearAvgDividendYield"),
            "trailing_eps": info.get("trailingEps"),
        }
        cache_set(key, result, TTL_DIVIDENDS)
        return result
    except Exception as e:
        logger.error("Failed to fetch dividends for %s: %s", ticker, e)
        raise ValueError(f"Could not fetch dividend data for {ticker}") from e


def get_fundamentals(ticker: str) -> dict[str, Any]:
    """Company fundamentals for screening."""
    key = f"fundamentals:{ticker.upper()}"
    cached = cache_get(key)
    if cached:
        return cached

    try:
        stock = yf.Ticker(ticker)
        info = stock.info or {}

        result = {
            "ticker": ticker.upper(),
            "name": info.get("shortName", ""),
            "sector": info.get("sector", "N/A"),
            "industry": info.get("industry", "N/A"),
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "peg_ratio": info.get("pegRatio"),
            "price_to_book": info.get("priceToBook"),
            "profit_margin": info.get("profitMargins"),
            "roe": info.get("returnOnEquity"),
            "revenue_growth": info.get("revenueGrowth"),
            "debt_to_equity": info.get("debtToEquity"),
            "free_cash_flow": info.get("freeCashflow"),
            "beta": info.get("beta"),
            "expense_ratio": info.get("annualReportExpenseRatio"),
            "type": _classify_security(info),
        }
        cache_set(key, result, TTL_FUNDAMENTALS)
        return result
    except Exception as e:
        logger.error("Failed to fetch fundamentals for %s: %s", ticker, e)
        raise ValueError(f"Could not fetch fundamentals for {ticker}") from e


def _classify_security(info: dict) -> str:
    """Classify as stock, ETF, or mutual fund."""
    qtype = info.get("quoteType", "").upper()
    if qtype == "ETF":
        return "ETF"
    if qtype == "MUTUALFUND":
        return "Mutual Fund"
    return "Stock"
