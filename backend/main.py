from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import upload, search, chat

app = FastAPI(title="NovaCap Document Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(search.router, prefix="/api", tags=["Search"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])

@app.get("/")
def root():
    return {"message": "NovaCap Document Intelligence API is running"}