"""03 — Ingesta de los libros de apoyo (todos los PDFs salvo el Kanski).

Sin mapeo de capítulos: el bloque OIR se asigna por keywords del título del
archivo. Idempotente por libro (si el documento ya tiene chunks, se salta).

Uso:
  python 03_ingest_apoyo.py --dry-run        # solo el primer libro
  python 03_ingest_apoyo.py --limit 5        # los 5 primeros
  python 03_ingest_apoyo.py --yes            # todos sin confirmación
"""

import argparse
import sys

from rich.console import Console
from rich.progress import BarColumn, Progress, TextColumn, TimeElapsedColumn

import config
import pipeline

console = Console()

# páginas por tramo de procesado: los libros grandes se ingieren por tramos
# para no cargar 1000 páginas en memoria ni mandar mega-textos a traducir
PAGINAS_POR_TRAMO = 40


def ingesta_libro(pdf_path, log, progress, task) -> tuple[int, bool]:
    import fitz

    titulo = pdf_path.name
    documento_id = pipeline.ensure_documento(titulo, str(pdf_path), log)
    if pipeline.chunks_existentes(documento_id, None, log) > 0:
        log.info("%s ya ingestado — skip", titulo)
        return 0, True

    bloque = config.asignar_bloque(titulo)
    doc = fitz.open(pdf_path)
    n_paginas = doc.page_count
    doc.close()

    total = 0
    idioma_libro = None
    for ini in range(0, n_paginas, PAGINAS_POR_TRAMO):
        fin = min(ini + PAGINAS_POR_TRAMO, n_paginas)
        progress.update(task, description=f"{titulo[:35]} — pág {ini + 1}-{fin}/{n_paginas}")
        texto = pipeline.extraer_texto(pdf_path, ini, fin)
        if not texto.strip():
            continue
        if idioma_libro is None:
            idioma_libro = pipeline.detectar_idioma(texto)
        traducido = False
        if idioma_libro == "en":
            texto = pipeline.traducir(texto, log)
            traducido = True
        chunks = pipeline.chunk_semantico(texto)
        if not chunks:
            continue
        embeddings = pipeline.embed_batch(chunks, log)
        metadata = {
            "libro": titulo,
            "libro_principal": False,
            "es_libro_apoyo": True,
            "bloque_oir": bloque,
            "paginas": [ini + 1, fin],
            "idioma_original": idioma_libro,
            "traducido": traducido,
        }
        total += pipeline.insertar_chunks(documento_id, chunks, embeddings, metadata, log)

    log.info("%s: %d chunks (bloque=%s idioma=%s)", titulo, total, bloque, idioma_libro)
    return total, False


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="solo el primer libro")
    parser.add_argument("--limit", type=int, default=None, help="máximo de libros")
    parser.add_argument("--yes", action="store_true")
    args = parser.parse_args()

    pdfs = sorted(p for p in config.INPUT_DIR.glob("*.pdf") if p.name != config.KANSKI_FILE)
    if args.dry_run:
        pdfs = pdfs[:1]
    elif args.limit:
        pdfs = pdfs[: args.limit]

    console.print(f"{len(pdfs)} libros de apoyo a procesar")
    if not args.dry_run and not args.yes:
        if input("¿Continuar? [y/N] ").strip().lower() != "y":
            sys.exit(0)

    log = pipeline.crear_logger("ingesta_apoyo")
    total, saltados, errores = 0, 0, 0

    with Progress(
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("{task.completed}/{task.total}"),
        TimeElapsedColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("Libros de apoyo", total=len(pdfs))
        for pdf in pdfs:
            try:
                insertados, saltado = ingesta_libro(pdf, log, progress, task)
                total += insertados
                saltados += 1 if saltado else 0
            except Exception as e:  # noqa: BLE001
                errores += 1
                log.error("%s falló: %s", pdf.name, e)
                console.print(f"[red]{pdf.name} falló: {e}[/red]")
            progress.advance(task)

    console.print(f"[green]Hecho[/green]: {total} chunks · {saltados} libros ya ingestados · {errores} errores")
    if errores:
        sys.exit(1)


if __name__ == "__main__":
    main()
