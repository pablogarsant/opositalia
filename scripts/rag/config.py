"""Configuración centralizada del pipeline RAG de Opositalia."""

import os
from pathlib import Path

from dotenv import load_dotenv

# .env local a scripts/rag/ (no va al repo)
load_dotenv(Path(__file__).parent / ".env")

# ── Rutas ──────────────────────────────────────────────
INPUT_DIR = Path(os.getenv("INPUT_DIR", r"C:/Users/user/OneDrive/Documentos/libros oftalmo"))
KANSKI_FILE = "Kanski Oftalmologia Clinica 8a Edicion_booksmedicos.org.pdf"
SCRIPTS_DIR = Path(__file__).parent
CHAPTER_MAP_FILE = SCRIPTS_DIR / "kanski_chapter_map.json"
LOGS_DIR = SCRIPTS_DIR / "logs"

# ── Chunking ───────────────────────────────────────────
CHUNK_SIZE = 800        # tokens por chunk (tokenizer cl100k, el de text-embedding-3-small)
CHUNK_OVERLAP = 100     # tokens de solapamiento entre chunks
BATCH_SIZE = 10         # chunks por batch de embeddings (~8k tokens/batch)
# ritmo mínimo entre batches: 8k tokens cada 13s ≈ 37k TPM < límite 40k TPM
EMBED_MIN_INTERVALO = 13.0

# ── Modelos ────────────────────────────────────────────
MODEL_TRADUCCION = "claude-haiku-4-5"       # barato para traducción masiva
MODEL_EMBEDDING = "text-embedding-3-small"  # 1536 dims (schema vector(1536))

# Precios reales por millón de tokens (jul 2026) para estimación de coste.
# Ojo: haiku-4-5 es $1/$5, no $0.25 (eso era Haiku 3). Batches API = 50%.
PRECIO_HAIKU_IN = 1.00
PRECIO_HAIKU_OUT = 5.00
PRECIO_EMBEDDING = 0.02

# ── Supabase ───────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

# ── Temario OIR: bloques temáticos ─────────────────────
# El Kanski define la estructura; estos son los bloques destino.
BLOQUES_OIR = [
    "Órbita y párpados",
    "Aparato lagrimal y superficie ocular",
    "Conjuntiva",
    "Córnea",
    "Refracción y cirugía refractiva",
    "Esclera y epiesclera",
    "Cristalino",
    "Glaucoma",
    "Úvea",
    "Tumores oculares",
    "Retina",
    "Neuro-oftalmología",
    "Estrabismo y oftalmología pediátrica",
    "Traumatología ocular",
    "Farmacología ocular",
    "Miscelánea",
]

# Keywords (sin acentos, lowercase) → bloque. Bilingüe EN/ES porque los
# libros mezclan idiomas. Se evalúan en orden: primera coincidencia gana.
KEYWORDS_BLOQUE = [
    (("eyelid", "parpado", "blefar", "ptosis"), "Órbita y párpados"),
    (("orbit", "orbita"), "Órbita y párpados"),
    (("lacrimal", "lagrimal", "dry eye", "ojo seco", "tear"), "Aparato lagrimal y superficie ocular"),
    (("conjunctiv", "conjuntiv"), "Conjuntiva"),
    (("cornea", "querat", "kerat"), "Córnea"),
    (("refract", "lasik", "miopia", "myopia"), "Refracción y cirugía refractiva"),
    (("sclera", "escler", "episcler"), "Esclera y epiesclera"),
    (("lens", "cristalino", "catarat", "cataract", "phaco", "faco"), "Cristalino"),
    (("glaucoma", "tonometr", "presion intraocular"), "Glaucoma"),
    (("uvea", "uveit", "iris ", "iridociclitis"), "Úvea"),
    (("tumor", "tumour", "oncolog", "melanoma", "retinoblastoma"), "Tumores oculares"),
    (("retin", "macul", "vitre", "desprendimiento", "detachment", "fundus", "fondo de ojo", "distrofia", "diabetic", "vasculopat"), "Retina"),
    (("neuro", "optic nerve", "nervio optico", "pupila", "pupil", "campo visual", "visual field"), "Neuro-oftalmología"),
    (("strabismus", "estrabismo", "pediatric", "pediatr", "ambliop", "amblyop", "squint"), "Estrabismo y oftalmología pediátrica"),
    (("trauma", "injur", "quemadura", "burn"), "Traumatología ocular"),
    (("pharmacolog", "farmacolog", "drug", "farmaco", "medication", "efectos secundarios", "medicam"), "Farmacología ocular"),
]

BLOQUE_FALLBACK = "Miscelánea"


def asignar_bloque(titulo: str) -> str:
    """Asigna bloque OIR por keywords del título (capítulo o libro)."""
    t = _sin_acentos(titulo.lower())
    for keywords, bloque in KEYWORDS_BLOQUE:
        if any(k in t for k in keywords):
            return bloque
    return BLOQUE_FALLBACK


def _sin_acentos(texto: str) -> str:
    import unicodedata

    return "".join(
        c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn"
    )
