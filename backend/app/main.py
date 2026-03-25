"""FastAPI entrypoint for the portfolio RAG assistant."""

from __future__ import annotations

import json
import os
from collections import defaultdict
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from .groq_client import GroqClient
from .rag_pipeline import RAGPipeline

load_dotenv()

app = FastAPI(title="AI Portfolio Assistant API", version="1.0.0")

cors_origin = os.getenv("CORS_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag = RAGPipeline(data_dir="backend/data")
chat_memory: dict[str, list[dict[str, str]]] = defaultdict(list)


class ChatRequest(BaseModel):
    session_id: str = Field(min_length=1, max_length=100)
    message: str = Field(min_length=1, max_length=2000)


@app.on_event("startup")
def startup_event() -> None:
    rag.build()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat")
def chat(req: ChatRequest) -> dict:
    try:
        groq = GroqClient()
        history = chat_memory[req.session_id][-5:]
        retrieved = rag.retrieve(req.message)
        prompt = rag.build_prompt(req.message, history, retrieved)

        answer = groq.complete(
            prompt=prompt,
            system_prompt="You are a helpful assistant for a developer portfolio.",
        )

        sources = sorted({chunk.source for chunk, _ in retrieved})

        chat_memory[req.session_id].append({"role": "user", "content": req.message})
        chat_memory[req.session_id].append({"role": "assistant", "content": answer})
        chat_memory[req.session_id] = chat_memory[req.session_id][-10:]

        return {"answer": answer, "sources": sources}
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/chat/stream")
def chat_stream(req: ChatRequest) -> EventSourceResponse:
    try:
        groq = GroqClient()
        history = chat_memory[req.session_id][-5:]
        retrieved = rag.retrieve(req.message)
        prompt = rag.build_prompt(req.message, history, retrieved)
        sources = sorted({chunk.source for chunk, _ in retrieved})

        async def event_generator() -> AsyncGenerator[dict, None]:
            full_answer = ""
            for token in groq.stream_complete(
                prompt=prompt,
                system_prompt="You are a helpful assistant for a developer portfolio.",
            ):
                full_answer += token
                yield {"event": "token", "data": token}

            chat_memory[req.session_id].append({"role": "user", "content": req.message})
            chat_memory[req.session_id].append({"role": "assistant", "content": full_answer})
            chat_memory[req.session_id] = chat_memory[req.session_id][-10:]

            yield {"event": "sources", "data": json.dumps(sources)}
            yield {"event": "done", "data": "[DONE]"}

        return EventSourceResponse(event_generator())
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
