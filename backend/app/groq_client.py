"""Groq client wrapper with sync + streaming helpers."""

from __future__ import annotations

import os
from typing import Generator

from groq import Groq


class GroqClient:
    """Thin client around Groq SDK to keep API logic centralized."""

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.model = model or os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

        if not self.api_key:
            raise ValueError("GROQ_API_KEY is missing. Add it to your environment.")

        self.client = Groq(api_key=self.api_key)

    def complete(self, prompt: str, system_prompt: str) -> str:
        """Standard completion for non-streaming use cases."""
        resp = self.client.chat.completions.create(
            model=self.model,
            temperature=0.2,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
        )
        return resp.choices[0].message.content or ""

    def stream_complete(self, prompt: str, system_prompt: str) -> Generator[str, None, None]:
        """Yield model tokens as they stream from Groq."""
        stream = self.client.chat.completions.create(
            model=self.model,
            temperature=0.2,
            stream=True,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
        )

        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
