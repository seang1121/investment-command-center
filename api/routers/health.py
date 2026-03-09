"""Portfolio health check API endpoint."""

from fastapi import APIRouter, HTTPException

from api.services.health_check_service import check_portfolio_health

router = APIRouter(prefix="/api/portfolio", tags=["health"])


@router.get("/health")
def portfolio_health() -> dict:
    try:
        return check_portfolio_health()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
