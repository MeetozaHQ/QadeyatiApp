export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      case_attachments: {
        Row: {
          case_id: string;
          category: string;
          file_name: string;
          file_size: number | null;
          file_type: string | null;
          file_url: string;
          id: string;
          updated_at: string;
          uploaded_at: string;
          user_id: string;
        };
        Insert: {
          case_id: string;
          category?: string;
          file_name: string;
          file_size?: number | null;
          file_type?: string | null;
          file_url: string;
          id?: string;
          updated_at?: string;
          uploaded_at?: string;
          user_id: string;
        };
        Update: {
          case_id?: string;
          category?: string;
          file_name?: string;
          file_size?: number | null;
          file_type?: string | null;
          file_url?: string;
          id?: string;
          updated_at?: string;
          uploaded_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "case_attachments_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
        ];
      };
      case_notes: {
        Row: {
          case_id: string;
          content: string;
          created_at: string;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          case_id: string;
          content: string;
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          case_id?: string;
          content?: string;
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "case_notes_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
        ];
      };
      cases: {
        Row: {
          archived_at: string | null;
          case_number: string | null;
          case_type: string | null;
          circuit_name: string | null;
          client_name: string | null;
          court_name: string | null;
          created_at: string;
          description: string | null;
          first_session_date: string | null;
          id: string;
          opponent_name: string | null;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          case_number?: string | null;
          case_type?: string | null;
          circuit_name?: string | null;
          client_name?: string | null;
          court_name?: string | null;
          created_at?: string;
          description?: string | null;
          first_session_date?: string | null;
          id?: string;
          opponent_name?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          archived_at?: string | null;
          case_number?: string | null;
          case_type?: string | null;
          circuit_name?: string | null;
          client_name?: string | null;
          court_name?: string | null;
          created_at?: string;
          description?: string | null;
          first_session_date?: string | null;
          id?: string;
          opponent_name?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      file_activity: {
        Row: {
          action: string;
          attachment_id: string | null;
          case_id: string;
          created_at: string;
          details: string | null;
          file_name: string;
          id: string;
          user_id: string;
        };
        Insert: {
          action: string;
          attachment_id?: string | null;
          case_id: string;
          created_at?: string;
          details?: string | null;
          file_name: string;
          id?: string;
          user_id: string;
        };
        Update: {
          action?: string;
          attachment_id?: string | null;
          case_id?: string;
          created_at?: string;
          details?: string | null;
          file_name?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      lawyer_profiles: {
        Row: {
          avatar_url: string | null;
          bar_level: string | null;
          bio: string | null;
          created_at: string;
          full_name: string;
          id: string;
          logo_url: string | null;
          maps_link: string | null;
          office_address: string | null;
          office_name: string | null;
          slug: string;
          specializations: string[] | null;
          title: string | null;
          updated_at: string;
          user_id: string;
          whatsapp: string | null;
          years_experience: number | null;
        };
        Insert: {
          avatar_url?: string | null;
          bar_level?: string | null;
          bio?: string | null;
          created_at?: string;
          full_name: string;
          id?: string;
          logo_url?: string | null;
          maps_link?: string | null;
          office_address?: string | null;
          office_name?: string | null;
          slug: string;
          specializations?: string[] | null;
          title?: string | null;
          updated_at?: string;
          user_id: string;
          whatsapp?: string | null;
          years_experience?: number | null;
        };
        Update: {
          avatar_url?: string | null;
          bar_level?: string | null;
          bio?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          logo_url?: string | null;
          maps_link?: string | null;
          office_address?: string | null;
          office_name?: string | null;
          slug?: string;
          specializations?: string[] | null;
          title?: string | null;
          updated_at?: string;
          user_id?: string;
          whatsapp?: string | null;
          years_experience?: number | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          is_read: boolean;
          message: string | null;
          priority: string;
          related_case_id: string | null;
          related_payment_id: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message?: string | null;
          priority?: string;
          related_case_id?: string | null;
          related_payment_id?: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message?: string | null;
          priority?: string;
          related_case_id?: string | null;
          related_payment_id?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      payment_installments: {
        Row: {
          amount: number;
          created_at: string;
          due_date: string | null;
          id: string;
          paid_at: string | null;
          payment_id: string;
          status: string;
          user_id: string;
        };
        Insert: {
          amount?: number;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          paid_at?: string | null;
          payment_id: string;
          status?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          paid_at?: string | null;
          payment_id?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_installments_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          case_id: string | null;
          client_name: string;
          client_phone: string | null;
          created_at: string;
          id: string;
          notes: string | null;
          paid_amount: number;
          payment_status: string;
          total_amount: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          case_id?: string | null;
          client_name: string;
          client_phone?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          paid_amount?: number;
          payment_status?: string;
          total_amount?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          case_id?: string | null;
          client_name?: string;
          client_phone?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          paid_amount?: number;
          payment_status?: string;
          total_amount?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
        ];
      };
      sessions: {
        Row: {
          case_id: string;
          court_name: string | null;
          created_at: string;
          id: string;
          notes: string | null;
          outcome: string | null;
          session_date: string;
          session_type: string | null;
          user_id: string;
        };
        Insert: {
          case_id: string;
          court_name?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          outcome?: string | null;
          session_date: string;
          session_type?: string | null;
          user_id: string;
        };
        Update: {
          case_id?: string;
          court_name?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          outcome?: string | null;
          session_date?: string;
          session_type?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
