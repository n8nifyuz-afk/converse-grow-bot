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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      anonymous_messages: {
        Row: {
          content: string
          created_at: string
          file_attachments: Json | null
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          file_attachments?: Json | null
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          file_attachments?: Json | null
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: []
      }
      chats: {
        Row: {
          created_at: string
          id: string
          model_id: string | null
          project_id: string | null
          title: string
          tool_id: string | null
          tool_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          model_id?: string | null
          project_id?: string | null
          title?: string
          tool_id?: string | null
          tool_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          model_id?: string | null
          project_id?: string | null
          title?: string
          tool_id?: string | null
          tool_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      image_analyses: {
        Row: {
          analysis: string
          chat_id: string | null
          created_at: string
          file_name: string
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          analysis: string
          chat_id?: string | null
          created_at?: string
          file_name: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          analysis?: string
          chat_id?: string | null
          created_at?: string
          file_name?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_analyses_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      message_ratings: {
        Row: {
          ai_message: string | null
          created_at: string
          id: string
          message_id: string
          rating: string
          updated_at: string
          user_id: string
          user_message: string | null
        }
        Insert: {
          ai_message?: string | null
          created_at?: string
          id?: string
          message_id: string
          rating: string
          updated_at?: string
          user_id: string
          user_message?: string | null
        }
        Update: {
          ai_message?: string | null
          created_at?: string
          id?: string
          message_id?: string
          rating?: string
          updated_at?: string
          user_id?: string
          user_message?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          embedding: string | null
          file_attachments: Json | null
          id: string
          model: string | null
          role: string
          session_id: string | null
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          embedding?: string | null
          file_attachments?: Json | null
          id?: string
          model?: string | null
          role: string
          session_id?: string | null
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          embedding?: string | null
          file_attachments?: Json | null
          id?: string
          model?: string | null
          role?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          signup_method: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          signup_method?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          signup_method?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stripe_products: {
        Row: {
          created_at: string
          id: string
          plan_name: string
          plan_tier: string
          stripe_product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_name: string
          plan_tier: string
          stripe_product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_name?: string
          plan_tier?: string
          stripe_product_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          processed_at: string
          stripe_event_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          processed_at?: string
          stripe_event_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          processed_at?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
      token_usage: {
        Row: {
          created_at: string
          id: string
          input_tokens: number
          model: string
          output_tokens: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input_tokens?: number
          model: string
          output_tokens?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input_tokens?: number
          model?: string
          output_tokens?: number
          user_id?: string
        }
        Relationships: []
      }
      usage_limits: {
        Row: {
          created_at: string
          id: string
          image_generations_limit: number
          image_generations_used: number
          period_end: string
          period_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_generations_limit?: number
          image_generations_used?: number
          period_end: string
          period_start?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_generations_limit?: number
          image_generations_used?: number
          period_end?: string
          period_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_message_usage: {
        Row: {
          created_at: string
          id: string
          last_reset_at: string | null
          message_count: number
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_reset_at?: string | null
          message_count?: number
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_reset_at?: string | null
          message_count?: number
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan: string | null
          plan_name: string | null
          product_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string | null
          plan_name?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string | null
          plan_name?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      check_and_reset_usage_limits: {
        Args: { p_user_id: string }
        Returns: {
          can_generate: boolean
          limit_value: number
          remaining: number
          reset_date: string
        }[]
      }
      cleanup_free_user_image_usage: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_user_account: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_misplaced_generated_images: {
        Args: Record<PropertyKey, never>
        Returns: {
          bucket_name: string
          created_at: string
          file_path: string
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      increment_image_generation: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      increment_user_message_count: {
        Args: { p_session_id?: string; p_user_id?: string }
        Returns: number
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      reset_user_message_count: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
