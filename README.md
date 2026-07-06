# NovaCap Document Intelligence

An enterprise RAG platform for NovaCap Bank — employees upload internal documents and ask questions in natural language, getting cited answers powered by Azure AI Search and OpenAI.

## Architecture
User uploads PDF → Azure Blob Storage → chunked and indexed in Azure AI Search → User asks question → relevant chunks retrieved → OpenAI GPT-4o-mini generates grounded answer with source citations

## Tech Stack
- Backend: FastAPI (Python)
- Document Storage: Azure Blob Storage
- Search & Retrieval: Azure AI Search
- LLM: OpenAI GPT-4o-mini
- Auth: Azure DefaultAzureCredential (RBAC)
- Frontend: React (coming soon)

## Setup
1. Clone the repo
2. cd backend
3. python -m venv venv
4. venv\Scripts\activate
5. pip install -r requirements.txt
6. Create .env from .env.example
7. az login
8. uvicorn main:app --reload

## API Endpoints
- POST /api/upload — upload and index a PDF or TXT document
- GET /api/search?q=query — search indexed documents
- POST /api/chat — ask a question, get a grounded answer with sources