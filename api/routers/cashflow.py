"""Cash flow management API endpoints."""

import logging

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field

from api.services.cashflow_service import (
    add_bill,
    add_income,
    delete_bill,
    delete_income,
    get_bills,
    get_cashflow_summary,
    get_income_sources,
    get_transactions,
    parse_bank_statement,
    save_transactions,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cashflow", tags=["cashflow"])


class IncomeRequest(BaseModel):
    source: str = Field(..., min_length=1, description="Income source name")
    amount: float = Field(..., gt=0, description="Income amount")
    frequency: str = Field(
        "monthly",
        description="Payment frequency: weekly, biweekly, semi-monthly, monthly, quarterly, annually",
    )
    is_gross: bool = Field(False, description="Whether amount is gross (pre-tax)")


class BillRequest(BaseModel):
    name: str = Field(..., min_length=1, description="Bill name")
    amount: float = Field(..., gt=0, description="Bill amount")
    due_day: int = Field(..., ge=1, le=31, description="Day of month bill is due")
    category: str = Field("Other", description="Bill category")
    auto_pay: bool = Field(False, description="Whether bill is on auto-pay")


@router.post("/upload-statement")
async def upload_statement(file: UploadFile = File(...)) -> dict:
    """Upload and parse a bank statement CSV file."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = file.filename.lower().split(".")[-1]
    if ext != "csv":
        raise HTTPException(status_code=400, detail="File must be .csv")

    try:
        content = await file.read()
        transactions = parse_bank_statement(content, file.filename)
        count = save_transactions(transactions)
        return {
            "filename": file.filename,
            "transactions_parsed": len(transactions),
            "transactions_saved": count,
            "transactions": transactions[:20],
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Statement upload failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")


@router.get("/transactions")
def list_transactions(months: int = Query(3, ge=1, le=24)) -> list[dict]:
    """Get transactions from the last N months."""
    try:
        return get_transactions(months)
    except Exception as e:
        logger.error("Failed to get transactions: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/income")
def create_income(req: IncomeRequest) -> dict:
    """Add an income source."""
    valid_frequencies = {
        "weekly", "biweekly", "semi-monthly", "monthly", "quarterly", "annually",
    }
    if req.frequency.lower() not in valid_frequencies:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid frequency. Must be one of: {', '.join(sorted(valid_frequencies))}",
        )
    try:
        return add_income(req.source, req.amount, req.frequency, req.is_gross)
    except Exception as e:
        logger.error("Failed to add income: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/income")
def list_income() -> list[dict]:
    """Get all income sources."""
    try:
        return get_income_sources()
    except Exception as e:
        logger.error("Failed to get income sources: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/income/{income_id}")
def remove_income(income_id: int) -> dict:
    """Delete an income source."""
    try:
        deleted = delete_income(income_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Income source not found")
        return {"deleted": True, "id": income_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete income %d: %s", income_id, e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bills")
def create_bill(req: BillRequest) -> dict:
    """Add a recurring bill."""
    try:
        return add_bill(req.name, req.amount, req.due_day, req.category, req.auto_pay)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Failed to add bill: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bills")
def list_bills() -> list[dict]:
    """Get all recurring bills."""
    try:
        return get_bills()
    except Exception as e:
        logger.error("Failed to get bills: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/bills/{bill_id}")
def remove_bill(bill_id: int) -> dict:
    """Delete a recurring bill."""
    try:
        deleted = delete_bill(bill_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Bill not found")
        return {"deleted": True, "id": bill_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete bill %d: %s", bill_id, e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
def cashflow_summary(months: int = Query(3, ge=1, le=24)) -> dict:
    """Get comprehensive cash flow summary."""
    try:
        return get_cashflow_summary(months)
    except Exception as e:
        logger.error("Failed to generate cashflow summary: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
