"""Portfolio management API endpoints."""

from fastapi import APIRouter, File, HTTPException, UploadFile

from api.services.portfolio_service import (
    get_dividend_calendar,
    get_portfolio_summary,
    import_from_file,
)

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


@router.post("/upload")
async def upload_portfolio(file: UploadFile = File(...)) -> dict:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = file.filename.lower().split(".")[-1]
    if ext not in ("csv", "xlsx", "xls"):
        raise HTTPException(
            status_code=400, detail="File must be .csv, .xlsx, or .xls"
        )

    try:
        content = await file.read()
        return import_from_file(content, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")


@router.get("")
def get_portfolio() -> dict:
    try:
        return get_portfolio_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dividends")
def portfolio_dividends() -> list:
    try:
        return get_dividend_calendar()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
