"""04 — Verificación del RAG: cobertura por bloque + búsquedas de prueba.

Uso:  python 04_verify_rag.py
"""

from rich.console import Console
from rich.table import Table

import config
import pipeline
from search import search_rag

console = Console()

QUERIES_PRUEBA = [
    "anatomía de la córnea capas",
    "tratamiento glaucoma fármacos",
    "retinopatía diabética clasificación",
]


def contar_por_bloque() -> dict[str, int]:
    sb = pipeline.cliente_supabase()
    conteos = {}
    for bloque in config.BLOQUES_OIR:
        res = (
            sb.table("chunks_rag")
            .select("id", count="exact")
            .eq("metadata->>bloque_oir", bloque)
            .limit(1)
            .execute()
        )
        conteos[bloque] = res.count or 0
    return conteos


def main() -> None:
    conteos = contar_por_bloque()
    total = sum(conteos.values())

    tabla = Table(title=f"Cobertura por bloque — {total:,} chunks totales")
    tabla.add_column("Bloque OIR")
    tabla.add_column("Chunks", justify="right")
    tabla.add_column("Estado")
    for bloque, n in sorted(conteos.items(), key=lambda kv: -kv[1]):
        estado = "[green]OK[/green]" if n > 0 else "[red]SIN CHUNKS[/red]"
        tabla.add_row(bloque, f"{n:,}", estado)
    console.print(tabla)

    faltan = [b for b, n in conteos.items() if n == 0]
    if faltan:
        console.print(f"[yellow]Bloques sin cobertura: {', '.join(faltan)}[/yellow]")

    console.print("\n[bold]Búsquedas de prueba[/bold] (top 3 por similitud):")
    for q in QUERIES_PRUEBA:
        console.print(f"\n[cyan]» {q}[/cyan]")
        resultados = search_rag(q, limit=3)
        if not resultados:
            console.print("  [red]sin resultados[/red]")
            continue
        for r in resultados:
            libro = r["metadata"].get("libro", "?")[:45]
            bloque = r["metadata"].get("bloque_oir", "?")
            extracto = " ".join(r["contenido"][:140].split())
            console.print(f"  [{r['score']:.3f}] {bloque} · {libro}")
            console.print(f"        {extracto}…")


if __name__ == "__main__":
    main()
