"""Hidden Gems scanner for the Investment Command Center.

Scans undervalued small/mid-cap stocks with dividends, scoring on
value metrics (P/E, PEG), income, profit margin, and balance sheet.
"""

import logging
from typing import Any

from api.services.data_fetcher import (
    get_fundamentals,
    get_quote,
)

logger = logging.getLogger(__name__)

# ── Ticker Universe ───────────────────────────────────────

HIDDEN_GEMS_UNIVERSE = [
    "TROW", "FAST", "PAYX", "CINF", "AFL", "SNA", "GPC",
    "EMR", "ITW", "SWK", "PPG", "ECL", "APD", "SHW", "ROP",
]


def _score_signal(score: float) -> str:
    """Convert a 0-100 score into a buy/hold signal."""
    if score >= 85:
        return "Strong Buy"
    if score >= 70:
        return "Buy"
    if score >= 50:
        return "Hold"
    return "Watch"


# ── Hidden Gems Scanner ──────────────────────────────────

def scan_hidden_gems(limit: int = 20) -> list[dict]:
    """Scan undervalued small/mid-cap stocks with dividends.

    Scores based on value metrics (P/E, PEG), dividend yield,
    profit margin, and reasonable debt levels.
    """
    results: list[dict] = []
    for ticker in HIDDEN_GEMS_UNIVERSE:
        try:
            result = _analyze_hidden_gem(ticker)
            if result:
                results.append(result)
        except Exception as e:
            logger.warning("Hidden gems scan failed for %s: %s", ticker, e)
            continue

    results.sort(key=lambda x: x.get("score", 0), reverse=True)
    return results[:limit]


def _analyze_hidden_gem(ticker: str) -> dict[str, Any] | None:
    """Score a single ticker for hidden-gem value characteristics."""
    quote = get_quote(ticker)
    fund = get_fundamentals(ticker)

    dividend_yield = quote.get("dividend_yield")
    pe = quote.get("pe_ratio")
    peg = fund.get("peg_ratio")
    profit_margin = fund.get("profit_margin")
    debt_to_equity = fund.get("debt_to_equity")

    result: dict[str, Any] = {
        "ticker": ticker,
        "name": quote.get("name", ""),
        "price": quote["price"],
        "change_pct": quote.get("change_pct", 0),
        "sector": fund.get("sector", "N/A"),
        "type": fund.get("type", "Stock"),
        "market_cap": quote.get("market_cap"),
        "pe_ratio": pe,
        "dividend_yield": dividend_yield,
        "beta": fund.get("beta"),
        "profit_margin": profit_margin,
        "peg_ratio": peg,
        "debt_to_equity": debt_to_equity,
    }

    # Score: value (35%) + income (25%) + quality (25%) + balance sheet (15%)
    score = 0.0

    # Value -- P/E and PEG (max 35 pts)
    if pe is not None:
        if pe < 15:
            score += 25
        elif pe < 20:
            score += 18
        elif pe < 30:
            score += 10
        else:
            score += 3

    if peg is not None and peg > 0:
        if peg < 1.0:
            score += 10
        elif peg < 2.0:
            score += 5

    # Income -- dividend yield (max 25 pts)
    dy = dividend_yield or 0
    if dy > 0.03:
        score += 25
    elif dy > 0.02:
        score += 18
    elif dy > 0.01:
        score += 10
    elif dy > 0:
        score += 5

    # Quality -- profit margin (max 25 pts)
    pm = profit_margin or 0
    if pm > 0.20:
        score += 25
    elif pm > 0.10:
        score += 18
    elif pm > 0.05:
        score += 10
    elif pm > 0:
        score += 5

    # Balance sheet -- debt-to-equity (max 15 pts)
    if debt_to_equity is not None:
        if debt_to_equity < 50:
            score += 15
        elif debt_to_equity < 100:
            score += 10
        elif debt_to_equity < 200:
            score += 5
    else:
        score += 8  # Unknown debt gets middle score

    result["score"] = round(score, 2)
    result["signal"] = _score_signal(score)
    result["reasons"] = _hidden_gem_reasons(result)
    return result


def _hidden_gem_reasons(result: dict) -> list[str]:
    """Generate recommendation reasons for hidden gem stocks."""
    reasons: list[str] = []

    pe = result.get("pe_ratio")
    if pe is not None and pe < 15:
        reasons.append(f"Attractively valued (P/E: {pe:.1f})")
    elif pe is not None and pe < 20:
        reasons.append(f"Reasonable valuation (P/E: {pe:.1f})")

    peg = result.get("peg_ratio")
    if peg is not None and 0 < peg < 1.0:
        reasons.append(f"PEG below 1.0 ({peg:.2f}) -- growth at a discount")

    dy = result.get("dividend_yield") or 0
    if dy > 0.02:
        reasons.append(f"Solid dividend ({dy*100:.1f}%)")

    pm = result.get("profit_margin") or 0
    if pm > 0.20:
        reasons.append(f"High profit margin ({pm*100:.0f}%)")

    dte = result.get("debt_to_equity")
    if dte is not None and dte < 50:
        reasons.append("Conservative balance sheet")

    if not reasons:
        reasons.append("Meets baseline hidden gem screening criteria")
    return reasons
