/**
 * Seed del temario oficial BOJA (107 temas, 4 niveles) sobre el curso OIR SAS.
 * Reestructura el temario anterior (20 temas Kanski, 13 bloques) a 2 bloques
 * (Parte Común / Parte Específica) con 107 temas → subtemas → puntos.
 *
 * Idempotente: re-ejecutar deja el mismo estado final (los ids cambian, pero
 * nada persistente depende de ellos: el RAG filtra por metadata y los planes
 * se regeneran en el onboarding).
 *
 * Requiere la migración 0005 aplicada (subtemas, puntos, columnas de temas).
 * Uso:  npx tsx scripts/seed_temario_oficial.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { TEMAS_COMUNES, TEMAS_ESPECIFICOS, TODOS_LOS_TEMAS, type TemaBoja } from "./temario_boja";

function cargarEnvLocal(): void {
  const ruta = join(process.cwd(), ".env.local");
  for (const linea of readFileSync(ruta, "utf-8").split("\n")) {
    const m = linea.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const SLUG = "oir-sas-2026";
const BLOQUE_COMUN = "Parte Común — Legislación y Gestión Sanitaria";
const BLOQUE_ESPECIFICA = "Parte Específica — Oftalmología";

async function main(): Promise<void> {
  cargarEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan claves de Supabase en .env.local");
  const sb = createClient(url, key);

  // pre-check: ¿existe la tabla puntos? (migración 0005)
  const check = await sb.from("puntos").select("id").limit(1);
  if (check.error) {
    throw new Error(
      `La tabla 'puntos' no existe: aplica supabase/migrations/0005_temario_arbol.sql en el SQL Editor.\n(${check.error.message})`
    );
  }

  // 1. curso
  let cursoId: string;
  const cursoSel = await sb.from("cursos").select("id").eq("slug", SLUG).maybeSingle();
  if (cursoSel.data) {
    cursoId = cursoSel.data.id;
  } else {
    const ins = await sb
      .from("cursos")
      .insert({
        slug: SLUG,
        titulo: "FEA Oftalmología — SAS Andalucía",
        descripcion: "Preparación completa OIR — temario oficial BOJA (107 temas)",
        especialidad: "Oftalmología",
        comunidad: "andalucia",
      })
      .select("id")
      .single();
    if (ins.error) throw new Error(`curso: ${ins.error.message}`);
    cursoId = ins.data.id;
  }
  console.log(`curso: ${cursoId}`);

  // 2. limpiar temario anterior. Los temas viejos están referenciados con
  //    RESTRICT desde chunks_rag/sesion_cache/favoritos/sesiones_plan: se
  //    nulan esas FK antes de borrar (progreso_* y subtemas/puntos cascadean).
  const bloquesViejos = await sb.from("bloques").select("id").eq("curso_id", cursoId);
  const bloqueIds = (bloquesViejos.data ?? []).map((b) => b.id);
  if (bloqueIds.length) {
    const temasViejos = await sb.from("temas").select("id").in("bloque_id", bloqueIds);
    const temaIds = (temasViejos.data ?? []).map((t) => t.id);
    if (temaIds.length) {
      for (const tabla of ["chunks_rag", "sesion_cache", "favoritos", "sesiones_plan"]) {
        await sb.from(tabla).update({ tema_id: null }).in("tema_id", temaIds);
      }
    }
    for (const tabla of ["chunks_rag", "sesiones_plan"]) {
      await sb.from(tabla).update({ bloque_id: null }).in("bloque_id", bloqueIds);
    }
    // borrar bloques cascadea a temas → subtemas/puntos/progreso_temas
    const del = await sb.from("bloques").delete().in("id", bloqueIds);
    if (del.error) throw new Error(`limpieza bloques: ${del.error.message}`);
    console.log(`limpiados ${bloqueIds.length} bloques y ${temaIds.length} temas anteriores`);
  }

  // 3. dos bloques nuevos
  const insBloques = await sb
    .from("bloques")
    .insert([
      { curso_id: cursoId, titulo: BLOQUE_COMUN, orden: 1 },
      { curso_id: cursoId, titulo: BLOQUE_ESPECIFICA, orden: 2 },
    ])
    .select("id, titulo");
  if (insBloques.error) throw new Error(`bloques: ${insBloques.error.message}`);
  const bloqueComunId = insBloques.data.find((b) => b.titulo === BLOQUE_COMUN)!.id;
  const bloqueEspecificaId = insBloques.data.find((b) => b.titulo === BLOQUE_ESPECIFICA)!.id;

  // 4. temas (107) — horas: común 2h, específica según nº de puntos
  const filasTema = TODOS_LOS_TEMAS.map((t) => ({
    bloque_id: t.parte === "comun" ? bloqueComunId : bloqueEspecificaId,
    titulo: `Tema ${t.numero} — ${t.titulo}`,
    orden: t.numero,
    horas_estimadas: horasTema(t),
    numero_boja: t.numero,
    texto_boja: t.titulo,
    parte: t.parte,
    capitulo_kanski: t.capitulo_kanski,
  }));
  const temaIdPorNumero = new Map<number, string>();
  for (let i = 0; i < filasTema.length; i += 50) {
    const lote = filasTema.slice(i, i + 50);
    const ins = await sb.from("temas").insert(lote).select("id, numero_boja");
    if (ins.error) throw new Error(`temas: ${ins.error.message}`);
    for (const row of ins.data) temaIdPorNumero.set(row.numero_boja as number, row.id);
  }
  console.log(`temas insertados: ${temaIdPorNumero.size}`);

  // 5. subtemas + puntos
  let totalSubtemas = 0;
  let totalPuntos = 0;
  for (const tema of TODOS_LOS_TEMAS) {
    const temaId = temaIdPorNumero.get(tema.numero)!;
    const filasSub = tema.subtemas.map((s, i) => ({ tema_id: temaId, titulo: s.titulo, orden: i + 1 }));
    const insSub = await sb.from("subtemas").insert(filasSub).select("id, orden");
    if (insSub.error) throw new Error(`subtemas T${tema.numero}: ${insSub.error.message}`);
    totalSubtemas += insSub.data.length;

    const subIdPorOrden = new Map<number, string>();
    for (const row of insSub.data) subIdPorOrden.set(row.orden as number, row.id);

    const filasPunto = tema.subtemas.flatMap((s, i) =>
      s.puntos.map((p, j) => ({
        subtema_id: subIdPorOrden.get(i + 1)!,
        titulo: p,
        orden: j + 1,
        keywords: keywordsDe(p),
      }))
    );
    for (let i = 0; i < filasPunto.length; i += 100) {
      const lote = filasPunto.slice(i, i + 100);
      const insP = await sb.from("puntos").insert(lote);
      if (insP.error) throw new Error(`puntos T${tema.numero}: ${insP.error.message}`);
      totalPuntos += lote.length;
    }
  }

  console.log(
    `OK — 2 bloques · ${TODOS_LOS_TEMAS.length} temas (${TEMAS_COMUNES.length} común + ${TEMAS_ESPECIFICOS.length} específica) · ${totalSubtemas} subtemas · ${totalPuntos} puntos`
  );
}

/** Horas estimadas por tema (para el peso del plan). */
function horasTema(t: TemaBoja): number {
  if (t.parte === "comun") return 2;
  const numPuntos = t.subtemas.reduce((a, s) => a + s.puntos.length, 0);
  if (numPuntos <= 5) return 3;
  if (numPuntos <= 10) return 5;
  return 7;
}

/** Keywords de búsqueda RAG: palabras significativas del título del punto. */
function keywordsDe(titulo: string): string[] {
  return titulo
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .split(/[\s,:/—-]+/)
    .filter((w) => w.length > 3)
    .slice(0, 6);
}

main().catch((e) => {
  console.error("SEED FALLÓ:", e.message ?? e);
  process.exit(1);
});
