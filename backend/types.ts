/* eslint-disable */
// AUTO-GENERATED — DO NOT EDIT
// Run migrations to regenerate.

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
      app_contacts: {
        Row: {
          email: string
          name: string
          role: string
          updated_at: string | null
        }
        Insert: {
          email: string
          name: string
          role: string
          updated_at?: string | null
        }
        Update: {
          email?: string
          name?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      app_messages: {
        Row: {
          created_at: string | null
          id: string
          read: boolean | null
          receiver_id: string
          receiver_name: string
          sender_id: string
          sender_name: string
          sender_role: string
          text: string
        }
        Insert: {
          created_at?: string | null
          id: string
          read?: boolean | null
          receiver_id: string
          receiver_name: string
          sender_id: string
          sender_name: string
          sender_role: string
          text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          read?: boolean | null
          receiver_id?: string
          receiver_name?: string
          sender_id?: string
          sender_name?: string
          sender_role?: string
          text?: string
        }
        Relationships: []
      }
      study_room_challenges: {
        Row: {
          answers: Json | null
          correct_answer: number
          created_at: string | null
          created_by: string
          created_by_name: string
          id: string
          options: Json
          question: string
          room_id: string
        }
        Insert: {
          answers?: Json | null
          correct_answer: number
          created_at?: string | null
          created_by: string
          created_by_name: string
          id: string
          options: Json
          question: string
          room_id: string
        }
        Update: {
          answers?: Json | null
          correct_answer?: number
          created_at?: string | null
          created_by?: string
          created_by_name?: string
          id?: string
          options?: Json
          question?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_room_challenges_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      study_room_members: {
        Row: {
          email: string
          is_online: boolean | null
          joined_at: string | null
          last_active: string | null
          name: string
          room_id: string
          streak: number | null
          user_id: string
          xp: number | null
        }
        Insert: {
          email: string
          is_online?: boolean | null
          joined_at?: string | null
          last_active?: string | null
          name: string
          room_id: string
          streak?: number | null
          user_id: string
          xp?: number | null
        }
        Update: {
          email?: string
          is_online?: boolean | null
          joined_at?: string | null
          last_active?: string | null
          name?: string
          room_id?: string
          streak?: number | null
          user_id?: string
          xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "study_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      study_room_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          room_id: string
          sender_id: string
          sender_name: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id: string
          room_id: string
          sender_id: string
          sender_name: string
          type: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          room_id?: string
          sender_id?: string
          sender_name?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      study_room_notes: {
        Row: {
          content: string
          id: string
          room_id: string
          shared_at: string | null
          shared_by: string
          shared_by_name: string
          title: string
        }
        Insert: {
          content: string
          id: string
          room_id: string
          shared_at?: string | null
          shared_by: string
          shared_by_name: string
          title: string
        }
        Update: {
          content?: string
          id?: string
          room_id?: string
          shared_at?: string | null
          shared_by?: string
          shared_by_name?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_room_notes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      study_rooms: {
        Row: {
          code: string
          created_at: string | null
          created_by: string
          created_by_name: string
          id: string
          is_private: boolean | null
          name: string
          subject: string
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by: string
          created_by_name: string
          id: string
          is_private?: boolean | null
          name: string
          subject: string
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string
          created_by_name?: string
          id?: string
          is_private?: boolean | null
          name?: string
          subject?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_id: { Args: never; Returns: string }
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
