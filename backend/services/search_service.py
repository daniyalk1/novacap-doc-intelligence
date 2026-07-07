from dotenv import load_dotenv
from azure.identity import DefaultAzureCredential
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchIndex,
    SimpleField,
    SearchableField,
    SearchFieldDataType,
    VectorSearch,
    HnswAlgorithmConfiguration,
    VectorSearchProfile,
    SearchField,
)
from azure.search.documents.models import VectorizedQuery
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
                SearchField(
                    name="content_vector",
                    type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
                    searchable=True,
                    vector_search_dimensions=1536,
                    vector_search_profile_name="my-vector-profile"
                )
            ]

            vector_search = VectorSearch(
                algorithms=[HnswAlgorithmConfiguration(name="my-hnsw")],
                profiles=[VectorSearchProfile(
                    name="my-vector-profile",
                    algorithm_configuration_name="my-hnsw"
                )]
            )

            index = SearchIndex(
                name=self.index_name,
                fields=fields,
                vector_search=vector_search
            )
            self.index_client.create_index(index)
            print(f"Index '{self.index_name}' created with vector search")
        except Exception as e:
            print(f"Index already exists or error: {e}")

    def index_chunks(self, chunks: list[dict]):
        self.search_client.upload_documents(documents=chunks)

    def search(self, query: str, query_vector: list[float], top: int = 3):
        vector_query = VectorizedQuery(
            vector=query_vector,
            k_nearest_neighbors=top,
            fields="content_vector"
        )

        results = self.search_client.search(
            search_text=query,
            vector_queries=[vector_query],
            top=top
        )

        return [
            {
                "content": r["content"],
                "filename": r["filename"],
                "chunk_id": r["chunk_id"]
            }
            for r in results
        ]