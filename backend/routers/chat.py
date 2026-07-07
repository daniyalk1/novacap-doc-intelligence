from fastapi import APIRouter
from pydantic import BaseModel
from services.search_service import SearchService
from services.llm_service import LLMService

router = APIRouter()
search_service = SearchService()
llm_service = LLMService()

class ChatRequest(BaseModel):
    question: str

@router.post("/chat")
def chat(request: ChatRequest):
    query_vector = llm_service.get_embedding(request.question)
    chunks = search_service.search(request.question, query_vector)
    response = llm_service.generate(request.question, chunks)
    return response