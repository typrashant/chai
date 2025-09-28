// This file now acts as the data access layer for our Supabase backend.
import { supabase, type Database, type Financials, type Json } from './SupabaseClient.ts';

// --- Type Definitions based on Supabase Schema ---
export type UserProfile = Database['public']['Tables']['app_users']['Row'];
export type Goal = Database['public']['Tables']['goals']['Row'];
export type UserAction = Database['public']['Tables']['user_actions']['Row'];
export type FinancialSnapshot = Database['public']['Tables']['financial_snapshots']['Row'];

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

export const createNewUserProfile = async (
  user_id: string,
  name: string,
  phone_number: string,
  age: number,
  gender: string,
  dependents: number,
  profession: string,
  role: 'Individual' | 'Financial Professional',
  advisorCode?: string | null
): Promise<UserProfile | null> => {
    if (!supabase) return null;

    // Call the secure RPC function instead of doing client-side logic
    const { data, error } = await supabase.rpc('create_new_user_with_advisor', {
        p_user_id: user_id,
        p_name: name,
        p_phone_number: phone_number,
        p_age: age,
        p_gender: gender,
        p_dependents: dependents,
        p_profession: profession,
        p_role: role,
        p_advisor_code: advisorCode,
    });
        
    if (error) {
        console.error('Error creating user profile via RPC:', error);
        return null;
    }
    
    // The RPC returns the new user profile as JSON
    return data as UserProfile;
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
    return data;
}

export const getAdvisorProfileById = async (advisor_id: string): Promise<{ name: string | null; advisor_code: string | null } | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('app_users')
        .select('name, advisor_code')
        .eq('user_id', advisor_id)
        .eq('role', 'Financial Professional')
        .single();

    if (error) {
        console.error('Error fetching advisor profile:', error);
        return null;
    }
    return data;
};

export const getAdvisorClients = async (advisor_id: string): Promise<UserProfile[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('advisor_id', advisor_id);

    if (error) {
        console.error('Error fetching advisor clients:', error);
        return [];
    }
    return data;
};

export const getLatestFinancialSnapshot = async (user_id: string): Promise<Financials | null> => {
    if (!supabase) return null;
    // We remove .single() to prevent errors when a new user has no snapshots.
    // The query now returns an array.
    const { data, error } = await supabase
        .from('financial_snapshots')
        .select('snapshot_data')
        .eq('user_id', user_id)
        .order('snapshot_date', { ascending: false })
        .limit(1);

    if (error) {
        // Any database error is a problem.
        console.error('Error fetching latest financial snapshot:', error);
        return null;
    }
    
    // If data is null, or an empty array, it means no snapshot was found (which is fine for a new user).
    if (!data || data.length === 0) {
        return null;
    }
    
    const latestSnapshot = data[0];

    // Check if the snapshot_data property exists and is not null.
    if (latestSnapshot && 'snapshot_data' in latestSnapshot && latestSnapshot.snapshot_data) {
      return latestSnapshot.snapshot_data;
    }
    
    return null;
}

export const getFinancialHistory = async (user_id: string): Promise<FinancialSnapshot[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('financial_snapshots')
        .select('*')
        .eq('user_id', user_id)
        .order('snapshot_date', { ascending: true });

    if (error) {
        console.error('Error fetching financial history:', error);
        return [];
    }
    return data || [];
};

export const createFinancialSnapshot = async (user_id: string, financials: Financials): Promise<boolean> => {
    if (!supabase) return false;
    
    const sanitizedFinancials = sanitizeForSupabase(financials);

    const { error } = await supabase
        .from('financial_snapshots')
        .insert([{
            user_id,
            snapshot_data: sanitizedFinancials as Financials,
        }]); 

    if (error) {
        console.error('Error creating financial snapshot:', JSON.stringify(error, null, 2));
        return false;
    }
    return true;
}

export const updateUserPersonaAndAwardPoints = async (user_id: string, persona: string): Promise<UserProfile | null> => {
    if (!supabase) return null;
    
    const { data: currentProfile, error: getError } = await supabase
        .from('app_users')
        .select('points, points_source')
        .eq('user_id', user_id)
        .single();

    if (getError || !currentProfile) {
        console.error('Could not fetch user to award points:', getError);
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
        console.error('Error updating persona and points:', error);
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

// --- User Action / Rewards Functions ---

export const getUserActions = async (user_id: string): Promise<UserAction[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('user_actions')
        .select('*')
        .eq('user_id', user_id);
    
    if (error) {
        console.error('Error fetching user actions:', error);
        return [];
    }
    return data || [];
};

export const startUserAction = async (user_id: string, action_key: string, target_date: string, currentUser: UserProfile): Promise<UserProfile | null> => {
    if (!supabase) return null;
    
    const { error: actionError } = await supabase.from('user_actions').insert({
        user_id,
        action_key,
        target_date,
    });
    
    if (actionError) {
        console.error('Error starting user action:', actionError);
        return null;
    }
    
    const newLockedPoints = (currentUser.locked_points || 0) + 100;
    const { data: updatedUser, error: userError } = await supabase
        .from('app_users')
        .update({ locked_points: newLockedPoints })
        .eq('user_id', user_id)
        .select()
        .single();
        
    if (userError) {
        console.error('Error updating locked points:', userError);
        return null;
    }
    
    return updatedUser;
};

export const completeUserAction = async (user_id: string, action_id: string, currentUser: UserProfile): Promise<UserProfile | null> => {
    if (!supabase) return null;

    const { error: actionError } = await supabase
        .from('user_actions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('action_id', action_id)
        .eq('user_id', user_id);

    if (actionError) {
        console.error('Error completing user action:', actionError);
        return null;
    }

    const newLockedPoints = Math.max(0, (currentUser.locked_points || 0) - 100);
    const newPoints = currentUser.points + 100;

    const { data: updatedUser, error: userError } = await supabase
        .from('app_users')
        .update({ points: newPoints, locked_points: newLockedPoints })
        .eq('user_id', user_id)
        .select()
        .single();
    
    if (userError) {
        console.error('Error unlocking points:', userError);
        return null;
    }
    
    return updatedUser;
};

export const linkAdvisor = async (advisorCode: string): Promise<{ user?: UserProfile | null; error?: string }> => {
    if (!supabase) return { error: "Database not connected" };
    if (!advisorCode) return { error: "Advisor code cannot be empty" };

    const { data, error } = await supabase.rpc('link_advisor_by_code', {
        advisor_code_to_link: advisorCode,
    });

    if (error) {
        console.error("Error calling link_advisor_by_code RPC:", error);
        // Provide a more generic error to the user for security.
        return { error: "An unexpected error occurred. Please try again." };
    }

    // The RPC function is designed to return an object with an 'error' key on failure.
    // FIX: Cast `data` to `any` to safely access the `error` property from the JSON response.
    if (data && (data as any).error) {
        console.error("Error from RPC function:", (data as any).error);
        return { error: (data as any).error };
    }

    // On success, it returns the updated user profile JSON.
    return { user: data as UserProfile };
};


export const shareReport = async (userId: string): Promise<{ user?: UserProfile | null; error?: string }> => {
    if (!supabase) return { error: "Database not connected" };

    const { data: updatedUser, error } = await supabase
        .from('app_users')
        .update({ report_shared_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();
        
    if (error) {
        console.error('Error sharing report:', error);
        return { error: "Could not share report. Please try again." };
    }

    return { user: updatedUser };
};