

// Manually define types for import.meta.env to allow for cases where Vite types are unavailable.
declare global {
    interface ImportMeta {
        readonly env: {
            readonly VITE_SUPABASE_URL?: string;
            readonly VITE_SUPABASE_ANON_KEY?: string;
        }
    }
}

import { createClient } from '@supabase/supabase-js';

let supabaseUrl: string | undefined;
let supabaseAnonKey: string | undefined;

// Use a more robust check that verifies `import.meta` and `import.meta.env` exist before trying to access them.
// This prevents crashes in environments where they might not be immediately available.
if (typeof import.meta !== 'undefined' && import.meta.env) {
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
}

// --- Type definitions for JSONB content ---
// These are now the single source of truth for the financial data structure.
export type Frequency = 'monthly' | 'annual';
export interface FinancialItem { value: number; frequency: Frequency; }
export interface Assets {
    cashInHand: number;
    savingsAccount: number;
    fixedDeposit: number;
    recurringDeposit: number;
    gold: number;
    stocks: number;
    mutualFunds: number;
    crypto: number;
    nps: number;
    ppf: number;
    pf: number;
    sukanyaSamriddhi: number;
    house: number;
    car: number;
    otherProperty: number;
    other: number;
}
export interface Liabilities {
    homeLoan: number;
    personalLoan: number;
    carLoan: number;
    creditCard: number;
    other: number;
}
export interface Income {
    salary: FinancialItem;
    bonus: FinancialItem;
    business: FinancialItem;
    rental: FinancialItem;
    other: FinancialItem;
}
export interface Expenses {
    rent: FinancialItem;
    emi: FinancialItem;
    utilities: FinancialItem;
    societyMaintenance: FinancialItem;
    propertyTax: FinancialItem;
    groceries: FinancialItem;
    transport: FinancialItem;
    health: FinancialItem;
    education: FinancialItem;
    insurancePremiums: FinancialItem;
    clothing: FinancialItem;
    diningOut: FinancialItem;
    entertainment: FinancialItem;
    subscriptions: FinancialItem;
    vacation: FinancialItem;
    other: FinancialItem;
}
export interface Insurance {
    life: number;
    health: number;
    car: number;
    property: number;
}
export interface Financials {
    assets: Assets;
    liabilities: Liabilities;
    income: Income;
    expenses: Expenses;
    insurance: Insurance;
}


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
          age: number;
          gender: string | null;
          profession: string | null;
          dependents: number | null;
          persona: string | null;
          points: number;
          locked_points: number;
          points_source: Json; // JSONB column
          advisor_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: { // The data shape needed to insert a new row.
          user_id: string;
          client_id: string;
          name: string;
          phone_number: string;
          age: number;
          gender?: string | null;
          profession?: string | null;
          dependents?: number | null;
          persona?: string | null;
          points?: number;
          locked_points?: number;
          points_source?: Json;
          advisor_id?: string | null;
        };
        Update: { // The data shape needed to update a row.
          name?: string;
          age?: number;
          gender?: string | null;
          profession?: string | null;
          dependents?: number | null;
          persona?: string | null;
          points?: number;
          locked_points?: number;
          points_source?: Json;
          advisor_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "app_users_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      financial_snapshots: {
        Row: {
          snapshot_id: number;
          user_id: string;
          snapshot_date: string;
          snapshot_data: Financials | null;
        };
        Insert: {
          user_id: string;
          snapshot_data?: Financials | null;
        };
        Update: {}; // Snapshots are typically immutable
        Relationships: [
          {
            foreignKeyName: "financial_snapshots_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "app_users";
            referencedColumns: ["user_id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "app_users";
            referencedColumns: ["user_id"];
          }
        ];
      };
      user_actions: {
        Row: {
          action_id: string;
          user_id: string;
          action_key: string;
          status: 'in_progress' | 'completed';
          target_date: string;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          action_id?: string;
          user_id: string;
          action_key: string;
          target_date: string;
          status?: 'in_progress';
        };
        Update: {
          status?: 'completed';
          completed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_actions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "app_users";
            referencedColumns: ["user_id"];
          }
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
  auth: {
    Tables: {
      users: {
        Row: {
          id: string;
          // Other properties of auth.users can be added here if needed
        };
        Insert: {};
        Update: {};
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
export const supabase = isSupabaseConfigured && typeof supabaseUrl === 'string' && typeof supabaseAnonKey === 'string'
  ? createClient<Database>(supabaseUrl as string, supabaseAnonKey as string)
  : null;