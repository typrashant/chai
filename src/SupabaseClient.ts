import { createClient } from '@supabase/supabase-js';

// Reads the Supabase URL and Key from environment variables.
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';

// Defines the TypeScript interface for your entire database schema.
// This provides static type checking and autocompletion for all your database operations.
export interface Database {
  public: {
    Tables: {
      app_users: {
        Row: { // The data shape of a row from the table.
          user_id: string;
          client_id: string;
          name: string;
          phone_number: string;
          date_of_birth: string;
          gender: string | null;
          profession: string | null;
          dependents: number | null;
          persona: string | null;
          points: number;
          points_source: Json; // JSONB column
          created_at: string;
          updated_at: string;
        };
        Insert: { // The data shape needed to insert a new row.
          user_id: string;
          client_id: string;
          name: string;
          phone_number: string;
          date_of_birth: string;
          gender?: string | null;
          profession?: string | null;
          dependents?: number | null;
          persona?: string | null;
          points?: number;
          points_source?: Json;
        };
        Update: { // The data shape needed to update a row.
          name?: string;
          date_of_birth?: string;
          gender?: string | null;
          profession?: string | null;
          dependents?: number | null;
          persona?: string | null;
          points?: number;
          points_source?: Json;
          updated_at?: string;
        };
        // FIX: Added missing Relationships property to satisfy Supabase's internal types.
        Relationships: [];
      };
      financial_snapshots: {
        Row: {
          snapshot_id: number;
          user_id: string;
          snapshot_date: string;
          assets: Json | null;
          liabilities: Json | null;
          income: Json | null;
          expenses: Json | null;
          insurance: Json | null;
        };
        Insert: {
          user_id: string;
          assets?: Json | null;
          liabilities?: Json | null;
          income?: Json | null;
          expenses?: Json | null;
          insurance?: Json | null;
        };
        Update: {}; // Snapshots are typically immutable
        // FIX: Added missing Relationships property to satisfy Supabase's internal types.
        Relationships: [];
      };
      goals: {
        Row: {
          goal_id: string;
          user_id: string;
          goal_name: string;
          target_age: number;
          target_value: number;
          created_at: string;
          is_achieved: boolean;
        };
        Insert: {
          goal_id?: string;
          user_id: string;
          goal_name: string;
          target_age: number;
          target_value: number;
        };
        Update: {
          goal_name?: string;
          target_age?: number;
          target_value?: number;
          is_achieved?: boolean;
        };
        // FIX: Added missing Relationships property to satisfy Supabase's internal types.
        Relationships: [];
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
}

// Helper for JSONB columns
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// A simpler, more reliable check for whether the secrets have been provided.
export const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// Only create a client if the config is valid, otherwise export null.
export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;