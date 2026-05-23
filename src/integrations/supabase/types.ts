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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          notes: string | null
          scheduled_at: string
          service: string | null
          type: Database["public"]["Enums"]["appointment_type"]
          vehicle_id: string | null
          workshop_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_at: string
          service?: string | null
          type?: Database["public"]["Enums"]["appointment_type"]
          vehicle_id?: string | null
          workshop_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_at?: string
          service?: string | null
          type?: Database["public"]["Enums"]["appointment_type"]
          vehicle_id?: string | null
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_jobs: {
        Row: {
          attempts: number
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["automation_kind"]
          last_error: string | null
          max_attempts: number
          msg_id: number | null
          payload: Json
          processed_at: string | null
          scheduled_for: string
          status: Database["public"]["Enums"]["automation_status"]
          updated_at: string
          workshop_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["automation_kind"]
          last_error?: string | null
          max_attempts?: number
          msg_id?: number | null
          payload?: Json
          processed_at?: string | null
          scheduled_for?: string
          status?: Database["public"]["Enums"]["automation_status"]
          updated_at?: string
          workshop_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["automation_kind"]
          last_error?: string | null
          max_attempts?: number
          msg_id?: number | null
          payload?: Json
          processed_at?: string | null
          scheduled_for?: string
          status?: Database["public"]["Enums"]["automation_status"]
          updated_at?: string
          workshop_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          document: string | null
          email: string | null
          id: string
          last_service_at: string | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          workshop_id: string
        }
        Insert: {
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          last_service_at?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          workshop_id: string
        }
        Update: {
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          last_service_at?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          brand: string | null
          category: string | null
          cost_price: number
          created_at: string | null
          current_stock: number
          id: string
          location: string | null
          min_stock: number
          name: string
          sale_price: number
          sku: string | null
          supplier_name: string | null
          updated_at: string | null
          workshop_id: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          cost_price?: number
          created_at?: string | null
          current_stock?: number
          id?: string
          location?: string | null
          min_stock?: number
          name: string
          sale_price?: number
          sku?: string | null
          supplier_name?: string | null
          updated_at?: string | null
          workshop_id: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          cost_price?: number
          created_at?: string | null
          current_stock?: number
          id?: string
          location?: string | null
          min_stock?: number
          name?: string
          sale_price?: number
          sku?: string | null
          supplier_name?: string | null
          updated_at?: string | null
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string | null
          id: string
          inventory_id: string
          notes: string | null
          order_id: string | null
          quantity: number
          type: string
          workshop_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_id: string
          notes?: string | null
          order_id?: string | null
          quantity: number
          type: string
          workshop_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_id?: string
          notes?: string | null
          order_id?: string | null
          quantity?: number
          type?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          entry_date: string
          expected_delivery: string | null
          id: string
          number: number
          paid: boolean
          paid_at: string | null
          parts_used: string | null
          reported_problem: string | null
          service_done: string | null
                    payment_method: string | null
          payment_condition: string | null
          warranty_text: string | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
          vehicle_id: string
          workshop_id: string
        }
        Insert: {
          amount?: number
          client_id: string
          created_at?: string
          entry_date?: string
          expected_delivery?: string | null
          id?: string
          number?: number
          paid?: boolean
          paid_at?: string | null
          parts_used?: string | null
          reported_problem?: string | null
          service_done?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          vehicle_id: string
          workshop_id: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          entry_date?: string
          expected_delivery?: string | null
          id?: string
          number?: number
          paid?: boolean
          paid_at?: string | null
          parts_used?: string | null
          reported_problem?: string | null
          service_done?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          vehicle_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          id: string
          notes: string | null
                    payment_method: string | null
          payment_condition: string | null
          warranty_text: string | null
          status: Database["public"]["Enums"]["quote_status"]
          updated_at: string
          vehicle_id: string | null
          workshop_id: string
        }
        Insert: {
          amount?: number
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          updated_at?: string
          vehicle_id?: string | null
          workshop_id: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          updated_at?: string
          vehicle_id?: string | null
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          }
        ]
      }
      suppliers: {
        Row: {
          contact_name: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          workshop_id: string
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          workshop_id: string
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          }
        ]
      }
      automation_rules: {
        Row: {
          id: string
          workshop_id: string
          name: string
          type: Database["public"]["Enums"]["automation_rule_type"]
          trigger_condition: string
          message_template: string
          is_active: boolean
          sent_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workshop_id: string
          name: string
          type: Database["public"]["Enums"]["automation_rule_type"]
          trigger_condition: string
          message_template: string
          is_active?: boolean
          sent_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workshop_id?: string
          name?: string
          type?: Database["public"]["Enums"]["automation_rule_type"]
          trigger_condition?: string
          message_template?: string
          is_active?: boolean
          sent_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          }
        ]
      }
      vehicles: {
        Row: {
          brand: string
          client_id: string
          color: string | null
          created_at: string
          id: string
          mileage: number | null
          model: string
          plate: string | null
          renavam: string | null
          chassi: string | null
          engine: string | null
          fuel_type: string | null
          updated_at: string
          workshop_id: string
          year: number | null
        }
        Insert: {
          brand: string
          client_id: string
          color?: string | null
          created_at?: string
          id?: string
          mileage?: number | null
          model: string
          plate?: string | null
          renavam?: string | null
          chassi?: string | null
          engine?: string | null
          fuel_type?: string | null
          updated_at?: string
          workshop_id: string
          year?: number | null
        }
        Update: {
          brand?: string
          client_id?: string
          color?: string | null
          created_at?: string
          id?: string
          mileage?: number | null
          model?: string
          plate?: string | null
          renavam?: string | null
          chassi?: string | null
          engine?: string | null
          fuel_type?: string | null
          updated_at?: string
          workshop_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["workshop_role"]
          token: string
          workshop_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["workshop_role"]
          token?: string
          workshop_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["workshop_role"]
          token?: string
          workshop_id?: string
        }
        Relationships: []
      }
      workshop_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["workshop_role"]
          user_id: string
          workshop_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workshop_role"]
          user_id: string
          workshop_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workshop_role"]
          user_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_members_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          item_type: Database["public"]["Enums"]["item_type"]
          name: string
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_type?: Database["public"]["Enums"]["item_type"]
          name: string
          order_id: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_type?: Database["public"]["Enums"]["item_type"]
          name?: string
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
      quote_items: {
        Row: {
          created_at: string
          id: string
          item_type: Database["public"]["Enums"]["item_type"]
          name: string
          quantity: number
          quote_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_type?: Database["public"]["Enums"]["item_type"]
          name: string
          quantity?: number
          quote_id: string
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_type?: Database["public"]["Enums"]["item_type"]
          name?: string
          quantity?: number
          quote_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          }
        ]
      }
      workshops: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_portal_order: {
        Args: { p_token: string; p_order_id: string }
        Returns: boolean
      }
      get_portal_data: {
        Args: { p_token: string }
        Returns: any
      }
      complete_automation: {
        Args: { _job_id: string; _msg_id: number }
        Returns: undefined
      }
      dequeue_automations: {
        Args: { _batch?: number; _vt?: number }
        Returns: {
          attempts: number
          job_id: string
          kind: Database["public"]["Enums"]["automation_kind"]
          max_attempts: number
          message: Json
          msg_id: number
          payload: Json
          read_ct: number
          workshop_id: string
        }[]
      }
      enqueue_automation: {
        Args: {
          _delay_seconds?: number
          _kind: Database["public"]["Enums"]["automation_kind"]
          _payload: Json
          _workshop_id: string
        }
        Returns: string
      }
      fail_automation: {
        Args: { _error: string; _job_id: string; _msg_id: number }
        Returns: undefined
      }
      has_workshop_role: {
        Args: {
          _role: Database["public"]["Enums"]["workshop_role"]
          _user_id: string
          _workshop_id: string
        }
        Returns: boolean
      }
      is_workshop_member: {
        Args: { _user_id: string; _workshop_id: string }
        Returns: boolean
      }
      retry_automation: { Args: { _job_id: string }; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      appointment_type: "entrada" | "entrega" | "revisao"
      automation_kind:
        | "whatsapp_order_ready"
        | "whatsapp_payment_due"
        | "whatsapp_appointment_reminder"
        | "whatsapp_custom"
      automation_status: "pending" | "processing" | "sent" | "failed" | "dlq"
      order_status: "recebido" | "em_analise" | "aguardando_aprovacao" | "em_manutencao" | "pronto" | "entregue"
      quote_status: "novo" | "contato_feito" | "analise" | "aprovado" | "recusado"
      automation_rule_type: "service_reminder" | "birthday" | "feedback" | "payment"
      subscription_plan: "essencial" | "profissional" | "premium"
      item_type: "peca" | "servico"
      workshop_role: "dono" | "mecanico" | "atendente"
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
      appointment_type: ["entrada", "entrega", "revisao"],
      automation_kind: [
        "whatsapp_order_ready",
        "whatsapp_payment_due",
        "whatsapp_appointment_reminder",
        "whatsapp_custom",
      ],
      automation_status: ["pending", "processing", "sent", "failed", "dlq"],
      order_status: ["recebido", "em_analise", "aguardando_aprovacao", "em_manutencao", "pronto", "entregue"],
      quote_status: ["novo", "contato_feito", "analise", "aprovado", "recusado"],
      automation_rule_type: ["service_reminder", "birthday", "feedback", "payment"],
      subscription_plan: ["essencial", "profissional", "premium"],
      workshop_role: ["dono", "mecanico", "atendente"],
    },
  },
} as const

