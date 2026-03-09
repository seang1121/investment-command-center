"""Monte Carlo simulation API endpoint."""

from fastapi import APIRouter, HTTPException

from api.models.schemas import MonteCarloRequest, MonteCarloResponse
from api.services.monte_carlo_service import run_simulation

router = APIRouter(prefix="/api", tags=["monte-carlo"])


@router.post("/monte-carlo", response_model=MonteCarloResponse)
def monte_carlo(req: MonteCarloRequest) -> dict:
    try:
        return run_simulation(
            tickers=req.tickers,
            weights=req.weights,
            initial_investment=req.initial_investment,
            time_horizon_years=req.time_horizon_years,
            monthly_contribution=req.monthly_contribution,
            monthly_withdrawal=req.monthly_withdrawal,
            num_simulations=req.num_simulations,
            target_value=req.target_value,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Simulation failed: {e}"
        )
