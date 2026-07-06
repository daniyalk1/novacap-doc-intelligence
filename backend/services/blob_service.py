from dotenv import load_dotenv
from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobServiceClient
import os

load_dotenv()

class BlobService:
    def __init__(self):
        account = os.getenv("AZURE_STORAGE_ACCOUNT")
        account_url = f"https://{account}.blob.core.windows.net"
        credential = DefaultAzureCredential()
        self.client = BlobServiceClient(account_url=account_url, credential=credential)
        self.container = "novacap-documents"
        self._ensure_container()

    def _ensure_container(self):
        try:
            self.client.create_container(self.container)
        except Exception:
            pass

    def upload_file(self, filename: str, data: bytes) -> str:
        blob_client = self.client.get_blob_client(
            container=self.container,
            blob=filename
        )
        blob_client.upload_blob(data, overwrite=True)
        return filename

    def list_files(self):
        container_client = self.client.get_container_client(self.container)
        return [blob.name for blob in container_client.list_blobs()]