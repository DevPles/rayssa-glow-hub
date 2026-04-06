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
      invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          mp_external_reference: string | null
          mp_payment_id: string | null
          mp_preference_id: string | null
          paid_at: string | null
          payment_method: string | null
          status: string
          subscription_id: string | null
          tenant_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          mp_external_reference?: string | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subscription_id?: string | null
          tenant_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          mp_external_reference?: string | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subscription_id?: string | null
          tenant_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_providers: {
        Row: {
          access_token: string | null
          created_at: string
          enable_boleto: boolean
          enable_card: boolean
          enable_installments: boolean
          enable_pix: boolean
          enable_recurring: boolean
          id: string
          is_active: boolean
          is_sandbox: boolean
          max_installments: number
          provider: string
          public_key: string | null
          sandbox_token: string | null
          tenant_id: string
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          enable_boleto?: boolean
          enable_card?: boolean
          enable_installments?: boolean
          enable_pix?: boolean
          enable_recurring?: boolean
          id?: string
          is_active?: boolean
          is_sandbox?: boolean
          max_installments?: number
          provider?: string
          public_key?: string | null
          sandbox_token?: string | null
          tenant_id: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string
          enable_boleto?: boolean
          enable_card?: boolean
          enable_installments?: boolean
          enable_pix?: boolean
          enable_recurring?: boolean
          id?: string
          is_active?: boolean
          is_sandbox?: boolean
          max_installments?: number
          provider?: string
          public_key?: string | null
          sandbox_token?: string | null
          tenant_id?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_providers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_types: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          tenant_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          tenant_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_payment_types_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          invoice_id: string | null
          metadata: Json | null
          mp_payment_id: string | null
          mp_status: string | null
          mp_status_detail: string | null
          payer_document: string | null
          payer_email: string | null
          payer_name: string | null
          payment_method: string | null
          status: string
          tenant_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          mp_payment_id?: string | null
          mp_status?: string | null
          mp_status_detail?: string | null
          payer_document?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payment_method?: string | null
          status?: string
          tenant_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          mp_payment_id?: string | null
          mp_status?: string | null
          mp_status_detail?: string | null
          payer_document?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payment_method?: string | null
          status?: string
          tenant_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          name: string
          price_monthly: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          name: string
          price_monthly?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          name?: string
          price_monthly?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          billing_day: number | null
          cancelled_at: string | null
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          mp_payer_id: string | null
          mp_subscription_id: string | null
          payment_method: string
          plan_id: string
          started_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          billing_day?: number | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          mp_payer_id?: string | null
          mp_subscription_id?: string | null
          payment_method?: string
          plan_id: string
          started_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_day?: number | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          mp_payer_id?: string | null
          mp_subscription_id?: string | null
          payment_method?: string
          plan_id?: string
          started_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          company_name: string
          company_short_name: string
          company_subtitle: string
          hero_card_name: string
          hero_card_subtitle: string
          hero_description: string
          hero_photo_url: string | null
          id: string
          logo_url: string | null
          page_configs: Json
          section_visibility: Json
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string
          company_short_name?: string
          company_subtitle?: string
          hero_card_name?: string
          hero_card_subtitle?: string
          hero_description?: string
          hero_photo_url?: string | null
          id?: string
          logo_url?: string | null
          page_configs?: Json
          section_visibility?: Json
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          company_short_name?: string
          company_subtitle?: string
          hero_card_name?: string
          hero_card_subtitle?: string
          hero_description?: string
          hero_photo_url?: string | null
          id?: string
          logo_url?: string | null
          page_configs?: Json
          section_visibility?: Json
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_system_settings_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          active: boolean
          bank_account: string | null
          bank_agency: string | null
          bank_name: string | null
          created_at: string
          holder_document: string | null
          holder_name: string | null
          id: string
          name: string
          owner_email: string
          pix_key: string | null
          plan: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          created_at?: string
          holder_document?: string | null
          holder_name?: string | null
          id?: string
          name: string
          owner_email: string
          pix_key?: string | null
          plan?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          created_at?: string
          holder_document?: string | null
          holder_name?: string | null
          id?: string
          name?: string
          owner_email?: string
          pix_key?: string | null
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          phone: string
          sent_at: string | null
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          phone: string
          sent_at?: string | null
          status?: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          phone?: string
          sent_at?: string | null
          status?: string
          type?: string
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
    Enums: {},
  },
} as const
