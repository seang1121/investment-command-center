"""Scanner and screener API endpoints."""

from fastapi import APIRouter, HTTPException, Query

from api.services.scanner_extras import (
    scan_hysa_alternatives,
    scan_mutual_funds,
)
from api.services.scanner_hidden_gems import scan_hidden_gems
from api.services.screener_service import (
    scan_dividend_stalwarts,
    scan_emerging_tech,
    screen_custom,
)

router = APIRouter(prefix="/api", tags=["screener"])


@router.get("/scanner/dividends")
def dividend_scanner(limit: int = Query(20, ge=1, le=50)) -> list:
    """Scan dividend stalwarts and generate buy/hold recommendations."""
    try:
        return scan_dividend_stalwarts(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {e}")


@router.get("/scanner/tech")
def tech_scanner(limit: int = Query(20, ge=1, le=50)) -> list:
    """Scan emerging tech/innovation stocks with recommendations."""
    try:
        return scan_emerging_tech(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {e}")


@router.get("/scanner/mutual-funds")
def mutual_fund_scanner(limit: int = Query(20, ge=1, le=50)) -> list:
    """Scan top mutual funds with expense ratio and performance scoring."""
    try:
        return scan_mutual_funds(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {e}")


@router.get("/scanner/hysa")
def hysa_scanner(limit: int = Query(20, ge=1, le=50)) -> list:
    """Scan T-bill and money market ETFs as HYSA alternatives."""
    try:
        return scan_hysa_alternatives(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {e}")


@router.get("/scanner/hidden-gems")
def hidden_gems_scanner(limit: int = Query(20, ge=1, le=50)) -> list:
    """Scan undervalued small/mid-cap stocks with dividends."""
    try:
        return scan_hidden_gems(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {e}")


@router.get("/screener")
def screener(
    min_dividend_yield: float | None = None,
    max_pe_ratio: float | None = None,
    min_market_cap: int | None = None,
    sector: str | None = None,
    security_type: str | None = None,
    sort_by: str = "dividend_yield",
    limit: int = Query(50, ge=1, le=200),
) -> list:
    """Custom stock/ETF/fund screener with filters."""
    try:
        return screen_custom(
            min_dividend_yield=min_dividend_yield,
            max_pe_ratio=max_pe_ratio,
            min_market_cap=min_market_cap,
            sector=sector,
            security_type=security_type,
            sort_by=sort_by,
            limit=limit,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Screen failed: {e}")
