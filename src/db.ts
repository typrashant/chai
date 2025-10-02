

// This file now acts as the data access layer for our Supabase backend.
// FIX: Import `FinancialItem` to make it available within this module.
import { supabase, type Database, type Financials, type Json, type FinancialItem, type Assets, type Liabilities } from './SupabaseClient.ts';

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

const generateClientID = (): string => {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  // Use a high-res timestamp and a random number to ensure uniqueness without state.
  const uniquePart = `${now.getTime().toString().slice(-6)}${Math.floor(Math.random() * 10)}`;
  return `IN${year}${month}${uniquePart.padStart(7, '0')}`;
};

const generateAdvisorCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export const createNewUserProfile = async (
  user_id: string,
  name: string,
  phone_number: string,
  is_advisor: boolean,
  age?: number,
  gender?: string,
  dependents?: number,
  profession?: string,
  advisor_code_from_url?: string | null
): Promise<UserProfile | null> => {
    if (!supabase) return null;

    if (is_advisor) {
        // Create an advisor profile
        const advisor_code = generateAdvisorCode();
        const { data, error } = await supabase
            .from('app_users')
            .insert([{
                user_id,
                name,
                phone_number,
                is_advisor: true,
                advisor_code: advisor_code,
                client_id: `ADV-${advisor_code}`,
                points: 0,
                locked_points: 0,
                points_source: {},
                // FIX: The 'age' column is non-nullable, but not collected for advisor sign-ups.
                // Providing a default value of 0 to satisfy the database constraint.
                age: 0,
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating advisor profile:', error);
            if (error.message.includes('duplicate key value violates unique constraint')) {
                return createNewUserProfile(user_id, name, phone_number, is_advisor);
            }
            return null;
        }
        return data;

    } else { // Create a personal user profile
        let linked_advisor_id: string | null = null;
        if (advisor_code_from_url) {
            const { data: advisor } = await supabase
                .from('app_users')
                .select('user_id')
                .eq('advisor_code', advisor_code_from_url)
                .eq('is_advisor', true)
                .single();
            if (advisor) {
                linked_advisor_id = advisor.user_id;
            } else {
                console.warn("Advisor code provided but not found:", advisor_code_from_url);
            }
        }

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
                points: 70,
                locked_points: 0,
                points_source: { demographics: true },
                linked_advisor_id,
                is_advisor: false,
            }])
            .select()
            .single();
            
        if (error) {
            console.error('Error creating user profile:', error);
            return null;
        }
        return data;
    }
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
        // Attempt to roll back action creation? For now, we'll just log.
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

// --- Advisor Functions ---

export const linkToAdvisor = async (user_id: string, advisor_code: string): Promise<UserProfile | null> => {
    if (!supabase) return null;
    const { data: advisor, error: advisorError } = await supabase
        .from('app_users')
        .select('user_id')
        .eq('advisor_code', advisor_code)
        .eq('is_advisor', true)
        .single();

    if (advisorError || !advisor) {
        console.error('Advisor not found for code:', advisor_code, advisorError);
        return null;
    }

    const { data: updatedUser, error: linkError } = await supabase
        .from('app_users')
        .update({ linked_advisor_id: advisor.user_id })
        .eq('user_id', user_id)
        .select()
        .single();

    if (linkError) {
        console.error('Error linking user to advisor:', linkError);
        return null;
    }
    return updatedUser;
}

export const removeAdvisorLink = async (user_id: string): Promise<UserProfile | null> => {
    if (!supabase) return null;
    const { data: updatedUser, error } = await supabase
        .from('app_users')
        .update({ linked_advisor_id: null, report_shared_at: null }) // Also reset share status
        .eq('user_id', user_id)
        .select()
        .single();
    
    if (error) {
        console.error('Error removing advisor link:', error);
        return null;
    }
    return updatedUser;
}

export const shareReportWithAdvisor = async (user_id: string): Promise<UserProfile | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('app_users')
        .update({ report_shared_at: new Date().toISOString() })
        .eq('user_id', user_id)
        .select()
        .single();
    
    if (error) {
        console.error('Error sharing report:', error);
        return null;
    }
    return data;
}

export const getAdvisorById = async (advisor_id: string): Promise<UserProfile | null> => {
    return getUserProfile(advisor_id);
}

// FIX: Update function signature to reflect the added `completion` and `netWorth` properties.
export const getAdvisorClientsWithStats = async (advisor_id: string): Promise<{clients: (UserProfile & { completion: number; netWorth: number; })[], stats: any}> => {
    if (!supabase) return { clients: [], stats: {} };
    // In a real app, this would be a single RPC call for performance.
    // Here, we'll fetch clients, then loop to get their latest snapshot for stats.
    
    const { data: clients, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('linked_advisor_id', advisor_id);
    
    if (error || !clients) {
        console.error("Error fetching advisor's clients", error);
        return { clients: [], stats: {} };
    }

    let netWorthCalculated = 0;
    let cashflowAdded = 0;
    let planningCompleted = 0;

    const clientsWithCompletion = await Promise.all(clients.map(async (client) => {
        const { data: snapshot, error: snapErr } = await supabase
            .from('financial_snapshots')
            .select('snapshot_data')
            .eq('user_id', client.user_id)
            .limit(1);
        
        const { data: goals, error: goalErr } = await supabase
            .from('goals')
            .select('goal_id')
            .eq('user_id', client.user_id)
            .limit(1);

        let completion = 0;
        const hasPersona = !!client.persona;
        // FIX: Use `Number(v)` to safely cast `unknown` to `number` for comparison.
        const hasNetWorth = snapshot && snapshot[0]?.snapshot_data?.assets && Object.values(snapshot[0]?.snapshot_data.assets).some(v => Number(v) > 0);
        // FIX: `FinancialItem` is now in scope due to the import fix.
        const hasCashflow = snapshot && snapshot[0]?.snapshot_data?.income && Object.values(snapshot[0]?.snapshot_data.income).some(item => (item as FinancialItem).value > 0);
        // FIX: Use `Number(v)` to safely cast `unknown` to `number` for comparison.
        const hasInsurance = snapshot && snapshot[0]?.snapshot_data?.insurance && Object.values(snapshot[0]?.snapshot_data.insurance).some(v => Number(v) > 0);
        const hasGoal = goals && goals.length > 0;
        
        if (hasPersona) completion += 20;
        if (hasNetWorth) { completion += 20; netWorthCalculated++; }
        if (hasCashflow) { completion += 20; cashflowAdded++; }
        if (hasInsurance) completion += 20;
        if (hasGoal) completion += 20;

        if (completion === 100) planningCompleted++;
        
        // FIX: Safely access snapshot data and use `Object.keys` in reduce to prevent type errors.
        const snapshotData = snapshot?.[0]?.snapshot_data;
        const netWorthValue = (hasNetWorth && snapshotData)
            ? Object.keys(snapshotData.assets).reduce((s, k) => s + Number(snapshotData.assets[k as keyof Assets] || 0), 0) -
              Object.keys(snapshotData.liabilities || {}).reduce((s, k) => s + Number((snapshotData.liabilities || {})[k as keyof Liabilities] || 0), 0)
            : 0;

        return { ...client, completion, netWorth: netWorthValue };
    }));
    
    const stats = {
        totalClients: clients.length,
        netWorthCalculated,
        cashflowAdded,
        planningCompleted
    };

    return { clients: clientsWithCompletion, stats };
}