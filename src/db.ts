

// This file now acts as the data access layer for our Supabase backend.
import { supabase, type Database, type Json } from './SupabaseClient.ts';

// --- Type Definitions based on Supabase Schema ---
export type UserProfile = Database['public']['Tables']['app_users']['Row'];
export type Goal = Database['public']['Tables']['goals']['Row'];

// These types are for the frontend state management, matching the JSONB structure
export type Frequency = 'monthly' | 'annual';
export interface FinancialItem { value: number; frequency: Frequency; }
export interface Assets { [key: string]: number }
export interface Liabilities { [key: string]: number }
export interface Income { [key: string]: FinancialItem }
export interface Expenses { [key: string]: FinancialItem }
export interface Insurance { [key: string]: number }
export interface Financials {
    assets: Assets;
    liabilities: Liabilities;
    income: Income;
    expenses: Expenses;
    insurance: Insurance;
}

// --- Data Access Functions ---

let userCounter = 0;
const generateClientID = (): string => {
  userCounter++;
  const yearMonth = '2407';
  const sequence = String(userCounter).padStart(7, '0');
  return `IN${yearMonth}${sequence}`;
};

export const createNewUserProfile = async (
  user_id: string,
  name: string,
  phone_number: string,
  dob: string,
  gender: string,
  dependents: number,
  profession: string
): Promise<UserProfile | null> => {
    if (!supabase) return null;
    const client_id = generateClientID(); 
    const { data, error } = await supabase
        .from('app_users')
        .insert({
            user_id,
            name,
            phone_number,
            client_id,
            date_of_birth: dob,
            gender,
            dependents,
            profession,
        })
        .select()
        .single();
        
    if (error) {
        console.error('Error creating user profile:', error);
        return null;
    }
    return data;
}

export const getUserProfile = async (user_id: string): Promise<UserProfile | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('user_id', user_id)
        .single();

    if (error && error.code !== 'PGRST116') { // Ignore 'PGRST116' (No rows found)
        console.error('Error fetching user profile:', error);
    }
    return data;
}

export const getLatestFinancialSnapshot = async (user_id: string): Promise<Financials | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('financial_snapshots')
        .select('*')
        .eq('user_id', user_id)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching latest financial snapshot:', error);
    }
    
    if (!data) return null;

    // Supabase returns JSONB columns as objects, which match our Financials type
    // FIX: Cast through `unknown` to assert the specific shape of the JSONB data, as TypeScript cannot directly convert the broad `Json` type to our specific interfaces.
    return {
        assets: data.assets as unknown as Assets,
        liabilities: data.liabilities as unknown as Liabilities,
        income: data.income as unknown as Income,
        expenses: data.expenses as unknown as Expenses,
        insurance: data.insurance as unknown as Insurance
    };
}

export const createFinancialSnapshot = async (user_id: string, financials: Financials): Promise<boolean> => {
    if (!supabase) return false;
    // FIX: The supabase client `insert` method expects the JSONB columns to be of type `Json`. Our `Financials` type is more specific, causing a type mismatch. We cast the properties to `Json` via `unknown` to satisfy the client's type requirements.
    const { error } = await supabase
        .from('financial_snapshots')
        .insert({
            user_id,
            assets: financials.assets as unknown as Json,
            liabilities: financials.liabilities as unknown as Json,
            income: financials.income as unknown as Json,
            expenses: financials.expenses as unknown as Json,
            insurance: financials.insurance as unknown as Json,
        });

    if (error) {
        console.error('Error creating financial snapshot:', error);
        return false;
    }
    return true;
}

export const updateUserPersona = async (user_id: string, persona: string): Promise<UserProfile | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('app_users')
        .update({ persona, updated_at: new Date().toISOString() })
        .eq('user_id', user_id)
        .select()
        .single();
        
    if (error) {
        console.error('Error updating persona:', error);
        return null;
    }
    return data;
}

export const awardPoints = async (user_id: string, source: string, pointsToAdd: number, currentProfile: UserProfile): Promise<UserProfile | null> => {
    if (!supabase) return null;
    const currentPointsSource = (currentProfile.points_source as { [key: string]: boolean }) || {};
    
    if (currentPointsSource[source]) {
        return currentProfile; // Points already awarded
    }
    
    const newPoints = currentProfile.points + pointsToAdd;
    const newPointsSource = { ...currentPointsSource, [source]: true };
    
    const { data, error } = await supabase
        .from('app_users')
        .update({ points: newPoints, points_source: newPointsSource })
        .eq('user_id', user_id)
        .select()
        .single();
    
    if (error) {
        console.error('Error awarding points:', error);
        return null;
    }
    return data;
}

export const getUserGoals = async (user_id: string): Promise<Goal[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user_id);

    if (error) {
        console.error('Error fetching goals:', error);
        return [];
    }
    return data || [];
}

export const addUserGoal = async (user_id: string, goal: Omit<Goal, 'goal_id' | 'user_id' | 'created_at' | 'is_achieved'>): Promise<Goal | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('goals')
        .insert({
            user_id,
            goal_name: goal.goal_name,
            target_age: goal.target_age,
            target_value: goal.target_value,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding goal:', error);
        return null;
    }
    return data;
}

export const removeUserGoal = async (goal_id: string): Promise<boolean> => {
    if (!supabase) return false;
    const { error } = await supabase
        .from('goals')
        .delete()
        .eq('goal_id', goal_id);
    
    if (error) {
        console.error('Error deleting goal:', error);
        return false;
    }
    return true;
}