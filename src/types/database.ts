// Tipos del schema de Supabase (v1.1) — mantenidos a mano hasta tener proyecto
// Supabase real (entonces: `supabase gen types typescript`).
// Solo se tipan las tablas que la app usa; el resto se añade cuando se use (YAGNI).
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
