"""Risk metrics API endpoint."""

from fastapi import APIRouter, HTTPException

from api.models.schemas import RiskMetricsRequest, RiskMetricsResponse
from api.services.risk_service import compute_risk_metrics

router = APIRouter(prefix="/api", tags=["risk"])


@router.post("/risk-metrics", response_model=RiskMetricsResponse)
def risk_metrics(req: RiskMetricsRequest) -> dict:
    try:
        return compute_risk_metrics(
            tickers=req.tickers,
            weights=req.weights,
            period=req.period,
            risk_free_rate=req.risk_free_rate,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")
