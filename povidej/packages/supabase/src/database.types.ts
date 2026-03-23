export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; // auth.users.id
          name: string;
          age: number;
          gender: "male" | "female" | "other";
          life_areas: Json; // LifeAreaScore[]
          happiest_moment: string;
          what_friends_say: string;
          what_parents_say: string;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          age: number;
          gender: "male" | "female" | "other";
          life_areas: Json;
          happiest_moment: string;
          what_friends_say: string;
          what_parents_say: string;
          onboarding_completed?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      coaching_sessions: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["coaching_sessions"]["Insert"]>;
      };
      messages: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
        };
        Update: never;
      };
    };
  };
}
