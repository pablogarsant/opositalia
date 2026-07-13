// Tipos del schema de Supabase (v1.1) — mantenidos a mano hasta tener codegen.
// Solo se tipan tablas/funciones que la app usa (YAGNI).
// Nota: type aliases (no interfaces) — supabase-js exige index signature implícita.

export type Rol = "alumno" | "admin" | "tutor";

export type PerfilRow = {
  id: string;
  clerk_id: string;
  nombre: string | null;
  email: string | null;
  rol: Rol;
  avatar_url: string | null;
  tema: string;
  // columnas de la migración 0004: opcionales hasta que esté aplicada
  onboarding_completado?: boolean;
  curso_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type PerfilInsert = {
  clerk_id: string;
  nombre?: string | null;
  email?: string | null;
  rol?: Rol;
  avatar_url?: string | null;
  tema?: string;
  onboarding_completado?: boolean;
  curso_id?: string | null;
};

export type RachaRow = {
  id: string;
  perfil_id: string;
  racha_actual: number;
  racha_maxima: number;
  ultima_sesion: string | null;
  updated_at: string;
};

export type RachaInsert = {
  perfil_id: string;
  racha_actual?: number;
  racha_maxima?: number;
  ultima_sesion?: string | null;
};

export type TemaRow = {
  id: string;
  bloque_id: string | null;
  titulo: string;
  orden: number;
  horas_estimadas: number;
  dificultad: number;
  // columnas de la migración 0005 (opcionales hasta aplicarla)
  numero_boja?: number | null;
  texto_boja?: string | null;
  parte?: "comun" | "especifica" | null;
  capitulo_kanski?: string | null;
  paginas_kanski?: string | null;
};

export type SubtemaRow = {
  id: string;
  tema_id: string | null;
  titulo: string;
  orden: number;
  descripcion: string | null;
  created_at: string;
};

export type PuntoRow = {
  id: string;
  subtema_id: string | null;
  titulo: string;
  orden: number;
  descripcion: string | null;
  keywords: string[] | null;
  created_at: string;
};

export type ProgresoPuntoRow = {
  id: string;
  perfil_id: string;
  punto_id: string;
  dominio: number;
  ultima_sesion: string | null;
};

export type SesionEstudioInsert = {
  perfil_id: string;
  sesion_plan_id?: string | null;
  tema_id?: string | null;
  fase_actual?: number;
  completada?: boolean;
  duracion_seg?: number;
  completada_en?: string | null;
};

export type RespuestaExamenInsert = {
  sesion_id: string;
  pregunta_texto: string;
  opcion_elegida?: number | null;
  opcion_correcta: number;
  es_correcta: boolean;
  tiempo_seg?: number | null;
  bloque?: string | null;
};

export type ProgresoTemaInsert = {
  perfil_id: string;
  tema_id: string;
  bloque_id?: string | null;
  dominio?: number;
  sesiones_hechas?: number;
  ultima_sesion?: string | null;
};

export type SesionCacheRow = {
  id: string;
  cache_key: string;
  tema_id: string | null;
  bloque: string;
  tipo: string;
  contenido: Record<string, unknown>;
  created_at: string;
};

export type ChunkSearchResult = {
  id: string;
  contenido: string;
  metadata: Record<string, unknown>;
  similarity: number;
};

export type CursoRow = {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string | null;
  especialidad: string | null;
  comunidad: string;
  activo: boolean;
  created_at: string;
};

export type BloqueRow = {
  id: string;
  curso_id: string | null;
  titulo: string;
  orden: number;
  horas_estimadas: number;
};

export type InscripcionRow = {
  id: string;
  perfil_id: string;
  curso_id: string;
  fecha_inicio: string;
  fecha_examen: string | null;
  config_plan: Record<string, unknown>;
  activa: boolean;
  created_at: string;
};

export type InscripcionInsert = {
  perfil_id: string;
  curso_id: string;
  fecha_inicio: string;
  fecha_examen?: string | null;
  config_plan?: Record<string, unknown>;
  activa?: boolean;
};

export type SesionPlanRow = {
  id: string;
  inscripcion_id: string;
  tema_id: string | null;
  bloque_id: string | null;
  fecha_programada: string;
  tipo: "lectura" | "repaso" | "examen";
  estado: "pendiente" | "completada" | "perdida" | "saltada";
  es_refuerzo: boolean;
  es_recuperada: boolean;
  motivo_cambio: string | null;
  orden: number | null;
  created_at: string;
  updated_at: string;
};

export type SesionPlanInsert = {
  inscripcion_id: string;
  tema_id?: string | null;
  bloque_id?: string | null;
  fecha_programada: string;
  tipo: "lectura" | "repaso" | "examen";
  estado?: "pendiente" | "completada" | "perdida" | "saltada";
  es_refuerzo?: boolean;
  es_recuperada?: boolean;
  motivo_cambio?: string | null;
  orden?: number | null;
};

export type HistorialPlanRow = {
  id: string;
  inscripcion_id: string;
  tipo: "perdida" | "recuperada" | "refuerzo" | "resultado";
  motivo: string;
  detalle: string | null;
  sesion_origen: string | null;
  sesion_nueva: string | null;
  created_at: string;
};

export type HistorialPlanInsert = Omit<HistorialPlanRow, "id" | "created_at" | "detalle" | "sesion_origen" | "sesion_nueva"> & {
  detalle?: string | null;
  sesion_origen?: string | null;
  sesion_nueva?: string | null;
};

export type NotaRow = {
  id: string;
  perfil_id: string;
  contenido: string;
  created_at: string;
  updated_at: string;
};

export type FavoritoRow = {
  id: string;
  perfil_id: string;
  tipo: "flashcard" | "idea_clave" | "mnemotecnia" | "pregunta" | "texto";
  titulo: string | null;
  contenido: Record<string, unknown>;
  tema_id: string | null;
  bloque: string | null;
  created_at: string;
};

export type FavoritoInsert = Omit<FavoritoRow, "id" | "created_at" | "titulo" | "tema_id" | "bloque"> & {
  titulo?: string | null;
  tema_id?: string | null;
  bloque?: string | null;
};

export type BurocraciaCacheRow = {
  id: string;
  convocatoria: string;
  datos: Record<string, unknown>;
  fuente_url: string | null;
  fecha_publicacion: string | null;
  hash_contenido: string | null;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      perfiles: {
        Row: PerfilRow;
        Insert: PerfilInsert;
        Update: Partial<PerfilInsert>;
        Relationships: [];
      };
      rachas: {
        Row: RachaRow;
        Insert: RachaInsert;
        Update: Partial<RachaInsert>;
        Relationships: [];
      };
      temas: {
        Row: TemaRow;
        Insert: Omit<TemaRow, "id">;
        Update: Partial<Omit<TemaRow, "id">>;
        Relationships: [];
      };
      subtemas: {
        Row: SubtemaRow;
        Insert: Omit<SubtemaRow, "id" | "created_at"> & { descripcion?: string | null };
        Update: Partial<Omit<SubtemaRow, "id" | "created_at">>;
        Relationships: [];
      };
      puntos: {
        Row: PuntoRow;
        Insert: Omit<PuntoRow, "id" | "created_at"> & { descripcion?: string | null; keywords?: string[] | null };
        Update: Partial<Omit<PuntoRow, "id" | "created_at">>;
        Relationships: [];
      };
      progreso_puntos: {
        Row: ProgresoPuntoRow;
        Insert: Omit<ProgresoPuntoRow, "id"> & { dominio?: number; ultima_sesion?: string | null };
        Update: Partial<Omit<ProgresoPuntoRow, "id">>;
        Relationships: [];
      };
      sesiones_estudio: {
        Row: SesionEstudioInsert & { id: string; iniciada_en: string };
        Insert: SesionEstudioInsert;
        Update: Partial<SesionEstudioInsert>;
        Relationships: [];
      };
      respuestas_examen: {
        Row: RespuestaExamenInsert & { id: string; created_at: string };
        Insert: RespuestaExamenInsert;
        Update: Partial<RespuestaExamenInsert>;
        Relationships: [];
      };
      progreso_temas: {
        Row: ProgresoTemaInsert & { id: string; updated_at: string };
        Insert: ProgresoTemaInsert;
        Update: Partial<ProgresoTemaInsert>;
        Relationships: [];
      };
      sesion_cache: {
        Row: SesionCacheRow;
        Insert: Omit<SesionCacheRow, "id" | "created_at">;
        Update: Partial<Omit<SesionCacheRow, "id" | "created_at">>;
        Relationships: [];
      };
      cursos: {
        Row: CursoRow;
        Insert: Omit<CursoRow, "id" | "created_at">;
        Update: Partial<Omit<CursoRow, "id" | "created_at">>;
        Relationships: [];
      };
      bloques: {
        Row: BloqueRow;
        Insert: Omit<BloqueRow, "id">;
        Update: Partial<Omit<BloqueRow, "id">>;
        Relationships: [];
      };
      inscripciones: {
        Row: InscripcionRow;
        Insert: InscripcionInsert;
        Update: Partial<InscripcionInsert>;
        Relationships: [];
      };
      sesiones_plan: {
        Row: SesionPlanRow;
        Insert: SesionPlanInsert;
        Update: Partial<SesionPlanInsert>;
        Relationships: [];
      };
      historial_plan: {
        Row: HistorialPlanRow;
        Insert: HistorialPlanInsert;
        Update: Partial<HistorialPlanInsert>;
        Relationships: [];
      };
      notas: {
        Row: NotaRow;
        Insert: { perfil_id: string; contenido: string };
        Update: { contenido?: string; updated_at?: string };
        Relationships: [];
      };
      favoritos: {
        Row: FavoritoRow;
        Insert: FavoritoInsert;
        Update: Partial<FavoritoInsert>;
        Relationships: [];
      };
      burocracia_cache: {
        Row: BurocraciaCacheRow;
        Insert: Omit<BurocraciaCacheRow, "id" | "updated_at"> & { updated_at?: string };
        Update: Partial<Omit<BurocraciaCacheRow, "id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_chunks: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          filter_bloque?: string | null;
        };
        Returns: ChunkSearchResult[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
