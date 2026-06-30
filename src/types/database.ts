// Tipos generados de Supabase — reemplazar con `supabase gen types typescript` tras configurar el proyecto
export type Database = {
  public: {
    Tables: {
      perfiles: {
        Row: {
          id: string;
          clerk_id: string;
          nombre: string | null;
          email: string | null;
          rol: "alumno" | "admin" | "tutor";
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["perfiles"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["perfiles"]["Insert"]>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};
