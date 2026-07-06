# NovaCap Document Intelligence

An enterprise RAG (Retrieval-Augmented Generation) platform built for NovaCap Bank. Employees upload internal documents and ask questions in natural language — getting accurate, cited answers powered by Azure AI Search and OpenAI.

> Built as part of an AI Engineer upskilling roadmap targeting senior AI Engineer and AI Solution Architect roles.

## Screenshots

### Chat Interface
![Chat Interface](docs/chat.png)

### Document Upload
![Document Upload](docs/upload.png)

## How It Works

1. Employee uploads a PDF or TXT document
2. Document is stored in **Azure Blob Storage**
3. Document is chunked and indexed in **Azure AI Search**
4. Employee asks a question in the chat interface
5. Relevant chunks are retrieved from Azure AI Search
6. **OpenAI GPT-4o-mini** generates a grounded answer using only the retrieved context
7. Answer is returned with source citations — no hallucination

## Architecture

```
PDF Upload → Azure Blob Storage → Chunking Pipeline → Azure AI Search Index
                                                              ↓
User Question → Azure AI Search (retrieval) → OpenAI GPT-4o-mini → Cited Answer
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | FastAPI (Python) |
| Document Storage | Azure Blob Storage |
| Search & Retrieval | Azure AI Search |
| LLM | OpenAI GPT-4o-mini |
| Authentication | Azure DefaultAzureCredential (RBAC) |
| Document Parsing | pypdf |

## Project Structure

```
novacap-doc-intelligence/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── routers/
│   │   ├── upload.py            # Document upload, chunking, indexing
│   │   ├── search.py            # Document search endpoint
│   │   └── chat.py              # RAG chat endpoint
│   ├── services/
│   │   ├── blob_service.py      # Azure Blob Storage operations
│   │   ├── search_service.py    # Azure AI Search operations
│   │   └── llm_service.py       # OpenAI chat completion
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.jsx
│       └── components/
│           ├── Chat.jsx         # Chat UI with source citations
│           └── Upload.jsx       # Document upload UI
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload` | Upload and index a PDF or TXT document |
| GET | `/api/search?q=query` | Search indexed documents |
| POST | `/api/chat` | Ask a question, get a grounded answer with sources |

## Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Azure account with AI Search and Blob Storage resources
- OpenAI API key
- Azure CLI installed and logged in (`az login`)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file based on `.env.example`:

```
AZURE_STORAGE_ACCOUNT=your-storage-account-name
AZURE_SEARCH_ENDPOINT=https://your-search-service.search.windows.net
AZURE_SEARCH_INDEX=novacap-documents
OPENAI_API_KEY=your-openai-api-key
```

Run the backend:

```bash
uvicorn main:app --reload
```

API available at `http://localhost:8000`
Swagger docs at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend available at `http://localhost:5173`

## Azure Resources Required

- **Azure Blob Storage** — document storage container
- **Azure AI Search** — search index (free tier works)
- **RBAC Roles needed:**
  - `Storage Blob Data Contributor` on the storage account
  - `Search Index Data Contributor` on the AI Search service

## Key Technical Decisions

- **DefaultAzureCredential** — no hardcoded keys, uses Azure CLI locally and managed identity in production
- **Chunking with overlap** — documents split into 500-word chunks with 50-word overlap to preserve context across chunk boundaries
- **Grounded responses** — LLM is instructed to answer only from retrieved context, refusing to answer if information isn't in the documents
- **Source citations** — every answer includes the source document name so users can verify

## Roadmap

- [ ] Vector search with embeddings (semantic similarity)
- [ ] Azure APIM gateway with rate limiting
- [ ] Role-based access control per department
- [ ] Azure Monitor query logging and audit trail
- [ ] Deploy to Azure Container Apps + Static Web Apps
- [ ] Support for Word documents (.docx)