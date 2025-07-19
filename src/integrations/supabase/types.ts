export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      contact_info: {
        Row: {
          created_at: string
          display_order: number
          icon: string | null
          id: number
          image_url: string | null
          is_active: boolean | null
          title: string
          type: string
          updated_at: string
          url: string | null
          value: string
        }
        Insert: {
          created_at?: string
          display_order: number
          icon?: string | null
          id?: number
          image_url?: string | null
          is_active?: boolean | null
          title: string
          type: string
          updated_at?: string
          url?: string | null
          value: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: number
          image_url?: string | null
          is_active?: boolean | null
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
          value?: string
        }
        Relationships: []
      }
      homepage_images: {
        Row: {
          alt_text: string
          created_at: string
          description: string | null
          display_order: number
          id: number
          image_url: string
          is_active: boolean | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          alt_text: string
          created_at?: string
          description?: string | null
          display_order: number
          id?: number
          image_url: string
          is_active?: boolean | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          alt_text?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: number
          image_url?: string
          is_active?: boolean | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          assigned_at: string | null
          assigned_store_id: string | null
          created_at: string | null
          customer_address: string
          customer_city: string | null
          customer_code: string | null
          customer_name: string
          customer_phone: string
          delivered_at: string | null
          id: string
          notes: string | null
          product_id: string | null
          product_name: string
          product_price: number
          quantity: number
          returned_at: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          store_name: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_store_id?: string | null
          created_at?: string | null
          customer_address: string
          customer_city?: string | null
          customer_code?: string | null
          customer_name: string
          customer_phone: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          product_name: string
          product_price: number
          quantity: number
          returned_at?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          store_name?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_store_id?: string | null
          created_at?: string | null
          customer_address?: string
          customer_city?: string | null
          customer_code?: string | null
          customer_name?: string
          customer_phone?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          product_name?: string
          product_price?: number
          quantity?: number
          returned_at?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          store_name?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_assigned_store_id_fkey"
            columns: ["assigned_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      policies: {
        Row: {
          content: string
          content_en: string
          created_at: string
          id: number
          is_active: boolean | null
          title: string
          title_en: string
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          content_en: string
          created_at?: string
          id?: number
          is_active?: boolean | null
          title: string
          title_en: string
          type: string
          updated_at?: string
        }
        Update: {
          content?: string
          content_en?: string
          created_at?: string
          id?: number
          is_active?: boolean | null
          title?: string
          title_en?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          discount_amount: number | null
          discount_percentage: number | null
          final_price: number | null
          id: string
          image_url_1: string | null
          image_url_2: string | null
          image_url_3: string | null
          image_url_4: string | null
          name: string
          price: number
          published_at: string | null
          published_by: string | null
          quantity: number
          status: Database["public"]["Enums"]["product_status"] | null
          store_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          final_price?: number | null
          id?: string
          image_url_1?: string | null
          image_url_2?: string | null
          image_url_3?: string | null
          image_url_4?: string | null
          name: string
          price: number
          published_at?: string | null
          published_by?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["product_status"] | null
          store_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          final_price?: number | null
          id?: string
          image_url_1?: string | null
          image_url_2?: string | null
          image_url_3?: string | null
          image_url_4?: string | null
          name?: string
          price?: number
          published_at?: string | null
          published_by?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["product_status"] | null
          store_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
        ]
      }
      secrets: {
        Row: {
          name: string
          value: string
        }
        Insert: {
          name: string
          value: string
        }
        Update: {
          name?: string
          value?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          address: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          owner_email: string | null
          password_hash: string
          phone: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          owner_email?: string | null
          password_hash: string
          phone?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          owner_email?: string | null
          password_hash?: string
          phone?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "system_users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          email: string
          id: string
          subscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          subscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          subscribed_at?: string | null
        }
        Relationships: []
      }
      system_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          password_hash: string
          role: Database["public"]["Enums"]["user_role"]
          store_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          password_hash: string
          role?: Database["public"]["Enums"]["user_role"]
          store_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          password_hash?: string
          role?: Database["public"]["Enums"]["user_role"]
          store_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          id: string
          is_admin: boolean | null
        }
        Insert: {
          created_at?: string | null
          id: string
          is_admin?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_order: {
        Args: {
          p_customer_name: string
          p_customer_phone: string
          p_customer_address: string
          p_notes?: string
          p_quantity?: number
          p_product_id?: string
          p_product_name?: string
          p_product_price?: number
        }
        Returns: Json
      }
      add_product_ai: {
        Args: { p_ai_input: string; p_created_by: string }
        Returns: Json
      }
      add_product_manual: {
        Args: {
          p_name: string
          p_description?: string
          p_price?: number
          p_quantity?: number
          p_discount_amount?: number
          p_store_name?: string
          p_image_url_1?: string
          p_image_url_2?: string
          p_image_url_3?: string
          p_image_url_4?: string
          p_created_by?: string
        }
        Returns: Json
      }
      assign_all_pending_orders: {
        Args: Record<PropertyKey, never>
        Returns: {
          order_id: string
          customer_name: string
          main_store_name: string
          success: boolean
          message: string
          assigned_store_name: string
        }[]
      }
      assign_order_manually: {
        Args: { order_id: string; store_id: string }
        Returns: undefined
      }
      assign_order_to_store: {
        Args:
          | { p_order_id: number; p_store_id: string }
          | { p_order_id: string; p_store_id: string }
          | { p_order_id: string; p_store_id: string; p_assigned_by: string }
        Returns: string
      }
      authenticate_store: {
        Args: { store_name: string; store_password: string }
        Returns: string
      }
      authenticate_store_user: {
        Args: { p_username: string; p_password: string }
        Returns: {
          store_id: string
          store_name: string
        }[]
      }
      authenticate_user: {
        Args: { p_email: string; p_password: string }
        Returns: {
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"]
          store_id: string
        }[]
      }
      auto_assign_order_safe: {
        Args: { order_id_param: string }
        Returns: Json
      }
      can_store_process_order: {
        Args: { order_id_param: string; store_id_param: string }
        Returns: boolean
      }
      check_auto_assignment_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          component: string
          status: string
          details: string
        }[]
      }
      create_store: {
        Args: {
          p_name: string
          p_username: string
          p_password: string
          p_owner_email?: string
          p_phone?: string
          p_address?: string
          p_created_by?: string
        }
        Returns: Json
      }
      generate_customer_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_unique_order_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_order_with_store_details: {
        Args: { p_order_id: string }
        Returns: {
          order_id: string
          customer_name: string
          customer_phone: string
          customer_address: string
          customer_city: string
          order_code: string
          order_details: string
          items: Json
          total_amount: number
          store_id: string
          store_name: string
          store_owner_email: string
        }[]
      }
      get_orders: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          customer_name: string
          status: string
          assigned_store: string
          created_at: string
        }[]
      }
      get_orders_detailed: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          customer_name: string
          customer_phone: string
          customer_address: string
          customer_code: string
          notes: string
          quantity: number
          product_id: string
          product_name: string
          total_amount: number
          status: string
          assigned_store: string
          assigned_store_name: string
          created_at: string
          updated_at: string
        }[]
      }
      get_orders_filtered: {
        Args: {
          status_filter?: string
          store_filter?: string
          limit_count?: number
        }
        Returns: {
          id: string
          customer_name: string
          status: string
          assigned_store: string
          created_at: string
        }[]
      }
      get_orders_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_orders: number
          pending_orders: number
          assigned_orders: number
          delivered_orders: number
          returned_orders: number
        }[]
      }
      get_orders_with_details: {
        Args: Record<PropertyKey, never>
        Returns: {
          order_id: string
          customer_name: string
          customer_phone: string
          customer_address: string
          products: Json
          notes: string
          status: string
          assigned_store_id: string
          assigned_store_name: string
          created_at: string
          updated_at: string
        }[]
      }
      get_orders_with_products: {
        Args: Record<PropertyKey, never>
        Returns: {
          order_id: string
          customer_name: string
          status: string
          product_name: string
          quantity: number
          store_name: string
          created_at: string
        }[]
      }
      get_products: {
        Args: { p_user_id?: string }
        Returns: {
          id: string
          name: string
          description: string
          price: number
          discount_amount: number
          discount_percentage: number
          final_price: number
          quantity: number
          store_name: string
          image_url_1: string
          image_url_2: string
          image_url_3: string
          image_url_4: string
          status: string
          created_at: string
          can_edit: boolean
        }[]
      }
      get_store_details: {
        Args: { store_uuid: string }
        Returns: {
          store_name: string
          owner_email: string
        }[]
      }
      get_store_id_by_fuzzy_name: {
        Args: { store_name: string }
        Returns: string
      }
      get_store_id_by_name: {
        Args: { store_name: string }
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      publish_product: {
        Args: { p_product_id: string; p_user_id: string }
        Returns: Json
      }
      set_active_config: {
        Args: {
          p_config_name: string
          p_service_id: string
          p_template_id: string
          p_public_key: string
          p_description: string
        }
        Returns: undefined
      }
      set_active_emailjs_config: {
        Args: {
          p_service_id: string
          p_template_id: string
          p_public_key: string
          p_description?: string
        }
        Returns: number
      }
      test_auto_assignment: {
        Args: Record<PropertyKey, never>
        Returns: {
          test_name: string
          success: boolean
          message: string
        }[]
      }
      test_connection: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_example: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_order_status: {
        Args:
          | {
              order_id_param: string
              new_status: string
              updated_by_store_id?: string
            }
          | {
              p_order_id: string
              p_new_status: Database["public"]["Enums"]["order_status"]
              p_store_id: string
            }
        Returns: Json
      }
      update_order_status_safe: {
        Args:
          | {
              order_id_param: string
              new_status: string
              search_by_order_code?: boolean
            }
          | { p_order_id: number; p_new_status: string }
        Returns: {
          order_id: number
          order_status: string
          updated: string
        }[]
      }
      upsert_order: {
        Args: {
          p_order_code: string
          p_customer_name: string
          p_customer_phone: string
          p_customer_address: string
          p_customer_city?: string
          p_customer_notes?: string
          p_items?: Json
          p_subtotal?: number
          p_delivery_cost?: number
          p_total_amount?: number
          p_order_status?: string
          p_assigned_store?: string
        }
        Returns: Json
      }
      your_function_name: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      تصحيح_الحالة: {
        Args: Record<PropertyKey, never>
        Returns: {
          order_id: string
          customer_name: string
          order_code: string
          status_before: string
          status_after: string
          products_info: Json
          correction_notes: string
        }[]
      }
    }
    Enums: {
      order_status: "pending" | "assigned" | "delivered" | "returned"
      product_status: "draft" | "published" | "archived" | "pending"
      user_role: "admin" | "assistant" | "store"
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
      order_status: ["pending", "assigned", "delivered", "returned"],
      product_status: ["draft", "published", "archived", "pending"],
      user_role: ["admin", "assistant", "store"],
    },
  },
} as const
