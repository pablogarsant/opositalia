"""02 — Ingesta del Kanski: extracción → (traducción) → chunks → embeddings → Supabase.

Idempotente: los capítulos que ya tienen chunks en chunks_rag se saltan.
Muestra estimación de coste y pide confirmación antes de la ingesta completa.

Uso:
  python 02_ingest_kanski.py --dry-run   # solo el primer capítulo, sin confirmación
  python 02_ingest_kanski.py             # ingesta completa (pide confirmación)
  python 02_ingest_kanski.py --yes       # ingesta completa sin preguntar
"""

import argparse
import json
import sys

from rich.console import Console
from rich.progress import BarColumn, Progress, TextColumn, TimeElapsedColumn

import config
import pipeline

console = Console()


def estimar_coste(capitulos: list[dict], pdf_path) -> dict:
    """Estimación rápida muestreando 3 páginas por capítulo."""
    import fitz

    doc = fitz.open(pdf_path)
    total_chars = 0
    for c in capitulos:
        ini, fin = c["paginas"][0] - 1, c["paginas"][1]
        paginas = range(ini, fin)
        muestra = [doc[p].get_text() for p in list(paginas)[:3]]
        media = sum(len(m) for m in muestra) / max(len(muestra), 1)
        total_chars += media * (fin - ini)
    doc.close()
    tokens = int(total_chars / 3.8)
    # peor caso: todo requiere traducción (in + out similar). Si el libro ya
    # está en español, la traducción se salta y el coste real es ~solo embeddings.
    coste_trad = tokens / 1e6 * config.PRECIO_HAIKU_IN + tokens * 1.05 / 1e6 * config.PRECIO_HAIKU_OUT
    coste_embed = tokens * 1.05 / 1e6 * config.PRECIO_EMBEDDING
    return {"tokens": tokens, "traduccion_max": coste_trad, "embeddings": coste_embed}


def ingesta_capitulo(cap: dict, documento_id: str, pdf_path, log, progress, task) -> tuple[int, bool]:
    """Procesa un capítulo. Devuelve (chunks_insertados, saltado)."""
    n = cap["numero"]
    esperado_min = 1
    if pipeline.chunks_existentes(documento_id, n, log) >= esperado_min:
        log.info("Capítulo %d ya ingestado — skip", n)
        return 0, True

    progress.update(task, description=f"Cap {n}: {cap['titulo_es'][:40]} — extrayendo")
    texto = pipeline.extraer_texto(pdf_path, cap["paginas"][0] - 1, cap["paginas"][1])
    idioma = pipeline.detectar_idioma(texto)
    traducido = False
    if idioma == "en":
        progress.update(task, description=f"Cap {n}: traduciendo EN→ES")
        texto = pipeline.traducir(texto, log)
        traducido = True

    progress.update(task, description=f"Cap {n}: chunking")
    chunks = pipeline.chunk_semantico(texto)
    if not chunks:
        log.warning("Capítulo %d sin chunks útiles", n)
        return 0, False

    progress.update(task, description=f"Cap {n}: embeddings ({len(chunks)} chunks)")
    embeddings = pipeline.embed_batch(chunks)

    metadata = {
        "libro": config.KANSKI_FILE,
        "libro_principal": True,
        "es_libro_apoyo": False,
        "capitulo": n,
        "capitulo_titulo": cap["titulo_es"],
        "bloque_oir": cap["bloque_oir"],
        "paginas": cap["paginas"],
        "idioma_original": idioma,
        "traducido": traducido,
    }
    insertados = pipeline.insertar_chunks(documento_id, chunks, embeddings, metadata, log)
    log.info("Capítulo %d: %d chunks insertados (idioma=%s traducido=%s)", n, insertados, idioma, traducido)
    return insertados, False


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="solo el primer capítulo")
    parser.add_argument("--yes", action="store_true", help="no pedir confirmación")
    args = parser.parse_args()

    if not config.CHAPTER_MAP_FILE.exists():
        console.print("[red]Falta kanski_chapter_map.json — ejecuta antes 01_parse_kanski.py[/red]")
        sys.exit(1)

    mapa = json.loads(config.CHAPTER_MAP_FILE.read_text(encoding="utf-8"))
    capitulos = mapa["capitulos"][:1] if args.dry_run else mapa["capitulos"]
    pdf_path = config.INPUT_DIR / config.KANSKI_FILE
    log = pipeline.crear_logger("ingesta_kanski")

    est = estimar_coste(capitulos, pdf_path)
    console.print(
        f"[bold]Estimación[/bold]: ~{est['tokens']:,} tokens fuente · "
        f"traducción (peor caso, todo EN): ~${est['traduccion_max']:.2f} · "
        f"embeddings: ~${est['embeddings']:.2f}"
    )
    console.print("[dim]Si el texto ya está en español, la traducción se salta sola.[/dim]")

    if not args.dry_run and not args.yes:
        if input("¿Lanzar ingesta completa? [y/N] ").strip().lower() != "y":
            console.print("Cancelado.")
            sys.exit(0)

    documento_id = pipeline.ensure_documento(config.KANSKI_FILE, str(pdf_path), log)
    total, saltados, errores = 0, 0, 0

    with Progress(
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("{task.completed}/{task.total}"),
        TimeElapsedColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("Ingesta Kanski", total=len(capitulos))
        for cap in capitulos:
            try:
                insertados, saltado = ingesta_capitulo(cap, documento_id, pdf_path, log, progress, task)
                total += insertados
                saltados += 1 if saltado else 0
            except Exception as e:  # noqa: BLE001 — un capítulo no tumba la ingesta
                errores += 1
                log.error("Capítulo %d falló: %s", cap["numero"], e)
                console.print(f"[red]Cap {cap['numero']} falló: {e}[/red]")
            progress.advance(task)

    console.print(
        f"[green]Hecho[/green]: {total} chunks nuevos · {saltados} capítulos ya ingestados · {errores} errores"
    )
    if errores:
        sys.exit(1)


if __name__ == "__main__":
    main()
