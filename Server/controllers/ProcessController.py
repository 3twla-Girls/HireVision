from .BaseController import BaseController
import os
import tempfile
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from ..models import ProcessingEnum


class ProcessController(BaseController):

    def __init__(self):
        super().__init__()

    # -----------------------------------------
    # Extract text from uploaded file
    # -----------------------------------------
    def get_file_content_from_upload(self, file_bytes: bytes, filename: str):
        """
        Extract text from uploaded file (PDF or TXT)
        """
        ext = os.path.splitext(filename)[-1].lower()

        if ext == ProcessingEnum.PDF.value:
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(file_bytes)
                tmp_path = tmp.name

            try:
                loader = PyMuPDFLoader(tmp_path)
                documents = loader.load()
                text = " ".join([doc.page_content for doc in documents])
            finally:
                os.unlink(tmp_path)

            return text

        elif ext == ProcessingEnum.TXT.value:
            return file_bytes.decode("utf-8")

        return None

    # -----------------------------------------
    # Split text into chunks
    # -----------------------------------------
    def split_text(self, text: str, chunk_size: int = 500, overlap_size: int = 50):
        """
        Split raw text into chunked documents
        """
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=overlap_size,
            length_function=len,
        )

        chunks = text_splitter.create_documents([text])
        return chunks