// This file now acts as the data access layer for our Supabase backend.
import { supabase, type Database, type Financials, type Json } from './SupabaseClient.ts';

// --- Type Definitions based on Supabase Schema ---
export type UserProfile = Database['public']['Tables']['app_users']['Row'];
export type Goal = Database['public']['Tables']['goals']['Row'];

// The Financials-related interfaces are now imported from the schema definition file.
// We re-export them here so that component files don't need to change their import source.
export type { Frequency, FinancialItem, Assets, Liabilities, Income, Expenses, Insurance, Financials } from './SupabaseClient.ts';


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

const generateClientID = (): string => {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  // Use a high-res timestamp and a random number to ensure uniqueness without state.
  const uniquePart = `${now.getTime().toString().slice(-6)}${Math.floor(Math.random() * 10)}`;
  return `IN${year}${month}${uniquePart.padStart(7, '0')}`;
};

export const createNewUserProfile = async (
  user_id: string,
  name: string,
  phone_number: string,
  age: number,
  gender: string,
  dependents: number,
  profession: string
): Promise<UserProfile | null> => {
    if (!supabase) return null;
    const client_id = generateClientID(); 
    const { data, error } = await supabase
        .from('app_users')
        .insert([{
            user_id,
            name,
            phone_number,
            client_id,
            age,
            gender,
            dependents,
            profession,
            points: 70, // Award initial points for completing sign-up
            points_source: { demographics: true }, // Mark the source of points
        }])
        .select()
        .single();
        
    if (error) {
        console.error('Error creating user profile:', error);
        return null;
    }

    if (!data) return null;
    if ('user_id' in data) {
        return data;
    }
    
    return null;
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
        return null;
    }
    
    if (!data) return null;
    if ('user_id' in data) {
        return data;
    }

    return null;
}

export const getLatestFinancialSnapshot = async (user_id: string): Promise<Financials | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('financial_snapshots')
        .select('snapshot_data') 
        .eq('user_id', user_id)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching latest financial snapshot:', error);
        return null;
    }
    
    if (!data) return null;
    if ('snapshot_data' in data) {
      return data.snapshot_data;
    }
    
    return null;
}

export const createFinancialSnapshot = async (user_id: string, financials: Financials): Promise<boolean> => {
    if (!supabase) return false;
    
    console.log("Attempting to create financial snapshot for user:", user_id);
    const sanitizedFinancials = sanitizeForSupabase(financials);

    const { data, error } = await supabase
        .from('financial_snapshots')
        .insert([{
            user_id,
            snapshot_data: sanitizedFinancials as Financials,
        }])
        .select(); 

    if (error) {
        console.error('Error creating financial snapshot:', JSON.stringify(error, null, 2));
        console.error(`Failed to save financial data: ${error.message}. This could be a database permission (RLS) issue.`);
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
        console.error(`Failed to fetch user profile to save persona: ${getError?.message}.`);
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
        console.error(`Failed to save persona: ${error.message}. This could be a database permission (RLS) issue.`);
        return null;
    }

    console.log("Successfully updated user profile:", data);
    
    if (!data) return null;
    if ('user_id' in data) {
        return data;
    }

    return null;
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

    if (data && 'user_id' in data) {
        return data;
    }
    
    return null;
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
        .insert([{
            user_id,
            goal_name: goal.goal_name,
            target_age: goal.target_age,
            target_value: goal.target_value,
        }])
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