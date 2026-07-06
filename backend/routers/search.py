from fastapi import APIRouter, Query
from services.search_service import SearchService

router = APIRouter()
search_service = SearchService()

@router.get("/search")
def search_documents(q: str = Query(..., description="Search query")):
    results = search_service.search(q)
    return {"query": q, "results": results}