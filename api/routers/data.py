"""Data endpoints — quotes, history, dividends, fundamentals."""

from fastapi import APIRouter, HTTPException

from api.services.data_fetcher import (
    get_dividend_info,
    get_fundamentals,
    get_history,
    get_quote,
)

router = APIRouter(prefix="/api", tags=["data"])


@router.get("/quote/{ticker}")
def quote(ticker: str) -> dict:
    try:
        return get_quote(ticker)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/history/{ticker}")
def history(ticker: str, period: str = "2y", interval: str = "1d") -> list:
    try:
        return get_history(ticker, period=period, interval=interval)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/dividends/{ticker}")
def dividends(ticker: str) -> dict:
    try:
        return get_dividend_info(ticker)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/fundamentals/{ticker}")
def fundamentals(ticker: str) -> dict:
    try:
        return get_fundamentals(ticker)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
