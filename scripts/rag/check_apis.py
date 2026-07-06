"""Verifica las 4 integraciones del pipeline: Anthropic, OpenAI, Supabase, pgvector.

Uso:  python check_apis.py
"""

import sys

from rich.console import Console

import config
import pipeline

console = Console()
fallos = 0


def check(nombre: str, fn) -> None:
    global fallos
    try:
        detalle = fn()
        console.print(f"[green]OK[/green]  {nombre} — {detalle}")
    except Exception as e:  # noqa: BLE001
        fallos += 1
        console.print(f"[red]FAIL[/red] {nombre} — {type(e).__name__}: {str(e)[:200]}")


def anthropic_ok() -> str:
    resp = pipeline.cliente_anthropic().messages.create(
        model=config.MODEL_TRADUCCION,
        max_tokens=20,
        messages=[{"role": "user", "content": "Di 'ok' en español"}],
    )
    texto = resp.content[0].text.strip()
    assert texto, "respuesta vacía"
    return f"{config.MODEL_TRADUCCION} responde: {texto[:30]!r}"


def openai_ok() -> str:
    vec = pipeline.embed_batch(["prueba de conexión"])
    assert len(vec) == 1 and len(vec[0]) == 1536, f"dimensiones inesperadas: {len(vec[0])}"
    return f"{config.MODEL_EMBEDDING}: vector de 1536 dims"


def supabase_ok() -> str:
    sb = pipeline.cliente_supabase()
    res = sb.table("chunks_rag").select("id", count="exact").limit(1).execute()
    return f"conectado — chunks_rag tiene {res.count or 0} chunks"


def pgvector_ok() -> str:
    vec = pipeline.embed_batch(["córnea"])[0]
    sb = pipeline.cliente_supabase()
    res = sb.rpc(
        "search_chunks",
        {"query_embedding": vec, "match_threshold": 0.0, "match_count": 1, "filter_bloque": None},
    ).execute()
    n = len(res.data or [])
    return f"search_chunks existe y responde ({n} resultado{'s' if n != 1 else ''})"


if __name__ == "__main__":
    check("Anthropic", anthropic_ok)
    check("OpenAI embeddings", openai_ok)
    check("Supabase", supabase_ok)
    check("pgvector search_chunks", pgvector_ok)
    sys.exit(1 if fallos else 0)
