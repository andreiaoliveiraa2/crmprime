export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clientes: {
        Row: {
          contato: string | null
          criado_em: string
          data: string | null
          etapa: string
          id: string
          nome: string
        }
        Insert: {
          contato?: string | null
          criado_em?: string
          data?: string | null
          etapa: string
          id?: string
          nome: string
        }
        Update: {
          contato?: string | null
          criado_em?: string
          data?: string | null
          etapa?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
