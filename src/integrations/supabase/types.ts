export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      financial_transactions: {
        Row: {
          categoria: string
          created_at: string
          data_pagamento: string | null
          data_vencimento: string | null
          descricao: string | null
          id: string
          metodo_pagto: string | null
          organization_id: string
          reservation_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          tipo: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          id?: string
          metodo_pagto?: string | null
          organization_id: string
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          tipo: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          valor: number
        }
        Update: {
          categoria?: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          id?: string
          metodo_pagto?: string | null
          organization_id?: string
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          tipo?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          id: string
          organization_id: string
          room_id: string | null
          room_number: string
          room_type: string
          guest_name: string
          guest_email: string | null
          guest_phone: string | null
          guest_document: string | null
          checkin_date: string
          checkout_date: string
          actual_checkin: string | null
          actual_checkout: string | null
          status: Database["public"]["Enums"]["reservation_status"]
          daily_rate: number
          total_stay: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          room_id?: string | null
          room_number: string
          room_type: string
          guest_name: string
          guest_email?: string | null
          guest_phone?: string | null
          guest_document?: string | null
          checkin_date: string
          checkout_date: string
          actual_checkin?: string | null
          actual_checkout?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          daily_rate: number
          total_stay?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          room_id?: string | null
          room_number?: string
          room_type?: string
          guest_name?: string
          guest_email?: string | null
          guest_phone?: string | null
          guest_document?: string | null
          checkin_date?: string
          checkout_date?: string
          actual_checkin?: string | null
          actual_checkout?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          daily_rate?: number
          total_stay?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "tables_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          categoria: string | null
          created_at: string
          estoque_minimo: number | null
          id: string
          nome: string
          organization_id: string
          preco_unitario: number | null
          quantidade: number
          unidade: string
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          estoque_minimo?: number | null
          id?: string
          nome: string
          organization_id: string
          preco_unitario?: number | null
          quantidade?: number
          unidade?: string
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          created_at?: string
          estoque_minimo?: number | null
          id?: string
          nome?: string
          organization_id?: string
          preco_unitario?: number | null
          quantidade?: number
          unidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          ativo: boolean | null
          created_at: string
          id: string
          nome: string
          plano: string | null
          tipo: Database["public"]["Enums"]["organization_type"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          id?: string
          nome: string
          plano?: string | null
          tipo?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          id?: string
          nome?: string
          plano?: string | null
          tipo?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          nome: string | null
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          nome?: string | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tables_rooms: {
        Row: {
          andar: number | null
          capacidade: number | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          organization_id: string
          preco_base: number | null
          status: Database["public"]["Enums"]["table_room_status"]
          tipo: string
          updated_at: string
        }
        Insert: {
          andar?: number | null
          capacidade?: number | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          organization_id: string
          preco_base?: number | null
          status?: Database["public"]["Enums"]["table_room_status"]
          tipo?: string
          updated_at?: string
        }
        Update: {
          andar?: number | null
          capacidade?: number | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          organization_id?: string
          preco_base?: number | null
          status?: Database["public"]["Enums"]["table_room_status"]
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_rooms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_user: {
        Args: {
          p_email: string
          p_password: string
          p_nome: string
          p_role?: Database["public"]["Enums"]["app_role"]
        }
        Returns: {
          success: boolean
          user_id?: string
          email?: string
          nome?: string
          role?: string
          organization_id?: string
          error?: string
        }
      }
      get_my_organization_id: { Args: Record<string, never>; Returns: string }
      get_user_organization_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      promote_to_super_admin: {
        Args: { target_user_id: string }
        Returns: {
          success: boolean
          message?: string
          error?: string
          code?: string
          user_id?: string
        }
      }
      check_system_initialized: {
        Args: Record<string, never>
        Returns: {
          initialized: boolean
          super_admin_count: number
        }
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "staff"
      organization_type: "restaurante" | "pousada"
      reservation_status: "reservado" | "checkin" | "checkout" | "cancelado"
      table_room_status: "livre" | "ocupado" | "sujo" | "reservado"
      transaction_status: "pendente" | "pago" | "cancelado" | "atrasado"
      transaction_type: "receita" | "despesa"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "staff"],
      organization_type: ["restaurante", "pousada"],
      reservation_status: ["reservado", "checkin", "checkout", "cancelado"],
      table_room_status: ["livre", "ocupado", "sujo", "reservado"],
      transaction_status: ["pendente", "pago", "cancelado", "atrasado"],
      transaction_type: ["receita", "despesa"],
    },
  },
} as const
