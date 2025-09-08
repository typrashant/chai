
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your actual Supabase project URL and anon key
const supabaseUrl = 'https://ryvuoxbgqonrjzsilfmf.supabase.co'; // e.g., 'https://xyz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dnVveGJncW9ucmp6c2lsZm1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNDQ4NzMsImV4cCI6MjA3MjgyMDg3M30.1JWpM6XjveLbDO0g6zKW5eDkF7ILri6f4UoVpTjIRjY'; // The long string from the API settings

// FIX: Moved Database interface and Json type here from src/db.ts to break a circular dependency.
// This ensures the Supabase client is correctly typed.
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
      };
      user_personas: {
        Row: {
          persona_id: number;
          user_id: string;
          persona_name: string;
          risk_score: number | null;
          discipline_score: number | null;
          assigned_at: string;
        };
        Insert: {
          user_id: string;
          persona_name: string;
          risk_score?: number | null;
          discipline_score?: number | null;
        };
        Update: {}; // Personas are typically immutable
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

export const isSupabaseConfigured =
  supabaseUrl &&
  supabaseUrl !== 'https://ryvuoxbgqonrjzsilfmf.supabase.co' &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dnVveGJncW9ucmp6c2lsZm1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNDQ4NzMsImV4cCI6MjA3MjgyMDg3M30.1JWpM6XjveLbDO0g6zKW5eDkF7ILri6f4UoVpTjIRjY';

// Only create a client if the config is valid, otherwise export null
// This prevents the app from crashing on an invalid URL.
export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;
