"""Ingesta de la Parte Común (temas 1-25, legislación/gestión) generando el
contenido con Claude a partir del temario oficial (no hay PDFs de estos temas).

Idempotente: salta los temas que ya tienen chunks de tipo 'legislacion_generada'.
Muestra estimación de coste y pide confirmación (salvo --yes).

Uso:
  python ingest_legislacion.py --dry-run   # solo el tema 1
  python ingest_legislacion.py --yes       # los 25, sin preguntar
"""

import argparse
import json
import sys
from pathlib import Path

from rich.console import Console

import config
import pipeline

console = Console()
BLOQUE = "Parte Común — Legislación y Gestión Sanitaria"
COMUN_JSON = Path(__file__).parent / "temario_comun.json"


def ya_ingestado(documento_id: str, numero: int, log) -> bool:
    sb = pipeline.cliente_supabase()
    res = (
        sb.table("chunks_rag")
        .select("id", count="exact")
        .eq("documento_id", documento_id)
        .eq("metadata->>tema_boja", str(numero))
        .limit(1)
        .execute()
    )
    return (res.count or 0) > 0


def generar_texto(tema: dict, log) -> str:
    client = pipeline.cliente_anthropic()
    puntos = "\n".join(f"- {p}" for p in tema["puntos"])
    prompt = f"""Genera un resumen completo y exhaustivo del tema "{tema['titulo']}" para la oposición FEA Oftalmología del SAS Andalucía (temario oficial BOJA).

Incluye TODOS los puntos del temario oficial:
{puntos}

El texto debe:
- Estar en español formal.
- Ser suficientemente detallado para responder preguntas tipo test.
- Incluir los artículos y leyes específicas con sus números.
- Cubrir los subtemas en el orden del temario oficial.

Formato: texto continuo con subtítulos, sin bullet points excesivos. Mínimo 800 palabras."""
    resp = client.messages.create(
        model=config.MODEL_TRADUCCION,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.content[0].text


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="solo el tema 1")
    parser.add_argument("--yes", action="store_true", help="no pedir confirmación")
    args = parser.parse_args()

    if not COMUN_JSON.exists():
        console.print(f"[red]Falta {COMUN_JSON} — regenéralo desde temario_boja.ts[/red]")
        sys.exit(1)
    temas = json.loads(COMUN_JSON.read_text(encoding="utf-8"))
    if args.dry_run:
        temas = temas[:1]

    # estimación: ~1000 tokens output por tema con haiku-4-5 ($5/1M output)
    est = len(temas) * 1000 / 1e6 * config.PRECIO_HAIKU_OUT
    console.print(f"[bold]Estimación[/bold]: {len(temas)} temas · generación ~${est:.2f} + embeddings ~$0.00")
    if not args.dry_run and not args.yes:
        if input("¿Generar e ingestar la Parte Común? [y/N] ").strip().lower() != "y":
            console.print("Cancelado.")
            sys.exit(0)

    log = pipeline.crear_logger("ingest_legislacion")
    documento_id = pipeline.ensure_documento(
        "Parte Común — Legislación y Gestión (generado)", "BOE/BOJA + normativa oficial", log
    )

    total, saltados, errores = 0, 0, 0
    for tema in temas:
        n = tema["numero"]
        try:
            if ya_ingestado(documento_id, n, log):
                saltados += 1
                console.print(f"[dim]T{n} ya ingestado — skip[/dim]")
                continue
            console.print(f"T{n}: {tema['titulo']} — generando…")
            texto = generar_texto(tema, log)
            chunks = pipeline.chunk_semantico(texto)
            if not chunks:
                continue
            embeddings = pipeline.embed_batch(chunks, log)
            metadata = {
                "tipo": "legislacion_generada",
                "tema_boja": n,
                "parte": "comun",
                "bloque_oir": BLOQUE,
                "fuente": "Elaborado a partir de BOE/BOJA y normativa oficial",
            }
            insertados = pipeline.insertar_chunks(documento_id, chunks, embeddings, metadata, log)
            total += insertados
            console.print(f"[green]T{n}: {insertados} chunks[/green]")
        except Exception as e:  # noqa: BLE001
            errores += 1
            log.error("T%d falló: %s", n, e)
            console.print(f"[red]T{n} falló: {e}[/red]")

    console.print(f"[green]Hecho[/green]: {total} chunks · {saltados} saltados · {errores} errores")
    if errores:
        sys.exit(1)


if __name__ == "__main__":
    main()
