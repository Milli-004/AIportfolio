# AI Portfolio + RAG Assistant

## 1) High-level architecture (text diagram)

```text
┌───────────────────────────── Frontend (Next.js) ─────────────────────────────┐
│  Landing Page (Hero, Projects, Skills, Resume, Contact)                      │
│  + Floating Chat Widget                                                       │
│  + Streams assistant tokens from backend                                      │
└───────────────────────────────▲───────────────────────────────────────────────┘
                                │ HTTP/SSE
                                ▼
┌────────────────────────────── Backend (FastAPI) ──────────────────────────────┐
│ /api/chat            -> non-stream answer                                      │
│ /api/chat/stream     -> SSE token stream                                       │
│                                                                               │
│        RAG Pipeline                                                            │
│   1. Load docs (resume.txt, skills.txt, projects.json)                        │
│   2. Chunk text (RecursiveCharacterTextSplitter)                              │
│   3. Embed chunks (SentenceTransformers)                                      │
│   4. Index vectors (FAISS cosine via normalized vectors + inner product)      │
│   5. Retrieve top-k + min score filter                                        │
│   6. Prompt with history + context + source labels                            │
│                                                                               │
│        LLM Layer                                                               │
│   Groq API (Llama/Mixtral model) with streaming and fallback behavior         │
└───────────────────────────────▲───────────────────────────────────────────────┘
                                │
                                ▼
                   Structured Local Knowledge Files
                   - backend/data/resume.txt
                   - backend/data/skills.txt
                   - backend/data/projects.json
```

## 2) Folder structure (phase 1)

```text
backend/
  app/
    main.py
    rag_pipeline.py
    groq_client.py
  data/
    resume.txt
    skills.txt
    projects.json
  requirements.txt
frontend/
  app/
  components/
.env.example
README.md
```

## 3) Backend setup

### Install

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cp .env.example .env
```

### Run API

```bash
uvicorn backend.app.main:app --reload --port 8000
```

### Why this design

- **Custom RAG pipeline** keeps logic transparent for learning and easier debugging.
- **FAISS + normalized embeddings** gives fast cosine-style similarity at low cost.
- **Separated `groq_client.py`** isolates model provider details from business logic.
- **SSE stream endpoint** creates a premium real-time UX in the chat widget.
- **Session memory cap** limits cost and avoids context bloat while keeping recent intent.
