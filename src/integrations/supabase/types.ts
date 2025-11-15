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
      email_verifications: {
        Row: {
          code: string
          country: string | null
          created_at: string | null
          email: string
          expires_at: string
          gclid: string | null
          id: string
          initial_referer: string | null
          ip_address: string | null
          password_hash: string
          updated_at: string | null
          url_params: Json | null
          verified: boolean | null
        }
        Insert: {
          code: string
          country?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          gclid?: string | null
          id?: string
          initial_referer?: string | null
          ip_address?: string | null
          password_hash: string
          updated_at?: string | null
          url_params?: Json | null
          verified?: boolean | null
        }
        Update: {
          code?: string
          country?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          gclid?: string | null
          id?: string
          initial_referer?: string | null
          ip_address?: string | null
          password_hash?: string
          updated_at?: string | null
          url_params?: Json | null
          verified?: boolean | null
        }
        Relationships: []
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
          browser_info: Json | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          device_info: Json | null
          display_name: string | null
          email: string | null
          external_id: string | null
          gclid: string | null
          gender: string | null
          id: string
          initial_referer: string | null
          ip_address: string | null
          is_test_user: boolean | null
          language: string | null
          last_login_at: string | null
          locale: string | null
          login_count: number | null
          oauth_metadata: Json | null
          oauth_provider: string | null
          phone_number: string | null
          signup_method: string | null
          timezone: string | null
          updated_at: string
          url_params: Json | null
          user_id: string
          welcome_email_sent: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          browser_info?: Json | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          device_info?: Json | null
          display_name?: string | null
          email?: string | null
          external_id?: string | null
          gclid?: string | null
          gender?: string | null
          id?: string
          initial_referer?: string | null
          ip_address?: string | null
          is_test_user?: boolean | null
          language?: string | null
          last_login_at?: string | null
          locale?: string | null
          login_count?: number | null
          oauth_metadata?: Json | null
          oauth_provider?: string | null
          phone_number?: string | null
          signup_method?: string | null
          timezone?: string | null
          updated_at?: string
          url_params?: Json | null
          user_id: string
          welcome_email_sent?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          browser_info?: Json | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          device_info?: Json | null
          display_name?: string | null
          email?: string | null
          external_id?: string | null
          gclid?: string | null
          gender?: string | null
          id?: string
          initial_referer?: string | null
          ip_address?: string | null
          is_test_user?: boolean | null
          language?: string | null
          last_login_at?: string | null
          locale?: string | null
          login_count?: number | null
          oauth_metadata?: Json | null
          oauth_provider?: string | null
          phone_number?: string | null
          signup_method?: string | null
          timezone?: string | null
          updated_at?: string
          url_params?: Json | null
          user_id?: string
          welcome_email_sent?: boolean | null
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
          cost: number | null
          created_at: string
          id: string
          input_tokens: number
          model: string
          output_tokens: number
          user_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          id?: string
          input_tokens?: number
          model: string
          output_tokens?: number
          user_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          id?: string
          input_tokens?: number
          model?: string
          output_tokens?: number
          user_id?: string
        }
        Relationships: []
      }
      trial_conversions: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          paid_subscription_id: string | null
          target_plan: string
          trial_product_id: string
          trial_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          paid_subscription_id?: string | null
          target_plan: string
          trial_product_id: string
          trial_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          paid_subscription_id?: string | null
          target_plan?: string
          trial_product_id?: string
          trial_subscription_id?: string
          updated_at?: string
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
      user_activity_logs: {
        Row: {
          activity_type: string
          browser: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          language: string | null
          metadata: Json | null
          os: string | null
          screen_resolution: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          browser?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          language?: string | null
          metadata?: Json | null
          os?: string | null
          screen_resolution?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          browser?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          language?: string | null
          metadata?: Json | null
          os?: string | null
          screen_resolution?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_cost_summary: {
        Row: {
          created_at: string | null
          id: string
          last_updated: string | null
          total_cost: number | null
          total_input_tokens: number | null
          total_output_tokens: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_updated?: string | null
          total_cost?: number | null
          total_input_tokens?: number | null
          total_output_tokens?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_updated?: string | null
          total_cost?: number | null
          total_input_tokens?: number | null
          total_output_tokens?: number | null
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
          payment_tracked: boolean | null
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
          payment_tracked?: boolean | null
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
          payment_tracked?: boolean | null
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
      webhook_attempts: {
        Row: {
          attempt_number: number
          created_at: string
          customer_email: string | null
          error_code: string | null
          error_message: string | null
          event_type: string
          id: string
          last_retry_at: string | null
          max_retries: number
          next_retry_at: string | null
          request_payload: Json | null
          response_payload: Json | null
          status: string
          stripe_event_id: string
          subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attempt_number?: number
          created_at?: string
          customer_email?: string | null
          error_code?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          last_retry_at?: string | null
          max_retries?: number
          next_retry_at?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          status: string
          stripe_event_id: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attempt_number?: number
          created_at?: string
          customer_email?: string | null
          error_code?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          last_retry_at?: string | null
          max_retries?: number
          next_retry_at?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
          stripe_event_id?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_next_retry: {
        Args: { p_attempt_number: number }
        Returns: string
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
      cleanup_expired_verifications: { Args: never; Returns: undefined }
      delete_user_account: { Args: never; Returns: undefined }
      get_misplaced_generated_images: {
        Args: never
        Returns: {
          bucket_name: string
          created_at: string
          file_path: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_image_generation: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      increment_user_message_count: {
        Args: { p_session_id?: string; p_user_id?: string }
        Returns: number
      }
      reset_user_message_count: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      sync_image_usage_from_messages: {
        Args: { p_user_id: string }
        Returns: undefined
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
