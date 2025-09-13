// This file now acts as the data access layer for our Supabase backend.
import { supabase, type Database, type Json } from './SupabaseClient.ts';

// --- Type Definitions based on Supabase Schema ---
export type UserProfile = Database['public']['Tables']['app_users']['Row'];
export type Goal = Database['public']['Tables']['goals']['Row'];

// These types are for the frontend state management, matching the JSONB structure
export type Frequency = 'monthly' | 'annual';
export interface FinancialItem { value: number; frequency: Frequency; }

// FIX: Replaced generic index signatures with explicit properties for stronger type safety.
// This ensures that data structures are well-defined throughout the app, resolving multiple 'unknown' type errors.
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

// --- Utility Functions ---

/**
 * Recursively sanitizes an object to be compatible with Supabase JSONB inserts.
 * - Removes keys with `undefined` values.
 * - Converts `NaN` or `Infinity` numbers to `null`.
 * @param obj The object to sanitize.
 * @returns A new, sanitized object.
 */
function sanitizeForSupabase(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    if (typeof obj === 'number' && !isFinite(obj)) return null;
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeForSupabase);
  }

  const newObj: { [key: string]: any } = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value !== undefined) {
        newObj[key] = sanitizeForSupabase(value);
      }
    }
  }
  return newObj;
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
    
    console.log("Attempting to create financial snapshot for user:", user_id);
    const sanitizedFinancials = sanitizeForSupabase(financials);

    const { data, error } = await supabase
        .from('financial_snapshots')
        .insert({
            user_id,
            assets: sanitizedFinancials.assets as unknown as Json,
            liabilities: sanitizedFinancials.liabilities as unknown as Json,
            income: sanitizedFinancials.income as unknown as Json,
            expenses: sanitizedFinancials.expenses as unknown as Json,
            insurance: sanitizedFinancials.insurance as unknown as Json,
        })
        .select(); // Request data back to confirm insert and expose RLS issues.

    if (error) {
        console.error('Error creating financial snapshot:', JSON.stringify(error, null, 2));
        alert(`Failed to save financial data: ${error.message}. Please check your browser console for details. This could be a database permission (RLS) issue.`);
        return false;
    }

    console.log("Successfully created snapshot:", data);
    return true;
}

export const updateUserPersonaAndAwardPoints = async (user_id: string, persona: string): Promise<UserProfile | null> => {
    if (!supabase) return null;
    console.log("Attempting to update persona and award points for user:", user_id);

    const { data: currentProfile, error: getError } = await supabase
        .from('app_users')
        .select('points, points_source')
        .eq('user_id', user_id)
        .single();

    if (getError || !currentProfile) {
        console.error('Could not fetch user to award points:', JSON.stringify(getError, null, 2));
        alert(`Failed to fetch user profile to save persona: ${getError?.message}.`);
        return null;
    }
    
    const currentPointsSource = (currentProfile.points_source as { [key: string]: boolean }) || {};
    const POINTS_FOR_QUIZ = 30;
    
    const updates: Database['public']['Tables']['app_users']['Update'] = {
        persona,
        updated_at: new Date().toISOString()
    };

    if (!currentPointsSource['personaQuiz']) {
        updates.points = (currentProfile.points || 0) + POINTS_FOR_QUIZ;
        updates.points_source = { ...currentPointsSource, personaQuiz: true };
    }

    const { data, error } = await supabase
        .from('app_users')
        .update(updates)
        .eq('user_id', user_id)
        .select()
        .single();

    if (error) {
        console.error('Error updating persona and points:', JSON.stringify(error, null, 2));
        alert(`Failed to save persona: ${error.message}. Please check console for details. This could be a database permission (RLS) issue.`);
        return null;
    }

    console.log("Successfully updated user profile:", data);
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
    
    const { error } = await supabase
        .from('app_users')
        .update({ points: newPoints, points_source: newPointsSource })
        .eq('user_id', user_id);
    
    if (error) {
        console.error('Error awarding points:', error);
        return null;
    }

    // On success, return the optimistically updated profile
    return {
        ...currentProfile,
        points: newPoints,
        points_source: newPointsSource,
    };
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