"""Búsqueda semántica reutilizable sobre chunks_rag (la usará el chatbot).

Requiere la función SQL search_chunks en Supabase
(supabase/functions/search_chunks.sql).
"""

import config
import pipeline


def search_rag(query: str, bloque: str | None = None, limit: int = 5) -> list[dict]:
    """Busca chunks relevantes para una query.

    Si se especifica bloque, filtra por ese bloque temático.
    Devuelve lista de {contenido, metadata, score}.
    """
    embedding = pipeline.embed_batch([query])[0]
    sb = pipeline.cliente_supabase()
    res = sb.rpc(
        "search_chunks",
        {
            "query_embedding": embedding,
            "match_threshold": 0.3,
            "match_count": limit,
            "filter_bloque": bloque,
        },
    ).execute()
    return [
        {"contenido": r["contenido"], "metadata": r["metadata"], "score": r["similarity"]}
        for r in (res.data or [])
    ]


if __name__ == "__main__":
    import sys

    q = " ".join(sys.argv[1:]) or "anatomía de la córnea"
    for r in search_rag(q, limit=3):
        print(f"[{r['score']:.3f}] {r['metadata'].get('libro', '?')[:40]} — {r['contenido'][:120]}…")
