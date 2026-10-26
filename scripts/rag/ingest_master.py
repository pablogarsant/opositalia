"""Ingesta selectiva del máster de oftalmología (15 módulos, 249 PDFs).

Lee el inventario ya analizado, filtra por fase de prioridad y reusa el
pipeline existente (extracción, detección de idioma, traducción EN→ES con
Haiku, chunking ~800 tokens, embeddings, inserción con metadatos).
Idempotente por documento vía ensure_documento + chunks_existentes.

Uso:
  .venv\\Scripts\\python ingest_master.py --fase A --dry-run   # solo listado y coste
  .venv\\Scripts\\python ingest_master.py --fase A --yes
  .venv\\Scripts\\python ingest_master.py --fase B --solo-articulos-guias --yes
  .venv\\Scripts\\python ingest_master.py --fase C --yes
  # reintentar PDFs concretos (borra antes sus chunks parciales):
  .venv\\Scripts\\python ingest_master.py --fase A --archivos-desde pendientes_refractiva.txt --rehacer --yes
"""

import argparse
import csv
import sys
import unicodedata
from pathlib import Path

from rich.console import Console
from rich.progress import BarColumn, Progress, TextColumn, TimeElapsedColumn

import config
import pipeline

console = Console()

# La carpeta raíz viene de WeTransfer con acentos en forma NFD: no se puede
# escribir el literal. Se descubre en runtime (es la única subcarpeta).
_WETRANSFER = Path(r"C:/Users/user/Downloads/wetransfer_master_2026-07-22_1733")
MASTER_DIR = next(p for p in _WETRANSFER.iterdir() if p.is_dir())
INVENTARIO = Path(r"C:/KAIROS/kairos-os/analisis_master/inventario.csv")

# módulo (nº de carpeta) → (bloque_oir, temas_boja)
MAPEO = {
    "1": ("Cristalino y cataratas", [66, 67, 68]),
    "2": ("Órbita y párpados", [40, 41, 42, 43, 44]),
    "3": ("Glaucoma", [69, 70, 71, 72, 73]),
    "4": ("Córnea y superficie ocular", [45, 54, 55, 56, 57, 58]),
    "5": ("Refracción y cirugía refractiva", [27, 28, 29, 30, 31, 32]),
    "6": ("Estrabismo y oftalmología pediátrica", [33, 34, 37, 38]),
    "7": ("Retina y vítreo", [83, 84, 86]),
    "8": ("Retina y vítreo", [76, 77, 78, 82]),
    "9": ("Úvea", [61, 62, 63, 64, 65]),
    "10": ("Neuro-oftalmología", [88, 89, 90, 91, 92, 93]),
}

# fases → módulos. Fase A además arrastra toda guia_clinica de cualquier módulo.
FASES = {"A": {"5", "7", "9", "2"}, "B": {"1", "3", "4", "8"}, "C": {"6", "10"}}

PAGINAS_POR_TRAMO = 40


def _num_modulo(carpeta: str) -> str:
    return carpeta.split(".")[0].strip()


def cargar_inventario() -> list[dict]:
    with open(INVENTARIO, encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def filtrar(filas: list[dict], fase: str, solo_articulos_guias: bool) -> list[dict]:
    mods = FASES[fase]
    out = []
    for r in filas:
        if r["apto_rag"] != "si":
            continue
        en_fase = _num_modulo(r["carpeta"]) in mods
        # Fase A arrastra todas las guías clínicas de cualquier módulo
        if fase == "A":
            en_fase = en_fase or r["tipo_contenido"] == "guia_clinica"
        if not en_fase:
            continue
        if solo_articulos_guias and r["tipo_contenido"] not in ("articulo", "guia_clinica"):
            continue
        out.append(r)
    return out


def _hijo(base: Path, nombre: str) -> Path:
    """Resuelve un hijo tolerando NFC/NFD en los acentos del nombre en disco."""
    p = base / nombre
    if p.exists():
        return p
    objetivo = unicodedata.normalize("NFC", nombre)
    for cand in base.iterdir():
        if unicodedata.normalize("NFC", cand.name) == objetivo:
            return cand
    return p  # no existe; el caller lo reporta


def ruta_pdf(r: dict) -> Path:
    base = _hijo(MASTER_DIR, r["carpeta"])
    if r["subcarpeta"]:
        base = _hijo(base, r["subcarpeta"])
    if not base.exists():
        return base / r["nombre_archivo"]
    return _hijo(base, r["nombre_archivo"])


def ingesta_pdf(r: dict, log, progress, task, rehacer: bool = False) -> tuple[int, bool]:
    pdf = ruta_pdf(r)
    if not pdf.exists():
        raise FileNotFoundError(pdf)

    num = _num_modulo(r["carpeta"])
    bloque, temas = MAPEO[num]
    # título único por ruta relativa (hay nombres repetidos entre módulos)
    titulo = f"master/{r['carpeta']}/{r['nombre_archivo']}"

    documento_id = pipeline.ensure_documento(titulo, str(pdf), log)
    if rehacer:
        # un fallo a mitad (p. ej. saldo agotado en el tramo 2) deja chunks
        # parciales que harían saltar el documento: se borran y se rehace entero
        borrados = pipeline.cliente_supabase().table("chunks_rag").delete().eq("documento_id", documento_id).execute()
        log.info("%s: %d chunks previos borrados (--rehacer)", titulo, len(borrados.data or []))
    elif pipeline.chunks_existentes(documento_id, None, log) > 0:
        log.info("%s ya ingestado — skip", titulo)
        return 0, True

    n_paginas = int(r["num_paginas"] or 0)
    total = 0
    idioma_doc = None
    for ini in range(0, max(n_paginas, 1), PAGINAS_POR_TRAMO):
        fin = min(ini + PAGINAS_POR_TRAMO, n_paginas) if n_paginas else None
        progress.update(task, description=f"{r['nombre_archivo'][:38]} p{ini + 1}-{fin or '?'}")
        texto = pipeline.extraer_texto(pdf, ini, fin)
        if not texto.strip():
            continue
        if idioma_doc is None:
            idioma_doc = pipeline.detectar_idioma(texto)
        traducido = False
        if idioma_doc == "en":
            texto = pipeline.traducir(texto, log)
            traducido = True
        chunks = pipeline.chunk_semantico(texto)
        if not chunks:
            continue
        embeddings = pipeline.embed_batch(chunks, log)
        metadata = {
            "fuente": "master_oftalmologia",
            "modulo": r["carpeta"],
            "tipo_contenido": r["tipo_contenido"],
            "bloque_oir": bloque,
            "temas_boja": temas,
            "idioma_original": idioma_doc,
            "traducido": traducido,
            "paginas": [ini + 1, fin],
        }
        total += pipeline.insertar_chunks(documento_id, chunks, embeddings, metadata, log)

    log.info("%s: %d chunks (bloque=%s idioma=%s)", titulo, total, bloque, idioma_doc)
    return total, False


def preflight(filas: list[dict]) -> None:
    en = [r for r in filas if r["idioma_detectado"] == "en"]
    pg = sum(int(r["num_paginas"] or 0) for r in filas)
    pg_en = sum(int(r["num_paginas"] or 0) for r in en)
    # ~4.000 chars/página (mediana del inventario) ≈ 1.000 tokens/página
    tok_trad = pg_en * 1000
    # Haiku: $1/M entrada + $5/M salida (salida ≈ entrada en traducción)
    coste_trad = tok_trad / 1e6 * (1 + 5)
    coste_embed = pg * 1000 / 1e6 * config.PRECIO_EMBEDDING
    console.print(f"[bold]PDFs a procesar:[/bold] {len(filas)} ({pg} páginas)")
    console.print(f"[bold]En inglés (traducción Haiku):[/bold] {len(en)} PDFs ({pg_en} páginas)")
    console.print(f"[bold]Coste estimado:[/bold] traducción ≈ ${coste_trad:.2f} · embeddings ≈ ${coste_embed:.2f}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fase", required=True, choices=["A", "B", "C"])
    parser.add_argument("--solo-articulos-guias", action="store_true")
    parser.add_argument("--dry-run", action="store_true", help="solo listado y coste")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--yes", action="store_true")
    parser.add_argument("--archivos-desde", type=Path, help="txt con un nombre_archivo por línea")
    parser.add_argument("--rehacer", action="store_true", help="borra los chunks previos de cada PDF antes de ingestar")
    args = parser.parse_args()
    if args.rehacer and not args.archivos_desde:
        parser.error("--rehacer solo se permite junto a --archivos-desde (evita rehacer una fase entera)")

    filas = filtrar(cargar_inventario(), args.fase, args.solo_articulos_guias)
    if args.archivos_desde:
        pedidos = {l.strip() for l in args.archivos_desde.read_text(encoding="utf-8").splitlines() if l.strip()}
        filas = [r for r in filas if r["nombre_archivo"] in pedidos]
        sin_match = pedidos - {r["nombre_archivo"] for r in filas}
        if sin_match:
            raise SystemExit(f"No están en el inventario de la fase {args.fase}: {sorted(sin_match)}")
    if args.limit:
        filas = filas[: args.limit]

    preflight(filas)
    faltan = [r["nombre_archivo"] for r in filas if not ruta_pdf(r).exists()]
    if faltan:
        console.print(f"[red]{len(faltan)} PDFs no encontrados en disco:[/red] {faltan[:5]}...")
    if args.dry_run:
        return
    if not args.yes and input("¿Continuar? [y/N] ").strip().lower() != "y":
        sys.exit(0)

    log = pipeline.crear_logger(f"ingesta_master_{args.fase}")
    total, saltados, errores = 0, 0, 0
    with Progress(
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("{task.completed}/{task.total}"),
        TimeElapsedColumn(),
        console=console,
    ) as progress:
        task = progress.add_task(f"Fase {args.fase}", total=len(filas))
        for r in filas:
            try:
                n, saltado = ingesta_pdf(r, log, progress, task, args.rehacer)
                total += n
                saltados += 1 if saltado else 0
            except Exception as e:  # noqa: BLE001
                errores += 1
                log.error("%s falló: %s", r["nombre_archivo"], e)
                console.print(f"[red]{r['nombre_archivo']} falló: {e}[/red]")
            progress.advance(task)

    console.print(
        f"[green]Fase {args.fase} hecha[/green]: {total} chunks nuevos · "
        f"{saltados} ya ingestados · {errores} errores"
    )
    if errores:
        sys.exit(1)


if __name__ == "__main__":
    main()
