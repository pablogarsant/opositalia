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
