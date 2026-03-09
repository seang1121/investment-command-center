"""Portfolio optimization API endpoint."""

from fastapi import APIRouter, HTTPException

from api.models.schemas import OptimizationRequest
from api.services.optimization_service import optimize_portfolio

router = APIRouter(prefix="/api", tags=["optimization"])


@router.post("/optimize")
def optimize(req: OptimizationRequest) -> dict:
    try:
        return optimize_portfolio(
            tickers=req.tickers,
            period=req.period,
            risk_free_rate=req.risk_free_rate,
            num_portfolios=req.num_portfolios,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Optimization failed: {e}"
        )
