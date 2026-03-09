"""Stock scanner and screener with recommendation engine.

Two scanning agents:
1. Dividend Stalwart Scanner — CFP-recommended income stocks
2. Emerging Tech/Innovation Scanner — AI, data centers, semis, hardware

Plus a general-purpose screener with customizable filters.
"""

import logging
from typing import Any

import numpy as np

from api.services.data_fetcher import (
    get_dividend_info,
    get_fundamentals,
    get_quote,
)
from api.services.risk_service import compute_risk_metrics

logger = logging.getLogger(__name__)

# Pre-built scan universes
DIVIDEND_STALWARTS = [
    "T", "VZ", "MO", "PM", "XOM", "CVX", "JNJ", "PG", "KO", "PEP",
    "ABBV", "MMM", "IBM", "INTC", "WBA", "DOW", "LYB", "TROW",
    "SCHD", "VYM", "HDV", "DVY", "SPYD", "NOBL",
    "O", "MAIN", "STAG", "NNN", "EPD", "ET",
]

EMERGING_TECH = [
    "NVDA", "AMD", "AVGO", "TSM", "MRVL", "ARM", "SMCI", "VRT",
    "MSFT", "AMZN", "GOOGL", "META", "CRM", "PLTR", "AI",
    "DLR", "EQIX", "AMT", "ANET", "CRWD", "PANW", "FTNT",
    "ASML", "LRCX", "KLAC", "AMAT", "QCOM", "MU",
    "SMH", "SOXX", "QQQ", "ARKK", "XLK", "IGV",
]


def scan_dividend_stalwarts(limit: int = 20) -> list[dict]:
    """Scan dividend-focused stocks and generate recommendations."""
    results = []
    for ticker in DIVIDEND_STALWARTS:
        try:
            result = _analyze_for_scan(ticker, scan_type="dividend")
            if result:
                results.append(result)
        except Exception as e:
            logger.warning("Scan failed for %s: %s", ticker, e)
            continue

    # Sort by composite score (yield + sustainability + growth)
    results.sort(key=lambda x: x.get("score", 0), reverse=True)
    return results[:limit]


def scan_emerging_tech(limit: int = 20) -> list[dict]:
    """Scan emerging tech/innovation stocks and generate recommendations."""
    results = []
    for ticker in EMERGING_TECH:
        try:
            result = _analyze_for_scan(ticker, scan_type="growth")
            if result:
                results.append(result)
        except Exception as e:
            logger.warning("Scan failed for %s: %s", ticker, e)
            continue

    results.sort(key=lambda x: x.get("score", 0), reverse=True)
    return results[:limit]


def screen_custom(
    tickers: list[str] | None = None,
    min_dividend_yield: float | None = None,
    max_pe_ratio: float | None = None,
    min_market_cap: int | None = None,
    sector: str | None = None,
    security_type: str | None = None,
    sort_by: str = "dividend_yield",
    limit: int = 50,
) -> list[dict]:
    """Custom screener with user-defined filters."""
    universe = tickers or DIVIDEND_STALWARTS + EMERGING_TECH
    # Deduplicate
    universe = list(dict.fromkeys(universe))

    results = []
    for ticker in universe:
        try:
            quote = get_quote(ticker)
            fund = get_fundamentals(ticker)

            # Apply filters
            if min_dividend_yield and (
                not quote.get("dividend_yield")
                or quote["dividend_yield"] < min_dividend_yield
            ):
                continue
            if max_pe_ratio and (
                not quote.get("pe_ratio") or quote["pe_ratio"] > max_pe_ratio
            ):
                continue
            if min_market_cap and (
                not quote.get("market_cap")
                or quote["market_cap"] < min_market_cap
            ):
                continue
            if sector and fund.get("sector", "").lower() != sector.lower():
                continue
            if security_type and fund.get("type", "") != security_type:
                continue

            results.append({
                "ticker": ticker,
                "name": quote.get("name", ""),
                "price": quote["price"],
                "change_pct": quote.get("change_pct", 0),
                "dividend_yield": quote.get("dividend_yield"),
                "pe_ratio": quote.get("pe_ratio"),
                "market_cap": quote.get("market_cap"),
                "sector": fund.get("sector", "N/A"),
                "type": fund.get("type", "Stock"),
                "beta": fund.get("beta"),
            })
        except Exception as e:
            logger.warning("Screen failed for %s: %s", ticker, e)
            continue

    # Sort
    sort_key = sort_by.replace("-", "_")
    results.sort(
        key=lambda x: x.get(sort_key) or 0,
        reverse=sort_by != "pe_ratio",
    )
    return results[:limit]


def _analyze_for_scan(ticker: str, scan_type: str) -> dict | None:
    """Analyze a single ticker and generate a recommendation."""
    quote = get_quote(ticker)
    fund = get_fundamentals(ticker)

    result: dict[str, Any] = {
        "ticker": ticker,
        "name": quote.get("name", ""),
        "price": quote["price"],
        "change_pct": quote.get("change_pct", 0),
        "sector": fund.get("sector", "N/A"),
        "type": fund.get("type", "Stock"),
        "market_cap": quote.get("market_cap"),
        "pe_ratio": quote.get("pe_ratio"),
        "beta": fund.get("beta"),
    }

    if scan_type == "dividend":
        div_info = get_dividend_info(ticker)
        result["dividend_yield"] = quote.get("dividend_yield")
        result["payout_ratio"] = div_info.get("payout_ratio")
        result["ex_date"] = div_info.get("ex_dividend_date")

        # Score: yield (40%) + sustainability (30%) + value (30%)
        score = 0
        dy = quote.get("dividend_yield") or 0
        score += min(dy * 10, 4.0) * 0.4  # Cap at 40% yield

        pr = div_info.get("payout_ratio") or 0.5
        if 0.3 <= pr <= 0.6:
            score += 3 * 0.3
        elif pr < 0.3:
            score += 2 * 0.3
        elif pr <= 0.8:
            score += 1.5 * 0.3
        else:
            score += 0.5 * 0.3

        pe = quote.get("pe_ratio")
        if pe and 5 < pe < 20:
            score += 3 * 0.3
        elif pe and pe < 30:
            score += 1.5 * 0.3

        result["score"] = round(score, 2)
        result["signal"] = _dividend_signal(score)

    else:  # growth
        result["dividend_yield"] = quote.get("dividend_yield")
        result["revenue_growth"] = fund.get("revenue_growth")
        result["profit_margin"] = fund.get("profit_margin")

        # Score: momentum (40%) + growth (30%) + quality (30%)
        score = 0
        change = quote.get("change_pct", 0)
        if change > 2:
            score += 3 * 0.2
        elif change > 0:
            score += 2 * 0.2

        rg = fund.get("revenue_growth") or 0
        score += min(rg * 5, 3.0) * 0.4

        pm = fund.get("profit_margin") or 0
        score += min(pm * 5, 3.0) * 0.3

        # Bonus for reasonable valuation
        pe = quote.get("pe_ratio")
        if pe and pe < 40:
            score += 0.3

        result["score"] = round(score, 2)
        result["signal"] = _growth_signal(score)

    reasons = _generate_reasons(result, scan_type)
    result["reasons"] = reasons
    return result


def _dividend_signal(score: float) -> str:
    if score >= 2.5:
        return "Strong Buy"
    if score >= 1.8:
        return "Buy"
    if score >= 1.2:
        return "Hold"
    return "Watch"


def _growth_signal(score: float) -> str:
    if score >= 2.0:
        return "Strong Buy"
    if score >= 1.4:
        return "Buy"
    if score >= 0.8:
        return "Hold"
    return "Watch"


def _generate_reasons(result: dict, scan_type: str) -> list[str]:
    """Generate human-readable recommendation reasons."""
    reasons = []

    if scan_type == "dividend":
        dy = result.get("dividend_yield") or 0
        if dy > 0.05:
            reasons.append(f"High yield at {dy*100:.1f}%")
        elif dy > 0.03:
            reasons.append(f"Solid yield at {dy*100:.1f}%")

        pr = result.get("payout_ratio") or 0
        if 0.3 <= pr <= 0.6:
            reasons.append("Healthy payout ratio — room for growth")
        elif pr > 0.8:
            reasons.append("Elevated payout ratio — monitor sustainability")

        pe = result.get("pe_ratio")
        if pe and pe < 15:
            reasons.append(f"Attractively valued (P/E: {pe:.1f})")

    else:
        rg = result.get("revenue_growth") or 0
        if rg > 0.2:
            reasons.append(f"Strong revenue growth ({rg*100:.0f}%)")
        elif rg > 0.1:
            reasons.append(f"Solid revenue growth ({rg*100:.0f}%)")

        pm = result.get("profit_margin") or 0
        if pm > 0.2:
            reasons.append(f"High profit margin ({pm*100:.0f}%)")

        if result.get("sector") in (
            "Technology",
            "Communication Services",
        ):
            reasons.append("Core innovation sector exposure")

    if not reasons:
        reasons.append("Meets baseline screening criteria")

    return reasons
