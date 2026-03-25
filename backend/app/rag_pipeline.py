"""RAG pipeline with FAISS retrieval and source citations."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import faiss
import numpy as np
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer


@dataclass
class Chunk:
    id: str
    source: str
    text: str


class RAGPipeline:
    """Simple, production-friendly RAG pipeline with explicit control."""

    def __init__(self, data_dir: str, embedding_model: str | None = None) -> None:
        self.data_dir = Path(data_dir)
        self.embedding_model_name = embedding_model or os.getenv(
            "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
        )
        self.embedder = SentenceTransformer(self.embedding_model_name)

        self.chunks: list[Chunk] = []
        self.index: faiss.IndexFlatIP | None = None

    def build(self) -> None:
        docs = list(self._load_documents())
        self.chunks = self._chunk_documents(docs)
        vectors = self._embed([c.text for c in self.chunks])

        index = faiss.IndexFlatIP(vectors.shape[1])
        index.add(vectors)
        self.index = index

    def _load_documents(self) -> Iterable[tuple[str, str]]:
        resume_path = self.data_dir / "resume.txt"
        skills_path = self.data_dir / "skills.txt"
        projects_path = self.data_dir / "projects.json"

        if resume_path.exists():
            yield ("resume.txt", resume_path.read_text(encoding="utf-8"))
        if skills_path.exists():
            yield ("skills.txt", skills_path.read_text(encoding="utf-8"))
        if projects_path.exists():
            projects = json.loads(projects_path.read_text(encoding="utf-8"))
            for i, project in enumerate(projects):
                text = (
                    f"Project: {project['name']}\n"
                    f"Summary: {project['summary']}\n"
                    f"Stack: {', '.join(project['stack'])}"
                )
                yield (f"projects.json#{i}", text)

    def _chunk_documents(self, docs: Iterable[tuple[str, str]]) -> list[Chunk]:
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=60)
        chunks: list[Chunk] = []

        for source, text in docs:
            for idx, chunk in enumerate(splitter.split_text(text)):
                chunks.append(Chunk(id=f"{source}:{idx}", source=source, text=chunk))

        return chunks

    def _embed(self, texts: list[str]) -> np.ndarray:
        embeddings = self.embedder.encode(texts, normalize_embeddings=True)
        return np.array(embeddings, dtype="float32")

    def retrieve(self, query: str, top_k: int = 4, min_score: float = 0.28) -> list[tuple[Chunk, float]]:
        if not self.index or not self.chunks:
            raise RuntimeError("RAG index is not built. Call build() on startup.")

        query_vector = self._embed([query])
        scores, indices = self.index.search(query_vector, top_k)

        results: list[tuple[Chunk, float]] = []
        for i, score in zip(indices[0], scores[0], strict=False):
            if i < 0:
                continue
            if float(score) >= min_score:
                results.append((self.chunks[int(i)], float(score)))

        return results

    @staticmethod
    def build_prompt(question: str, history: list[dict], retrieved: list[tuple[Chunk, float]]) -> str:
        history_text = "\n".join(
            [f"{m['role'].upper()}: {m['content']}" for m in history[-5:]]
        )
        context = "\n\n".join(
            [f"[Source: {c.source}]\n{c.text}" for c, _ in retrieved]
        )

        return f"""
You are an AI portfolio assistant. Answer with only provided context.
If context is insufficient, say you don't have enough information and suggest contacting the owner.

Conversation history:
{history_text}

Retrieved context:
{context if context else 'NO_RELEVANT_CONTEXT'}

User question:
{question}

Instructions:
- Be concise and accurate.
- Mention project names when possible.
- End with a "Sources:" section listing source file names used.
""".strip()
