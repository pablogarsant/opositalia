/**
 * Seed del temario OIR desde scripts/rag/kanski_chapter_map.json.
 * Idempotente: cursos/bloques/temas se buscan antes de insertar y los
 * updates de chunks_rag son naturalmente re-ejecutables.
 *
 * Uso:  npx tsx scripts/seed_temario.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

// carga mínima de .env.local (sin depender de dotenv)
function cargarEnvLocal(): void {
  const ruta = join(process.cwd(), ".env.local");
  for (const linea of readFileSync(ruta, "utf-8").split("\n")) {
    const m = linea.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

interface Capitulo {
  numero: number;
  titulo_original: string;
  titulo_es: string;
  bloque_oir: string;
  paginas: [number, number];
  subtemas: string[];
}

async function main(): Promise<void> {
  cargarEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan claves de Supabase en .env.local");
  const sb = createClient(url, key);

  const mapa = JSON.parse(
    readFileSync(join(process.cwd(), "scripts/rag/kanski_chapter_map.json"), "utf-8")
  ) as { capitulos: Capitulo[] };

  // 1. curso
  const SLUG = "oir-sas-2026";
  let cursoId: string;
  const cursoSel = await sb.from("cursos").select("id").eq("slug", SLUG).maybeSingle();
  if (cursoSel.data) {
    cursoId = cursoSel.data.id;
    console.log(`curso ya existe: ${cursoId}`);
  } else {
    const ins = await sb
      .from("cursos")
      .insert({
        slug: SLUG,
        titulo: "Oposición Oftalmólogo SAS",
        descripcion: "Preparación completa OIR 2026 — Servicio Andaluz de Salud",
        especialidad: "Oftalmología",
        comunidad: "andalucia",
      })
      .select("id")
      .single();
    if (ins.error) throw new Error(`curso: ${ins.error.message}`);
    cursoId = ins.data.id;
    console.log(`curso creado: ${cursoId}`);
  }

  // 2. bloques (en orden de aparición en el Kanski)
  const bloquesOrden: string[] = [];
  for (const cap of mapa.capitulos) {
    if (!bloquesOrden.includes(cap.bloque_oir)) bloquesOrden.push(cap.bloque_oir);
  }
  const bloqueIds = new Map<string, string>();
  for (const [i, titulo] of bloquesOrden.entries()) {
    const sel = await sb
      .from("bloques")
      .select("id")
      .eq("curso_id", cursoId)
      .eq("titulo", titulo)
      .maybeSingle();
    if (sel.data) {
      bloqueIds.set(titulo, sel.data.id);
      continue;
    }
    const ins = await sb
      .from("bloques")
      .insert({ curso_id: cursoId, titulo, orden: i + 1 })
      .select("id")
      .single();
    if (ins.error) throw new Error(`bloque ${titulo}: ${ins.error.message}`);
    bloqueIds.set(titulo, ins.data.id);
    console.log(`bloque creado: ${titulo}`);
  }

  // 3. temas = capítulos del Kanski (título limpio sin "Capítulo N - ")
  const temaIds = new Map<number, string>();
  for (const cap of mapa.capitulos) {
    const titulo = cap.titulo_es.replace(/^Cap[ií]tulo\s+\d+\s*[-–]\s*/i, "").trim();
    const bloqueId = bloqueIds.get(cap.bloque_oir);
    if (!bloqueId) continue;
    const sel = await sb
      .from("temas")
      .select("id")
      .eq("bloque_id", bloqueId)
      .eq("titulo", titulo)
      .maybeSingle();
    if (sel.data) {
      temaIds.set(cap.numero, sel.data.id);
      continue;
    }
    const horas = Math.max(1, Math.round((cap.paginas[1] - cap.paginas[0]) / 25));
    const ins = await sb
      .from("temas")
      .insert({ bloque_id: bloqueId, titulo, orden: cap.numero, horas_estimadas: horas })
      .select("id")
      .single();
    if (ins.error) throw new Error(`tema ${titulo}: ${ins.error.message}`);
    temaIds.set(cap.numero, ins.data.id);
    console.log(`tema creado: ${cap.numero}. ${titulo}`);
  }

  // 4. chunks_rag: bloque_id por metadata->>bloque_oir
  let chunksBloques = 0;
  for (const [titulo, bloqueId] of bloqueIds) {
    const upd = await sb
      .from("chunks_rag")
      .update({ bloque_id: bloqueId })
      .eq("metadata->>bloque_oir", titulo)
      .is("bloque_id", null)
      .select("id");
    chunksBloques += upd.data?.length ?? 0;
  }
  console.log(`chunks con bloque_id asignado: ${chunksBloques}`);

  // 5. chunks_rag del Kanski: tema_id por metadata->>capitulo
  let chunksTemas = 0;
  for (const [numero, temaId] of temaIds) {
    const upd = await sb
      .from("chunks_rag")
      .update({ tema_id: temaId })
      .eq("metadata->>capitulo", String(numero))
      .is("tema_id", null)
      .select("id");
    chunksTemas += upd.data?.length ?? 0;
  }
  console.log(`chunks con tema_id asignado: ${chunksTemas}`);

  console.log(
    `OK — curso 1 · bloques ${bloqueIds.size} · temas ${temaIds.size} · chunks actualizados ${chunksBloques}/${chunksTemas}`
  );
}

main().catch((e) => {
  console.error("SEED FALLÓ:", e.message ?? e);
  process.exit(1);
});
