"""Net worth tracker API endpoints."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from api.services.networth_service import (
    add_asset,
    add_liability,
    delete_asset,
    delete_liability,
    get_assets,
    get_liabilities,
    get_net_worth_history,
    get_net_worth_summary,
    save_snapshot,
)

router = APIRouter(prefix="/api/net-worth", tags=["net-worth"])


class AssetCreate(BaseModel):
    name: str
    value: float
    category: str = "Other"


class LiabilityCreate(BaseModel):
    name: str
    balance: float
    category: str = "Other"
    interest_rate: float = 0
    min_payment: float = 0


@router.post("/assets")
def create_asset(body: AssetCreate) -> dict:
    try:
        return add_asset(body.name, body.value, body.category)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/assets")
def list_assets() -> list:
    try:
        return get_assets()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/assets/{asset_id}")
def remove_asset(asset_id: int) -> dict:
    try:
        delete_asset(asset_id)
        return {"deleted": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/liabilities")
def create_liability(body: LiabilityCreate) -> dict:
    try:
        return add_liability(
            body.name,
            body.balance,
            body.category,
            body.interest_rate,
            body.min_payment,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/liabilities")
def list_liabilities() -> list:
    try:
        return get_liabilities()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/liabilities/{liability_id}")
def remove_liability(liability_id: int) -> dict:
    try:
        delete_liability(liability_id)
        return {"deleted": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
def summary() -> dict:
    try:
        return get_net_worth_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/snapshot")
def create_snapshot() -> dict:
    try:
        return save_snapshot()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
def history(months: int = 12) -> list:
    try:
        return get_net_worth_history(months)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
