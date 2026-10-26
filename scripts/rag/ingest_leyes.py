"""Ingesta de leyes clave del temario común directamente desde el BOE
(versión consolidada). Complementa ingest_legislacion.py con el texto legal
literal. Best-effort: el HTML del BOE puede cambiar; si una ley no se puede
extraer, se salta y se registra.

Uso:  python ingest_leyes.py [--yes]
"""

import argparse
import re
import sys
import urllib.request

from rich.console import Console

import pipeline

console = Console()
BLOQUE = "Parte Común — Legislación Sanitaria"

LEYES = [
    {"url": "https://www.boe.es/buscar/act.php?id=BOE-A-1986-10499", "titulo": "Ley 14/1986 General de Sanidad", "temas_boja": [3]},
    {"url": "https://www.boe.es/buscar/act.php?id=BOE-A-2003-21340", "titulo": "Ley 55/2003 Estatuto Marco del Personal Estatutario", "temas_boja": [8]},
    {"url": "https://www.boe.es/buscar/act.php?id=BOE-A-2002-22188", "titulo": "Ley 41/2002 Autonomía del Paciente", "temas_boja": [9]},
    {"url": "https://www.boe.es/buscar/act.php?id=BOE-A-2003-10715", "titulo": "Ley 16/2003 de Cohesión y Calidad del SNS", "temas_boja": [11]},
    {"url": "https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673", "titulo": "LO 3/2018 de Protección de Datos (LOPDGDD)", "temas_boja": [5]},
]


def descargar_texto(url: str) -> str:
    """Descarga la versión consolidada e imprimible del BOE y limpia el HTML."""
    consolidada = url.replace("act.php?id=", "act.php?p=&tn=1&id=")
    req = urllib.request.Request(consolidada, headers={"User-Agent": "Mozilla/5.0 opositalia-rag"})
    with urllib.request.urlopen(req, timeout=60) as r:  # noqa: S310 — URL fija del BOE
        html = r.read().decode("utf-8", errors="ignore")
    # texto plano: quita scripts/estilos y etiquetas
    html = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.DOTALL | re.IGNORECASE)
    texto = re.sub(r"<[^>]+>", "\n", html)
    texto = re.sub(r"&nbsp;", " ", texto)
    texto = re.sub(r"\n{3,}", "\n\n", texto)
    return texto.strip()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--yes", action="store_true")
    args = parser.parse_args()
    if not args.yes:
        if input(f"¿Ingestar {len(LEYES)} leyes del BOE? [y/N] ").strip().lower() != "y":
            sys.exit(0)

    log = pipeline.crear_logger("ingest_leyes")
    total, errores = 0, 0
    for ley in LEYES:
        try:
            documento_id = pipeline.ensure_documento(ley["titulo"], ley["url"], log)
            if pipeline.chunks_existentes(documento_id, None, log) > 0:
                console.print(f"[dim]{ley['titulo']} ya ingestada — skip[/dim]")
                continue
            texto = descargar_texto(ley["url"])
            if len(texto) < 500:
                raise RuntimeError("texto insuficiente (¿cambió el HTML del BOE?)")
            chunks = pipeline.chunk_semantico(texto)
            embeddings = pipeline.embed_batch(chunks, log)
            metadata = {
                "tipo": "ley_boe",
                "parte": "comun",
                "bloque_oir": BLOQUE,
                "temas_boja": ley["temas_boja"],
                "fuente": ley["url"],
            }
            total += pipeline.insertar_chunks(documento_id, chunks, embeddings, metadata, log)
            console.print(f"[green]{ley['titulo']}: {len(chunks)} chunks[/green]")
        except Exception as e:  # noqa: BLE001
            errores += 1
            log.error("%s falló: %s", ley["titulo"], e)
            console.print(f"[red]{ley['titulo']} falló: {e}[/red]")

    console.print(f"[green]Hecho[/green]: {total} chunks · {errores} errores")


if __name__ == "__main__":
    main()
