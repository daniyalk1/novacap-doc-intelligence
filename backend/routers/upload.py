from fastapi import APIRouter, UploadFile, File, HTTPException
from services.blob_service import BlobService
from services.search_service import SearchService
from services.llm_service import LLMService
from pypdf import PdfReader
import io
import uuid

router = APIRouter()
blob_service = BlobService()
search_service = SearchService()
llm_service = LLMService()

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start = end - overlap
    return chunks

def extract_text(file_bytes: bytes, filename: str) -> str:
    if filename.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(file_bytes))
        return " ".join([page.extract_text() for page in reader.pages if page.extract_text()])
    elif filename.endswith(".txt"):
        return file_bytes.decode("utf-8")
    else:
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported")

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        blob_service.upload_file(file.filename, contents)
        text = extract_text(contents, file.filename)
        chunks = chunk_text(text)

        docs = []
        for i, chunk in enumerate(chunks):
            embedding = llm_service.get_embedding(chunk)
            docs.append({
                "id": str(uuid.uuid4()),
                "content": chunk,
                "filename": file.filename,
                "chunk_id": i,
                "content_vector": embedding
            })

        search_service.index_chunks(docs)
        return {
            "message": f"Successfully uploaded and indexed {file.filename}",
            "chunks_indexed": len(docs)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))