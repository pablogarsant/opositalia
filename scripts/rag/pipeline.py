"""Funciones compartidas del pipeline RAG (usadas por 02, 03, 04 y search)."""

import logging
import time
from datetime import datetime
from pathlib import Path

import fitz  # pymupdf
import tiktoken
from anthropic import Anthropic
from langdetect import detect, LangDetectException
from openai import OpenAI
from supabase import Client, create_client

import config

# tokenizer de text-embedding-3-small: correcto para dimensionar chunks de
# embedding. Para presupuestar la traducción con Claude es una aproximación.
_enc = tiktoken.get_encoding("cl100k_base")

_anthropic = None
_openai = None
_supabase: Client | None = None


def cliente_anthropic() -> Anthropic:
    global _anthropic
    if _anthropic is None:
        _anthropic = Anthropic(max_retries=4)  # ANTHROPIC_API_KEY del entorno
    return _anthropic


def cliente_openai() -> OpenAI:
    global _openai
    if _openai is None:
        _openai = OpenAI(max_retries=4)  # OPENAI_API_KEY del entorno
    return _openai


def cliente_supabase() -> Client:
    global _supabase
    if _supabase is None:
        if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_KEY:
            raise RuntimeError("Faltan SUPABASE_URL / SUPABASE_SERVICE_KEY en scripts/rag/.env")
        _supabase = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)
    return _supabase


def con_reintentos(fn, intentos: int = 3, base: float = 2.0, log: logging.Logger | None = None):
    """Reintento con backoff exponencial para llamadas de red (Supabase).

    Los SDKs de Anthropic/OpenAI ya reintentan 429/5xx por su cuenta.
    """
    for i in range(intentos):
        try:
            return fn()
        except Exception as e:  # noqa: BLE001 — reintenta cualquier fallo de red
            if i == intentos - 1:
                raise
            espera = base * (2**i)
            if log:
                log.warning("Fallo (%s), reintento %d/%d en %.0fs", e, i + 1, intentos, espera)
            time.sleep(espera)


def crear_logger(nombre: str) -> logging.Logger:
    """Logger a archivo scripts/rag/logs/{nombre}_{timestamp}.log + consola."""
    config.LOGS_DIR.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    log = logging.getLogger(nombre)
    log.setLevel(logging.INFO)
    fh = logging.FileHandler(config.LOGS_DIR / f"{nombre}_{ts}.log", encoding="utf-8")
    fh.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    log.addHandler(fh)
    return log


# ── Extracción ─────────────────────────────────────────

def extraer_texto(pdf_path: Path, pagina_ini: int = 0, pagina_fin: int | None = None) -> str:
    """Extrae texto plano de un rango de páginas [ini, fin) 0-indexed."""
    doc = fitz.open(pdf_path)
    fin = min(pagina_fin if pagina_fin is not None else doc.page_count, doc.page_count)
    partes = [doc[i].get_text() for i in range(pagina_ini, fin)]
    doc.close()
    return "\n".join(partes)


def detectar_idioma(texto: str) -> str:
    """'es', 'en'… sobre una muestra; 'unknown' si no hay texto útil."""
    muestra = " ".join(texto.split())[:3000]
    if len(muestra) < 50:
        return "unknown"
    try:
        return detect(muestra)
    except LangDetectException:
        return "unknown"


# ── Traducción ─────────────────────────────────────────

_SYSTEM_TRADUCCION = (
    "Eres traductor médico especializado en oftalmología. Traduce el texto al "
    "español de España manteniendo la terminología médica estándar (conserva "
    "siglas y epónimos tal cual). Devuelve SOLO la traducción, sin comentarios."
)


def traducir(texto: str, log: logging.Logger) -> str:
    """Traduce texto EN→ES con Claude Haiku, por trozos que respetan párrafos."""
    client = cliente_anthropic()
    trozos = _partir_por_parrafos(texto, max_tokens=2000)
    traducidos = []
    for trozo in trozos:
        resp = client.messages.create(
            model=config.MODEL_TRADUCCION,
            max_tokens=4096,
            system=_SYSTEM_TRADUCCION,
            messages=[{"role": "user", "content": trozo}],
        )
        traducidos.append(resp.content[0].text)
    log.info("Traducidos %d trozos (%d chars)", len(trozos), len(texto))
    return "\n\n".join(traducidos)


def _partir_por_parrafos(texto: str, max_tokens: int) -> list[str]:
    """Agrupa párrafos hasta max_tokens sin cortar ninguno por dentro."""
    parrafos = [p for p in texto.split("\n\n") if p.strip()]
    trozos, actual, actual_toks = [], [], 0
    for p in parrafos:
        toks = len(_enc.encode(p))
        if actual and actual_toks + toks > max_tokens:
            trozos.append("\n\n".join(actual))
            actual, actual_toks = [], 0
        # párrafo gigante: se parte por frases
        if toks > max_tokens:
            for frase_grupo in _partir_por_frases(p, max_tokens):
                trozos.append(frase_grupo)
            continue
        actual.append(p)
        actual_toks += toks
    if actual:
        trozos.append("\n\n".join(actual))
    return trozos


def _partir_por_frases(texto: str, max_tokens: int) -> list[str]:
    frases = texto.replace("\n", " ").split(". ")
    grupos, actual, actual_toks = [], [], 0
    for f in frases:
        toks = len(_enc.encode(f))
        if actual and actual_toks + toks > max_tokens:
            grupos.append(". ".join(actual) + ".")
            actual, actual_toks = [], 0
        actual.append(f)
        actual_toks += toks
    if actual:
        grupos.append(". ".join(actual))
    return grupos


# ── Chunking semántico ─────────────────────────────────

def chunk_semantico(texto: str, size: int = config.CHUNK_SIZE, overlap: int = config.CHUNK_OVERLAP) -> list[str]:
    """Chunks de ~size tokens respetando párrafos, con solapamiento de ~overlap.

    El solapamiento se toma de los últimos párrafos del chunk anterior.
    """
    parrafos = [p for p in texto.split("\n\n") if p.strip()]
    chunks: list[str] = []
    actual: list[str] = []
    actual_toks = 0

    for p in parrafos:
        toks = len(_enc.encode(p))
        if toks > size:  # párrafo más grande que un chunk: partir por frases
            for grupo in _partir_por_frases(p, size):
                parrafos_insertar = [grupo]
                for g in parrafos_insertar:
                    if actual and actual_toks + len(_enc.encode(g)) > size:
                        chunks.append("\n\n".join(actual))
                        actual, actual_toks = _cola_overlap(actual, overlap)
                    actual.append(g)
                    actual_toks += len(_enc.encode(g))
            continue
        if actual and actual_toks + toks > size:
            chunks.append("\n\n".join(actual))
            actual, actual_toks = _cola_overlap(actual, overlap)
        actual.append(p)
        actual_toks += toks

    if actual:
        chunks.append("\n\n".join(actual))
    # descarta restos triviales (índices, pies de página sueltos)
    return [c for c in chunks if len(_enc.encode(c)) >= 40]


def _cola_overlap(parrafos: list[str], overlap: int) -> tuple[list[str], int]:
    """Últimos párrafos que suman ~overlap tokens, para arrancar el siguiente chunk."""
    cola: list[str] = []
    toks = 0
    for p in reversed(parrafos):
        t = len(_enc.encode(p))
        if toks + t > overlap and cola:
            break
        cola.insert(0, p)
        toks += t
    return cola, toks


def contar_tokens(texto: str) -> int:
    return len(_enc.encode(texto))


# ── Embeddings ─────────────────────────────────────────

def embed_batch(textos: list[str]) -> list[list[float]]:
    """Embeddings en lotes de BATCH_SIZE con text-embedding-3-small."""
    client = cliente_openai()
    vectores: list[list[float]] = []
    for i in range(0, len(textos), config.BATCH_SIZE):
        lote = textos[i : i + config.BATCH_SIZE]
        resp = client.embeddings.create(model=config.MODEL_EMBEDDING, input=lote)
        vectores.extend(d.embedding for d in resp.data)
    return vectores


# ── Supabase: documentos y chunks ──────────────────────

def ensure_documento(titulo: str, fuente: str, log: logging.Logger) -> str:
    """Devuelve el id del documento, creándolo si no existe (idempotente)."""
    sb = cliente_supabase()
    existente = con_reintentos(
        lambda: sb.table("documentos").select("id").eq("titulo", titulo).limit(1).execute(),
        log=log,
    )
    if existente.data:
        return existente.data[0]["id"]
    creado = con_reintentos(
        lambda: sb.table("documentos").insert({"titulo": titulo, "tipo": "libro", "fuente": fuente}).execute(),
        log=log,
    )
    return creado.data[0]["id"]


def chunks_existentes(documento_id: str, capitulo: int | None, log: logging.Logger) -> int:
    """Cuenta chunks ya insertados para un documento (+capítulo si aplica)."""
    sb = cliente_supabase()
    q = sb.table("chunks_rag").select("id", count="exact").eq("documento_id", documento_id)
    if capitulo is not None:
        q = q.eq("metadata->>capitulo", str(capitulo))
    res = con_reintentos(lambda: q.limit(1).execute(), log=log)
    return res.count or 0


def insertar_chunks(
    documento_id: str,
    chunks: list[str],
    embeddings: list[list[float]],
    metadata_base: dict,
    log: logging.Logger,
) -> int:
    """Inserta chunks+embeddings en lotes. Devuelve nº insertados."""
    sb = cliente_supabase()
    filas = [
        {
            "documento_id": documento_id,
            "contenido": chunk,
            "embedding": emb,
            "metadata": {**metadata_base, "chunk_index": i},
        }
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings))
    ]
    for i in range(0, len(filas), 50):
        lote = filas[i : i + 50]
        con_reintentos(lambda l=lote: sb.table("chunks_rag").insert(l).execute(), log=log)
    return len(filas)
