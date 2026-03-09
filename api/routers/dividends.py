"""Dividend analysis API endpoints."""

from fastapi import APIRouter, HTTPException

from api.models.schemas import DividendAnalysisRequest
from api.services.dividend_service import analyze_dividend

router = APIRouter(prefix="/api", tags=["dividends"])


@router.post("/dividends/analyze")
def dividend_analysis(req: DividendAnalysisRequest) -> dict:
    try:
        return analyze_dividend(
            ticker=req.ticker,
            required_return=req.required_return,
            growth_rate=req.growth_rate,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Dividend analysis failed: {e}"
        )
