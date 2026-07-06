"""01 — Extrae la estructura de capítulos del Kanski → kanski_chapter_map.json.

El Kanski define los bloques del temario OIR: cada capítulo se mapea a un
bloque por keywords bilingües (config.KEYWORDS_BLOQUE). Sin llamadas a APIs.

Uso:  python 01_parse_kanski.py
"""

import json
import sys

import fitz
from rich.console import Console
from rich.table import Table

import config

console = Console()


def main() -> None:
    pdf_path = config.INPUT_DIR / config.KANSKI_FILE
    if not pdf_path.exists():
        console.print(f"[red]No existe: {pdf_path}[/red]")
        sys.exit(1)

    doc = fitz.open(pdf_path)
    toc = doc.get_toc()  # [(nivel, titulo, pagina_1indexed), ...]
    if not toc:
        console.print("[red]El PDF no tiene tabla de contenidos embebida.[/red]")
        console.print("Habría que extraer capítulos por heurística de texto — revisar manualmente.")
        sys.exit(1)

    # Capítulos = entradas de nivel 1 que parecen capítulos reales.
    # Se descartan portada/índice/prefacio por longitud de rango más abajo.
    nivel1 = [(t.strip(), p) for (lvl, t, p) in toc if lvl == 1]
    total_pages = doc.page_count

    capitulos = []
    numero = 0
    for i, (titulo, pagina) in enumerate(nivel1):
        if pagina < 1 or "booksmedicos" in titulo.lower():  # entradas basura del PDF
            continue
        fin = nivel1[i + 1][1] - 1 if i + 1 < len(nivel1) else total_pages
        if fin - pagina < 4:  # secciones de cortesía (prefacio, abreviaturas…)
            continue
        numero += 1
        subtemas = [
            t.strip()
            for (lvl, t, p) in toc
            if lvl == 2 and pagina <= p <= fin
        ][:15]
        capitulos.append(
            {
                "numero": numero,
                "titulo_original": titulo,
                # el PDF es la edición española: título original ya en ES.
                # Si fuera EN, la traducción del contenido la hace 02.
                "titulo_es": titulo,
                "bloque_oir": config.asignar_bloque(titulo),
                "paginas": [pagina, fin],
                "subtemas": subtemas,
            }
        )
    doc.close()

    salida = {"fuente": config.KANSKI_FILE, "paginas_totales": total_pages, "capitulos": capitulos}
    config.CHAPTER_MAP_FILE.write_text(
        json.dumps(salida, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    tabla = Table(title=f"Kanski: {len(capitulos)} capítulos")
    tabla.add_column("#", justify="right")
    tabla.add_column("Capítulo")
    tabla.add_column("Bloque OIR")
    tabla.add_column("Páginas", justify="right")
    for c in capitulos:
        tabla.add_row(
            str(c["numero"]), c["titulo_original"][:55], c["bloque_oir"],
            f"{c['paginas'][0]}-{c['paginas'][1]}",
        )
    console.print(tabla)

    sin_asignar = [c for c in capitulos if c["bloque_oir"] == config.BLOQUE_FALLBACK]
    if sin_asignar:
        console.print(
            f"[yellow]{len(sin_asignar)} capítulos en '{config.BLOQUE_FALLBACK}' — "
            f"revisar keywords en config.py si no procede.[/yellow]"
        )
    console.print(f"[green]Guardado en {config.CHAPTER_MAP_FILE}[/green]")


if __name__ == "__main__":
    main()
