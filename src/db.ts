// This file now acts as the data access layer for our Supabase backend.
// FIX: Added 'Assets' to the import to make it available within this file.
import { supabase, type Database, type Financials, type Json, type FinancialItem, type Assets } from './SupabaseClient.ts';

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
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `ADV${randomPart}`;
};


export const createNewUserProfile = async (
  user_id: string,
  name: string,
  phone_number: string,
  age: number,
  gender: string,
  dependents: number,
  profession: string,
  role: 'Individual' | 'Financial Professional',
  advisorCodeToLink?: string | null
): Promise<UserProfile | null> => {
    if (!supabase) return null;

    const userToInsert: Database['public']['Tables']['app_users']['Insert'] = {
        user_id,
        name,
        phone_number,
        client_id: generateClientID(), // All users get a client ID for consistency
        age,
        gender,
        dependents,
        profession,
        role,
        points: 70, // Award initial points for completing sign-up
        locked_points: 0,
        points_source: { demographics: true }, // Mark the source of points
    };

    if (role === 'Financial Professional') {
        userToInsert.advisor_code = generateAdvisorCode();
    } else if (role === 'Individual' && advisorCodeToLink) {
        // Find advisor by code to link
        const { data: advisor, error: advisorError } = await supabase
            .from('app_users')
            .select('user_id')
            .eq('advisor_code', advisorCodeToLink)
            .single();

        if (advisorError) {
            console.error('Error finding advisor by code:', advisorError);
            // Decide if we should still create the user or fail.
            // For now, we'll create the user without linking.
        } else if (advisor) {
            userToInsert.advisor_id = advisor.user_id;
        }
    }

    const { data, error } = await supabase
        .from('app_users')
        .insert([userToInsert])
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

export const linkClientToAdvisor = async (userId: string, advisorCode: string): Promise<{success: boolean, message: string, user: UserProfile | null}> => {
    if (!supabase) return {success: false, message: 'Database not configured', user: null};
    
    const { data: advisor, error: findError } = await supabase
        .from('app_users')
        .select('user_id')
        .eq('advisor_code', advisorCode)
        .eq('role', 'Financial Professional')
        .single();
    
    if (findError || !advisor) {
        console.error("Invalid advisor code or error finding advisor", findError);
        return {success: false, message: 'Invalid advisor code. Please try again.', user: null};
    }

    const { data: updatedUser, error: updateError } = await supabase
        .from('app_users')
        .update({ advisor_id: advisor.user_id })
        .eq('user_id', userId)
        .select()
        .single();
    
    if (updateError) {
        console.error("Error linking client to advisor", updateError);
        return {success: false, message: 'Could not link account. Please try again.', user: null};
    }
    return {success: true, message: 'Successfully linked!', user: updatedUser};
};

export const shareReportWithAdvisor = async (userId: string): Promise<UserProfile | null> => {
    if (!supabase) return null;
    const { data: updatedUser, error } = await supabase
        .from('app_users')
        .update({ report_shared_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();

    if (error) {
        console.error("Error sharing report", error);
        return null;
    }
    return updatedUser;
};

export const getAdvisorClients = async (advisorId: string): Promise<UserProfile[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('advisor_id', advisorId);
    
    if (error) {
        console.error('Error fetching advisor clients:', error);
        return [];
    }
    return data || [];
};

export const getAdvisorProfile = async (advisorId: string): Promise<UserProfile | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('user_id', advisorId)
        .eq('role', 'Financial Professional')
        .single();

    if (error) {
        console.error("Error fetching advisor profile", error);
        return null;
    }
    return data;
};


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
// FIX: Moved these types from App.tsx to centralize data-related definitions.
export type RagStatusHealth = 'green' | 'amber' | 'red';

export interface Ratio {
    value: number;
    status: RagStatusHealth;
}
export interface Ratios {
    savingsRatio: Ratio;
    financialAssetRatio: Ratio;
    liquidityRatio: Ratio;
    leverageRatio: Ratio;
    debtToIncomeRatio: Ratio;
    wealthRatio: Ratio;
}

// FIX: Moved this function from App.tsx to centralize financial calculations and resolve circular dependencies.
export const calculateAllFinancialMetrics = (financials: Financials, user: UserProfile, goals: Goal[]) => {
    if (!user.age) return null;

    const age = user.age;
    const { assets, liabilities, income, expenses, insurance } = financials;

    const totalAssets = Object.values(assets || {}).map(v => Number(v) || 0).reduce((sum, v) => sum + v, 0);
    const totalLiabilities = Object.values(liabilities || {}).map(v => Number(v) || 0).reduce((sum, v) => sum + v, 0);
    const monthlyIncome = Object.values(income || {}).reduce((sum, item) => { const finItem = item as FinancialItem; return finItem ? sum + (finItem.frequency === 'monthly' ? finItem.value : finItem.value / 12) : sum }, 0);
    const monthlyExpenses = Object.values(expenses || {}).reduce((sum, item) => { const finItem = item as FinancialItem; return finItem ? sum + (finItem.frequency === 'monthly' ? finItem.value : finItem.value / 12) : sum }, 0);
    
    const totalMonthlyIncome_MonthlyItems = Object.values(income || {}).reduce((sum, item) => { const finItem = item as FinancialItem; return finItem && finItem.frequency === 'monthly' ? sum + finItem.value : sum }, 0);
    const totalAnnualIncome_AnnualItems = Object.values(income || {}).reduce((sum, item) => { const finItem = item as FinancialItem; return finItem && finItem.frequency === 'annual' ? sum + finItem.value : sum }, 0);
    const totalMonthlyExpenses_MonthlyItems = Object.values(expenses || {}).reduce((sum, item) => { const finItem = item as FinancialItem; return finItem && finItem.frequency === 'monthly' ? sum + finItem.value : sum }, 0);
    const totalAnnualExpenses_AnnualItems = Object.values(expenses || {}).reduce((sum, item) => { const finItem = item as FinancialItem; return finItem && finItem.frequency === 'annual' ? sum + finItem.value : sum }, 0);

    const monthlySavings = monthlyIncome - monthlyExpenses;
    const netWorth = totalAssets - totalLiabilities;
    const investableAssetKeys: (keyof Assets)[] = ['stocks', 'mutualFunds', 'crypto', 'nps', 'ppf', 'pf', 'sukanyaSamriddhi', 'cashInHand', 'savingsAccount', 'recurringDeposit', 'fixedDeposit'];
    
    const financialAssets = investableAssetKeys.reduce((sum, key) => sum + Number(assets[key] || 0), 0);
    const liquidAssets = Number(assets.cashInHand || 0) + Number(assets.savingsAccount || 0);
    const annualIncome = monthlyIncome * 12;
    
    type RagStatus = 'green' | 'amber' | 'red' | 'neutral';

    const getRagStatus = (value: number, green: number, amber: number): 'green' | 'amber' | 'red' => { if (value >= green) return 'green'; if (value >= amber) return 'amber'; return 'red'; };
    const getRagStatusReversed = (value: number, green: number, amber: number): 'green' | 'amber' | 'red' => { if (value <= green) return 'green'; if (value <= amber) return 'amber'; return 'red'; };
    
    const savingsRatio = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
    const emi = expenses.emi;
    const monthlyEmi = emi ? (emi.frequency === 'monthly' ? emi.value : emi.value / 12) : 0;
    const debtToIncomeRatio = monthlyIncome > 0 ? (monthlyEmi / monthlyIncome) * 100 : 0;
    
    const healthRatios = {
        savingsRatio: { value: savingsRatio, status: getRagStatus(savingsRatio, 20, 10) },
        financialAssetRatio: { value: totalAssets > 0 ? (financialAssets / totalAssets) * 100 : 0, status: getRagStatus(totalAssets > 0 ? (financialAssets / totalAssets) * 100 : 0, 50, 25) },
        liquidityRatio: { value: monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 0, status: getRagStatus(monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 0, 6, 3) },
        leverageRatio: { value: totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0, status: getRagStatusReversed(totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0, 30, 50) },
        debtToIncomeRatio: { value: debtToIncomeRatio, status: getRagStatusReversed(debtToIncomeRatio, 36, 43) },
        wealthRatio: { value: annualIncome > 0 ? (netWorth / annualIncome) * 100 : 0, status: getRagStatus(annualIncome > 0 ? (netWorth / annualIncome) * 100 : 0, 200, 100) },
    };

    const lifeTarget = annualIncome * 10;
    const lifeScore = lifeTarget > 0 ? (insurance.life / lifeTarget) * 100 : (insurance.life > 0 ? 100 : 0);
    const protectionScores = {
        life: { score: lifeScore, status: getRagStatus(lifeScore, 90, 50) },
        health: { score: (insurance.health / 1500000) * 100, status: getRagStatus((insurance.health / 1500000) * 100, 90, 50) },
        car: { score: Number(assets.car || 0) > 0 ? (insurance.car > 0 ? 100 : 0) : 100, status: getRagStatus(Number(assets.car || 0) > 0 ? (insurance.car > 0 ? 100 : 0) : 100, 99, 0) as 'green' | 'red' },
        property: { score: (Number(assets.house || 0) + Number(assets.otherProperty || 0)) > 0 ? (insurance.property > 0 ? 100 : 0) : 100, status: getRagStatus((Number(assets.house || 0) + Number(assets.otherProperty || 0)) > 0 ? (insurance.property > 0 ? 100 : 0) : 100, 99, 0) as 'green' | 'red' },
    };
    
    const goalsByTerm = { short: { value: 0 }, medium: { value: 0 }, long: { value: 0 } };
    goals.forEach(goal => {
        const yearsLeft = goal.target_age - age;
        if (yearsLeft < 2) goalsByTerm.short.value += goal.target_value;
        else if (yearsLeft <= 5) goalsByTerm.medium.value += goal.target_value;
        else goalsByTerm.long.value += goal.target_value;
    });
    const assetsByTerm = {
        short: Number(assets.crypto || 0) + Number(assets.cashInHand || 0) + Number(assets.savingsAccount || 0) + Number(assets.recurringDeposit || 0) + Number(assets.fixedDeposit || 0),
        medium: Number(assets.mutualFunds || 0),
        long: Number(assets.stocks || 0) + Number(assets.nps || 0) + Number(assets.ppf || 0) + Number(assets.pf || 0) + Number(assets.sukanyaSamriddhi || 0),
    };
    const calculateRatio = (assetValue: number, goalValue: number) => {
        if (goalValue === 0) return { ratio: 0, status: 'neutral' as RagStatus };
        const ratio = Math.min((assetValue / goalValue) * 100, 100);
        let status: RagStatus = 'red';
        if (ratio >= 75) status = 'green'; else if (ratio >= 40) status = 'amber';
        return { ratio, status };
    };
    const totalGoalValue = goals.reduce((s, g) => s + Number(g.target_value), 0);
    const goalCoverageRatios = {
        overall: { ...calculateRatio(financialAssets, totalGoalValue), label: 'Overall' },
        short: { ...calculateRatio(assetsByTerm.short, goalsByTerm.short.value), label: 'Short-Term' },
        medium: { ...calculateRatio(assetsByTerm.medium, goalsByTerm.medium.value), label: 'Medium-Term' },
        long: { ...calculateRatio(assetsByTerm.long, goalsByTerm.long.value), label: 'Long-Term' },
    };

    const retirementTarget = (85 - age) * ((monthlyExpenses * 12) * 0.7);
    const retirementAssets = Math.max(0, financialAssets + Number(assets.otherProperty || 0) - totalGoalValue);
    const retirementReadiness = {
        readinessPercentage: Math.min(retirementTarget > 0 ? (retirementAssets / retirementTarget) * 100 : 100, 100),
        investableAssets: retirementAssets, retirementTarget,
        status: getRagStatus(retirementTarget > 0 ? (retirementAssets / retirementTarget) * 100 : 100, 40, 20),
    };

    const equityAssets = Number(assets.stocks || 0) + Number(assets.mutualFunds || 0) + Number(assets.crypto || 0);
    const equityAllocationPercentage = financialAssets > 0 ? (equityAssets / financialAssets) * 100 : 0;
    
    const metrics = { netWorth, totalAssets, totalLiabilities, healthRatios, protectionScores, goalCoverageRatios, retirementReadiness, equityAllocationPercentage, monthlyIncome, monthlyExpenses, monthlySavings, totalMonthlyIncome_MonthlyItems, totalAnnualIncome_AnnualItems, totalMonthlyExpenses_MonthlyItems, totalAnnualExpenses_AnnualItems };
    
    const actionList: {key: string; priority: number}[] = [];
    Object.entries(healthRatios).forEach(([key, ratio]) => { if (ratio.status === 'red') actionList.push({ key, priority: 1 }); });
    Object.entries(healthRatios).forEach(([key, ratio]) => { if (ratio.status === 'amber') actionList.push({ key, priority: 2 }); });
    if (protectionScores) Object.entries(protectionScores).forEach(([key, score]) => { if (score.status === 'red') actionList.push({ key: `protection-${key}`, priority: 3 }); });
    if (goalCoverageRatios) Object.entries(goalCoverageRatios).forEach(([key, ratio]) => { if (ratio.status === 'red') actionList.push({ key: `goals-${key}`, priority: 4 }); });
    if (retirementReadiness && retirementReadiness.status !== 'green') actionList.push({ key: 'retirement', priority: 5 });
    
    const { persona } = user;
    const lowRiskPersonas = ['Guardian', 'Spender'], highRiskPersonas = ['Adventurer', 'Accumulator'];
    const recommendedEquityByAge = Math.max(0, 110 - age);
    let allocationAnomalyDetected = false;
    if (persona && lowRiskPersonas.includes(persona) && equityAllocationPercentage > 40) { actionList.push({ key: 'asset-allocation-persona-aggressive', priority: 6 }); allocationAnomalyDetected = true; }
    else if (persona && highRiskPersonas.includes(persona) && equityAllocationPercentage < 50) { actionList.push({ key: 'asset-allocation-persona-conservative', priority: 6 }); allocationAnomalyDetected = true; }
    if (!allocationAnomalyDetected) {
        if (equityAllocationPercentage > recommendedEquityByAge + 15) actionList.push({ key: 'asset-allocation-age-aggressive', priority: 6 });
        else if (equityAllocationPercentage < recommendedEquityByAge - 15) actionList.push({ key: 'asset-allocation-age-conservative', priority: 6 });
    }

    const uniqueActions = Array.from(new Map(actionList.map(item => [item.key, item])).values()).sort((a, b) => a.priority - b.priority);
    const triggeredActionKeys = uniqueActions.map(a => a.key);

    return { metrics, triggeredActionKeys };
}