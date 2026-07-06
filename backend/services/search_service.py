from dotenv import load_dotenv
from azure.identity import DefaultAzureCredential
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchIndex, SimpleField, SearchableField, SearchFieldDataType
)
import os

load_dotenv()

class SearchService:
    def __init__(self):
        endpoint = os.getenv("AZURE_SEARCH_ENDPOINT")
        index_name = os.getenv("AZURE_SEARCH_INDEX")
        credential = DefaultAzureCredential()
        self.index_name = index_name
        self.search_client = SearchClient(
            endpoint=endpoint,
            index_name=index_name,
            credential=credential
        )
        self.index_client = SearchIndexClient(
            endpoint=endpoint,
            credential=credential
        )
        self._ensure_index()

    def _ensure_index(self):
        try:
            fields = [
                SimpleField(name="id", type=SearchFieldDataType.String, key=True),
                SearchableField(name="content", type=SearchFieldDataType.String),
                SimpleField(name="filename", type=SearchFieldDataType.String, filterable=True),
                SimpleField(name="chunk_id", type=SearchFieldDataType.Int32, filterable=True),
            ]
            index = SearchIndex(name=self.index_name, fields=fields)
            self.index_client.create_index(index)
        except Exception:
            pass

    def index_chunks(self, chunks: list[dict]):
        self.search_client.upload_documents(documents=chunks)

    def search(self, query: str, top: int = 3):
        results = self.search_client.search(search_text=query, top=top)
        return [
            {
                "content": r["content"],
                "filename": r["filename"],
                "chunk_id": r["chunk_id"]
            }
            for r in results
        ]