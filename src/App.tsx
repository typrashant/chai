



import React, { useState, useMemo, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './SupabaseClient.ts';
import Auth from './Auth.tsx';
import PersonaQuiz from './PersonaQuiz.tsx';
import NetWorthCalculator from './NetWorthCalculator.tsx';
import MonthlyFinances from './MonthlyFinances.tsx';
import InvestmentAllocation from './InvestmentAllocation.tsx';
import FinancialHealthCard from './FinancialHealthCard.tsx';
import FinancialProtectionCard from './FinancialProtectionCard.tsx';
import FinancialGoalsCard from './FinancialGoalsCard.tsx';
import RetirementTracker from './RetirementTracker.tsx';
import PowerOfSavingCard from './PowerOfSavingCard.tsx';
import MyPlan from './MyPlan.tsx';
import { HomeIcon, PlanIcon, ShareIcon, CloseIcon } from './icons.tsx';
import MonthlyCashflowCard from './MonthlyCashflowCard.tsx';
import NetWorthTimeline from './NetWorthTimeline.tsx';
import FinancialHealthTimeline from './FinancialHealthTimeline.tsx';
import AdvisorDashboard from './AdvisorDashboard.tsx';
import {
    type UserProfile,
    type Financials,
    type Goal,
    type Assets,
    type Insurance,
    type FinancialItem,
    type UserAction,
    type FinancialSnapshot,
    getLatestFinancialSnapshot,
    getFinancialHistory,
    getUserGoals,
    createFinancialSnapshot,
    awardPoints,
    addUserGoal,
    removeUserGoal,
    updateUserPersonaAndAwardPoints,
    getUserProfile,
    getUserActions,
    startUserAction,
    completeUserAction,
    linkToAdvisor,
    shareReportWithAdvisor,
    getAdvisorById,
    removeAdvisorLink,
} from './db.ts';

type RagStatusHealth = 'green' | 'amber' | 'red';

interface Ratio {
    value: number;
    status: RagStatusHealth;
}
interface Ratios {
    savingsRatio: Ratio;
    financialAssetRatio: Ratio;
    liquidityRatio: Ratio;
    leverageRatio: Ratio;
    debtToIncomeRatio: Ratio;
    wealthRatio: Ratio;
}

const APP_VERSION = '1.1.0';

const REWARD_POINTS = {
    netWorth: 250,
    monthlyFinances: 250,
    financialProtection: 250,
    financialGoals: 250,
};

const Logo = () => (
    <svg className="logo-svg" width="50" height="50" viewBox="0 0 50 50" aria-label="ChAi app logo, a steaming cutting chai glass">
        <defs><linearGradient id="glassShine" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" className="shine-start" /><stop offset="50%" className="shine-mid" /><stop offset="100%" className="shine-end" /></linearGradient></defs>
        <path className="glass-body" d="M 12,15 L 38,15 C 39,15 40,16 40,18 L 37,43 C 37,44 36,45 35,45 L 15,45 C 14,45 13,44 13,43 L 10,18 C 10,16 11,15 12,15 Z" /><path className="glass-shine" d="M 12,15 L 38,15 C 39,15 40,16 40,18 L 37,43 C 37,44 36,45 35,45 L 15,45 C 14,45 13,44 13,43 L 10,18 C 10,16 11,15 12,15 Z" fill="url(#glassShine)" /><path className="chai-liquid" d="M 14,24 L 36,24 L 35.5,41 C 35.5,42 34.5,43 33.5,43 L 16.5,43 C 15.5,43 14.5,42 14.5,41 Z" /><path className="chai-foam" d="M 14 24 C 18 22, 22 25, 25 24 C 28 23, 32 25, 36 24" />
        <g transform="translate(3,0)"><path className="steam steam-1" d="M22 8 C 25 2, 30 2, 33 8" /><path className="steam steam-2" d="M25 10 C 28 4, 33 4, 36 10" /><path className="steam steam-3" d="M20 12 C 23 6, 28 6, 31 12" /></g>
    </svg>
);
const ProfileIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const initialFinancials: Financials = {
    assets: { cashInHand: 0, savingsAccount: 0, fixedDeposit: 0, recurringDeposit: 0, gold: 0, stocks: 0, mutualFunds: 0, crypto: 0, nps: 0, ppf: 0, pf: 0, sukanyaSamriddhi: 0, house: 0, car: 0, otherProperty: 0, other: 0 },
    liabilities: { homeLoan: 0, personalLoan: 0, carLoan: 0, creditCard: 0, other: 0 },
    income: { salary: { value: 0, frequency: 'monthly' }, bonus: { value: 0, frequency: 'annual' }, business: { value: 0, frequency: 'monthly' }, rental: { value: 0, frequency: 'monthly' }, other: { value: 0, frequency: 'monthly' } },
    expenses: { rent: { value: 0, frequency: 'monthly' }, emi: { value: 0, frequency: 'monthly' }, utilities: { value: 0, frequency: 'monthly' }, societyMaintenance: { value: 0, frequency: 'monthly' }, propertyTax: { value: 0, frequency: 'annual' }, groceries: { value: 0, frequency: 'monthly' }, transport: { value: 0, frequency: 'monthly' }, health: { value: 0, frequency: 'monthly' }, education: { value: 0, frequency: 'monthly' }, insurancePremiums: { value: 0, frequency: 'annual' }, clothing: { value: 0, frequency: 'monthly' }, diningOut: { value: 0, frequency: 'monthly' }, entertainment: { value: 0, frequency: 'monthly' }, subscriptions: { value: 0, frequency: 'monthly' }, vacation: { value: 0, frequency: 'annual' }, other: { value: 0, frequency: 'monthly' } },
    insurance: { life: 0, health: 0, car: 0, property: 0 },
};

// This function centralizes all financial calculations.
export const calculateAllFinancialMetrics = (financials: Financials, user: UserProfile, goals: Goal[]) => {
    if (!user.age) return null;

    const age = user.age;
    const { assets, liabilities, income, expenses, insurance } = financials;

    const totalAssets = Object.values(assets || {}).map(v => Number(v) || 0).reduce((sum, v) => sum + v, 0);
    const totalLiabilities = Object.values(liabilities || {}).map(v => Number(v) || 0).reduce((sum, v) => sum + v, 0);
    // FIX: Explicitly cast the item to FinancialItem to ensure type-safe access to its properties, preventing potential runtime errors.
    const monthlyIncome = Object.values(income || {}).reduce((sum, item) => { const finItem = item as FinancialItem; return finItem ? sum + (finItem.frequency === 'monthly' ? finItem.value : finItem.value / 12) : sum }, 0);
    // FIX: Explicitly cast the item to FinancialItem to ensure type-safe access to its properties, preventing potential runtime errors.
    const monthlyExpenses = Object.values(expenses || {}).reduce((sum, item) => { const finItem = item as FinancialItem; return finItem ? sum + (finItem.frequency === 'monthly' ? finItem.value : finItem.value / 12) : sum }, 0);
    
    // FIX: Explicitly cast the item to FinancialItem to ensure type-safe access to its properties, preventing potential runtime errors.
    const totalMonthlyIncome_MonthlyItems = Object.values(income || {}).reduce((sum, item) => { const finItem = item as FinancialItem; return finItem && finItem.frequency === 'monthly' ? sum + finItem.value : sum }, 0);
    // FIX: Explicitly cast the item to FinancialItem to ensure type-safe access to its properties, preventing potential runtime errors.
    const totalAnnualIncome_AnnualItems = Object.values(income || {}).reduce((sum, item) => { const finItem = item as FinancialItem; return finItem && finItem.frequency === 'annual' ? sum + finItem.value : sum }, 0);
    // FIX: Explicitly cast the item to FinancialItem to ensure type-safe access to its properties, preventing potential runtime errors.
    const totalMonthlyExpenses_MonthlyItems = Object.values(expenses || {}).reduce((sum, item) => { const finItem = item as FinancialItem; return finItem && finItem.frequency === 'monthly' ? sum + finItem.value : sum }, 0);
    // FIX: Explicitly cast the item to FinancialItem to ensure type-safe access to its properties, preventing potential runtime errors.
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

// This custom hook centralizes all financial calculations.
const useFinancialMetrics = (financials: Financials | null, user: UserProfile | null, goals: Goal[] | null) => {
    return useMemo(() => {
        if (!user || !financials || !goals) return null;
        return calculateAllFinancialMetrics(financials, user, goals);
    }, [financials, user, goals]);
}

const SupabaseConfigError = () => (
    <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--red)', marginBottom: '1rem' }}>Configuration Needed</h1>
        <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Your Supabase connection details are missing. For deployment via GitHub, you must add your keys as <strong>Environment Variables</strong> on your hosting provider (e.g., Vercel, Netlify).
        </p>
        <div style={{ textAlign: 'left', backgroundColor: 'var(--background-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '1rem' }}>How to add environment variables:</h3>
            <ol style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li>Go to your project's dashboard on your hosting provider.</li>
                <li>Find the <strong>Settings</strong> page, then look for <strong>Environment Variables</strong>.</li>
                <li>Add two new variables. <strong>The names must be exact and include the `VITE_` prefix:</strong></li>
                <ul style={{ paddingLeft: '1.5rem', listStyle: 'circle', margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <li>Name: <code style={{ backgroundColor: 'var(--background-color)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>VITE_SUPABASE_URL</code>, Value: Your Supabase Project URL</li>
                    <li>Name: <code style={{ backgroundColor: 'var(--background-color)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>VITE_SUPABASE_ANON_KEY</code>, Value: Your Supabase Anon Key</li>
                </ul>
                <li>After saving, you must <strong>re-deploy</strong> your project to apply the changes.</li>
                 <li>You can find your keys in your Supabase project's <strong>Settings &gt; API</strong> section.</li>
            </ol>
        </div>
    </div>
);


const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [financials, setFinancials] = useState<Financials | null>(null);
  const [financialHistory, setFinancialHistory] = useState<FinancialSnapshot[] | null>(null);
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [userActions, setUserActions] = useState<UserAction[] | null>(null);
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNetWorthOpen, setIsNetWorthOpen] = useState(false);
  const [isNetWorthTimelineOpen, setIsNetWorthTimelineOpen] = useState(false);
  const [isFinancialHealthTimelineOpen, setIsFinancialHealthTimelineOpen] = useState(false);
  const [isMonthlyFinancesOpen, setIsMonthlyFinancesOpen] = useState(false);
  const [isProtectionOpen, setIsProtectionOpen] = useState(false);
  const [isGoalsOpen, setIsGoalsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRemoveAdvisorModalOpen, setIsRemoveAdvisorModalOpen] = useState(false);
  const [pointsAnimation, setPointsAnimation] = useState<{ x: number; y: number; amount: number; key: number } | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'plan'>('dashboard');
  
  const [advisorCodeInput, setAdvisorCodeInput] = useState('');
  const [linkedAdvisor, setLinkedAdvisor] = useState<UserProfile | null>(null);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (!supabase) {
        setIsLoading(false);
        return;
    }

    const checkUser = async () => {
        if (!supabase) {
            setIsLoading(false);
            return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const profile = await getUserProfile(session.user.id);
            if (profile) {
                await loadUserAndData(profile);
            } else {
                await supabase.auth.signOut();
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    };
    checkUser();
  }, []);
  
   useEffect(() => {
    const fetchAdvisor = async () => {
      if (currentUser?.linked_advisor_id) {
        const advisor = await getAdvisorById(currentUser.linked_advisor_id);
        setLinkedAdvisor(advisor);
      } else {
        setLinkedAdvisor(null);
      }
    };
    fetchAdvisor();
  }, [currentUser]);

  const loadUserAndData = async (profile: UserProfile) => {
    setCurrentUser(profile);
    if (profile.is_advisor) {
        setIsLoading(false);
        return;
    }
    const [fetchedFinancials, fetchedHistory, fetchedGoals, fetchedActions] = await Promise.all([
        getLatestFinancialSnapshot(profile.user_id),
        getFinancialHistory(profile.user_id),
        getUserGoals(profile.user_id),
        getUserActions(profile.user_id),
    ]);
    setFinancials(fetchedFinancials || initialFinancials);
    setFinancialHistory(fetchedHistory || []);
    setGoals(fetchedGoals || []);
    setUserActions(fetchedActions || []);
    setIsLoading(false);
  };
  
  const handleAwardPoints = async (source: string, element: HTMLElement, points: number) => {
    if (!currentUser) return;

    const updatedUser = await awardPoints(currentUser.user_id, source, points, currentUser);

    if (updatedUser) {
        if (updatedUser.points !== currentUser.points) {
            const rect = element.getBoundingClientRect();
            setPointsAnimation({ x: rect.left + rect.width / 2, y: rect.top, amount: points, key: Date.now() });
        }
        setCurrentUser(updatedUser);
    }
  };

  const handleQuizComplete = async (user: UserProfile, persona: string) => {
    const updatedUser = await updateUserPersonaAndAwardPoints(user.user_id, persona);
    if (updatedUser) {
        const oldPoints = currentUser?.points || 0;
        if (updatedUser.points > oldPoints) {
            const rect = document.body.getBoundingClientRect();
            setPointsAnimation({ x: rect.left + rect.width / 2, y: rect.top, amount: updatedUser.points - oldPoints, key: Date.now() });
        }
        setCurrentUser(updatedUser);
    }
  }
  
  const handleSaveAndCloseCalculators = async (source: 'netWorth' | 'monthlyFinances', buttonElement: HTMLButtonElement) => {
    if (currentUser && financials) {
        const success = await createFinancialSnapshot(currentUser.user_id, financials);
        if (!success) return; // Stop if saving failed

        // Refetch data to get the latest snapshot and history
        const [newLatest, newHistory] = await Promise.all([
            getLatestFinancialSnapshot(currentUser.user_id),
            getFinancialHistory(currentUser.user_id)
        ]);
        setFinancials(newLatest || initialFinancials);
        setFinancialHistory(newHistory || []);

        if (source === 'netWorth') {
            await handleAwardPoints('netWorth', buttonElement, REWARD_POINTS.netWorth);
            setIsNetWorthOpen(false);
        }
        if (source === 'monthlyFinances') {
            await handleAwardPoints('monthlyFinances', buttonElement, REWARD_POINTS.monthlyFinances);
            setIsMonthlyFinancesOpen(false);
        }
    }
  };

  const handleProtectionToggle = async (buttonElement: HTMLButtonElement) => {
      if (!isProtectionOpen) {
          setIsProtectionOpen(true);
      } else {
        setIsProtectionOpen(false);
        if (currentUser && financials) {
            const success = await createFinancialSnapshot(currentUser.user_id, financials);
            if (success) {
                 const [newLatest, newHistory] = await Promise.all([
                    getLatestFinancialSnapshot(currentUser.user_id),
                    getFinancialHistory(currentUser.user_id)
                ]);
                setFinancials(newLatest || initialFinancials);
                setFinancialHistory(newHistory || []);
                await handleAwardPoints('financialProtection', buttonElement, REWARD_POINTS.financialProtection);
            }
        }
      }
  };

  const handleGoalsToggle = async (buttonElement: HTMLButtonElement) => {
      if (isGoalsOpen && (goals?.length || 0) > 0) {
          await handleAwardPoints('financialGoals', buttonElement, REWARD_POINTS.financialGoals);
      }
      setIsGoalsOpen(!isGoalsOpen);
  }

  const handleAddGoal = async (goal: Omit<Goal, 'goal_id' | 'user_id' | 'created_at' | 'is_achieved'>) => {
    if(currentUser) {
        const newGoal = await addUserGoal(currentUser.user_id, goal);
        if(newGoal) {
            setGoals(prevGoals => [...(prevGoals || []), newGoal]);
        }
    }
  }
  
  const handleRemoveGoal = async (goalId: string) => {
    if(currentUser) {
        const success = await removeUserGoal(goalId);
        if(success) {
            setGoals(prevGoals => (prevGoals || []).filter(g => g.goal_id !== goalId));
        }
    }
  }

  const handleStartAction = async (actionKey: string, targetDate: string) => {
    if (!currentUser) return;
    const updatedUser = await startUserAction(currentUser.user_id, actionKey, targetDate, currentUser);
    if (updatedUser) {
        setCurrentUser(updatedUser);
        const actions = await getUserActions(currentUser.user_id);
        setUserActions(actions);
    }
  };

  const handleCompleteAction = async (actionId: string) => {
      if (!currentUser || !userActions || !metricsData?.triggeredActionKeys) return;

      const actionToComplete = userActions.find(a => a.action_id === actionId);
      if (!actionToComplete) return;

      // Validation check: an action is considered "complete" if the condition that triggered it is no longer true.
      if (metricsData.triggeredActionKeys.includes(actionToComplete.action_key)) {
          alert("Looks like the condition for this action hasn't been met yet. Please update your financial details if you've made progress, and try again.");
          return;
      }

      const updatedUser = await completeUserAction(currentUser.user_id, actionId, currentUser);
      if (updatedUser) {
          setCurrentUser(updatedUser);
          const actions = await getUserActions(currentUser.user_id);
          setUserActions(actions);
      }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setCurrentUser(null);
    setFinancials(null);
    setFinancialHistory(null);
    setGoals(null);
    setUserActions(null);
    setIsProfileOpen(false);
  };
  
  const handleLinkAdvisor = async () => {
      if (!currentUser || !advisorCodeInput) return;
      const updatedUser = await linkToAdvisor(currentUser.user_id, advisorCodeInput);
      if (updatedUser) {
          setCurrentUser(updatedUser);
          setAdvisorCodeInput('');
          setProfileMessage({ type: 'success', text: "Successfully linked to advisor!" });
      } else {
          setProfileMessage({ type: 'error', text: "Failed to link. Check the code." });
      }
      setTimeout(() => setProfileMessage(null), 3000);
  };
  
  const handleShareReport = async () => {
      if (!currentUser) return;
      if (!currentUser.linked_advisor_id) {
          setIsShareModalOpen(false);
          setIsProfileOpen(true);
          alert("Please link an advisor first by entering their code in your profile.");
          return;
      }
      const updatedUser = await shareReportWithAdvisor(currentUser.user_id);
      if (updatedUser) {
          setCurrentUser(updatedUser);
          setIsShareModalOpen(false);
      } else {
          alert("Could not share report. Please try again later.");
      }
  }
  
  const handleRemoveAdvisor = async () => {
    if (!currentUser) return;
    const updatedUser = await removeAdvisorLink(currentUser.user_id);
    if (updatedUser) {
        setCurrentUser(updatedUser);
        setIsRemoveAdvisorModalOpen(false);
        setProfileMessage({ type: 'success', text: "Advisor has been removed." });
    } else {
        setIsRemoveAdvisorModalOpen(false);
        setProfileMessage({ type: 'error', text: "Failed to remove advisor." });
    }
    setTimeout(() => setProfileMessage(null), 3000);
  };

  const metricsData = useFinancialMetrics(financials, currentUser, goals);
  const metrics = metricsData?.metrics;
  const triggeredActionKeys = metricsData?.triggeredActionKeys || [];

  const historicalRatios = useMemo(() => {
    if (!financialHistory || !currentUser || !goals) return [];

    // Define the type for the object after it has been successfully filtered
    type ValidHistoricalRatio = { age: number; ratios: Ratios };

    return financialHistory
        .map(snapshot => {
            if (!snapshot.snapshot_data || !snapshot.snapshot_date) return null;

            const yearsAgo = (new Date().getTime() - new Date(snapshot.snapshot_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            const ageAtSnapshot = (currentUser.age || 0) - yearsAgo;

            const userAtSnapshotTime: UserProfile = { ...currentUser, age: ageAtSnapshot };
            const snapshotMetricsData = calculateAllFinancialMetrics(snapshot.snapshot_data, userAtSnapshotTime, goals);

            return {
                age: ageAtSnapshot,
                ratios: snapshotMetricsData?.metrics.healthRatios || null
            };
        })
        .filter((m): m is ValidHistoricalRatio => m !== null && m.ratios !== null);
  }, [financialHistory, currentUser, goals]);


  if (!isSupabaseConfigured) {
      return <SupabaseConfigError />;
  }

  if (isLoading) {
    return <div className="container" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }
  
  if (!currentUser) {
    return <Auth onLoginSuccess={loadUserAndData} />;
  }
  
  if (currentUser.is_advisor) {
    return <AdvisorDashboard advisor={currentUser} onLogout={handleLogout} />;
  }
  
  if (!currentUser.persona) {
    return <PersonaQuiz user={currentUser} onQuizComplete={handleQuizComplete} />;
  }
  
  const hasCompleted = (source: keyof typeof REWARD_POINTS) => !!(currentUser.points_source as any)?.[source];
  const lastSharedDate = currentUser.report_shared_at ? new Date(currentUser.report_shared_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : null;

  return (
    <div className="container">
      <header className="header">
        <Logo />
        <div className="header-actions">
            <div className="points-display">
                ✨ {currentUser.points}
                {(currentUser.locked_points || 0) > 0 && <span className="locked-points"> (+{currentUser.locked_points} 🔒)</span>}
            </div>
            <button className="profile-button" onClick={() => setIsProfileOpen(!isProfileOpen)}><ProfileIcon /></button>
        </div>
        {isProfileOpen && (
            <div className="profile-dropdown">
                <div className="profile-dropdown-item"><span>Name</span><strong>{currentUser.name}</strong></div>
                <div className="profile-dropdown-item"><span>Phone</span><strong>{currentUser.phone_number}</strong></div>
                <div className="profile-dropdown-item"><span>Persona</span><strong>{currentUser.persona}</strong></div>
                <div className="profile-dropdown-item"><span>Client ID</span><strong>{currentUser.client_id}</strong></div>
                <div className="profile-dropdown-item"><span>App Version</span><strong>{APP_VERSION}</strong></div>
                <div className="profile-dropdown-divider"></div>
                {profileMessage && <div className={`profile-message ${profileMessage.type}`}>{profileMessage.text}</div>}
                 {linkedAdvisor ? (
                    <>
                        <div className="profile-dropdown-item"><span>Advisor</span><strong>{linkedAdvisor.name || 'Your Advisor'}</strong></div>
                        <div className="profile-dropdown-item advisor-code-item">
                            <span>Advisor Code</span>
                            <div className="advisor-code-display">
                                <strong>{linkedAdvisor.advisor_code}</strong>
                                <button className="remove-advisor-btn" onClick={() => setIsRemoveAdvisorModalOpen(true)}>Remove</button>
                            </div>
                        </div>
                    </>
                ) : (
                     <div className="advisor-link-section">
                        <label htmlFor="advisor-code">Link to Advisor</label>
                        <div className="advisor-input-group">
                            <input
                                id="advisor-code"
                                type="text"
                                placeholder="Enter Advisor Code"
                                value={advisorCodeInput}
                                onChange={(e) => setAdvisorCodeInput(e.target.value.toUpperCase())}
                            />
                            <button onClick={handleLinkAdvisor} disabled={!advisorCodeInput}>Link</button>
                        </div>
                    </div>
                )}
                <button className="logout-button" onClick={handleLogout}>Logout</button>
            </div>
        )}
      </header>

      <main>
        {activeView === 'dashboard' && financials && goals && metrics && (
             <>
                {isFinancialHealthTimelineOpen && currentUser && historicalRatios ? (
                    <FinancialHealthTimeline historicalRatios={historicalRatios} onBack={() => setIsFinancialHealthTimelineOpen(false)} />
                ) : isNetWorthTimelineOpen && currentUser && metrics && financialHistory ? (
                    <NetWorthTimeline user={currentUser} metrics={metrics} financialHistory={financialHistory} onBack={() => setIsNetWorthTimelineOpen(false)} />
                ) : (
                    <div className="dashboard-grid">
                        {isNetWorthOpen ? (
                            <NetWorthCalculator data={{ assets: financials.assets, liabilities: financials.liabilities }} onUpdate={(d) => setFinancials(f => ({...f!, ...d}))} onClose={(e) => handleSaveAndCloseCalculators('netWorth', e.currentTarget)} />
                        ) : (
                            <div
                                className={`card summary-card ${hasCompleted('netWorth') ? 'clickable-card' : ''}`}
                                role="button"
                                tabIndex={hasCompleted('netWorth') ? 0 : -1}
                                onClick={() => hasCompleted('netWorth') && setIsNetWorthTimelineOpen(true)}
                                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && hasCompleted('netWorth')) setIsNetWorthTimelineOpen(true); }}
                            >
                                <div className="summary-card-header">
                                    <div className="summary-card-title-group">
                                        <h2>Net Worth</h2>
                                        {!hasCompleted('netWorth') && <div className="potential-points">✨ {REWARD_POINTS.netWorth} Points</div>}
                                    </div>
                                    <button className="update-button" onClick={(e) => { e.stopPropagation(); setIsNetWorthOpen(true); }}>
                                        {hasCompleted('netWorth') ? 'Update' : 'Calculate'}
                                    </button>
                                </div>
                                {hasCompleted('netWorth') ? <p className="summary-value">{formatCurrency(metrics.netWorth || 0)}</p> : <div className="summary-placeholder"><p>Calculate to see your financial snapshot.</p></div>}
                            </div>
                        )}
                        
                        {isMonthlyFinancesOpen ? (
                            <MonthlyFinances data={{ income: financials.income, expenses: financials.expenses }} onUpdate={(d) => setFinancials(f => ({...f!, ...d}))} onClose={(e) => handleSaveAndCloseCalculators('monthlyFinances', e.currentTarget)} />
                        ) : (
                            <MonthlyCashflowCard
                                expenses={financials.expenses}
                                monthlyIncome={metrics.monthlyIncome}
                                monthlyExpenses={metrics.monthlyExpenses}
                                monthlySavings={metrics.monthlySavings}
                                totalMonthlyIncome_MonthlyItems={metrics.totalMonthlyIncome_MonthlyItems}
                                totalAnnualIncome_AnnualItems={metrics.totalAnnualIncome_AnnualItems}
                                totalMonthlyExpenses_MonthlyItems={metrics.totalMonthlyExpenses_MonthlyItems}
                                totalAnnualExpenses_AnnualItems={metrics.totalAnnualExpenses_AnnualItems}
                                onToggle={() => setIsMonthlyFinancesOpen(true)}
                                isCompleted={hasCompleted('monthlyFinances')}
                                potentialPoints={REWARD_POINTS.monthlyFinances}
                            />
                        )}
                        
                        <FinancialHealthCard ratios={metrics.healthRatios} isClickable={hasCompleted('netWorth') && hasCompleted('monthlyFinances')} onClick={() => hasCompleted('netWorth') && hasCompleted('monthlyFinances') && setIsFinancialHealthTimelineOpen(true)} />

                        <FinancialProtectionCard financials={financials} protectionScores={metrics.protectionScores} onUpdate={(d: Insurance) => setFinancials(f => ({...f!, insurance: d}))} isOpen={isProtectionOpen} onToggle={(e) => handleProtectionToggle(e.currentTarget)} isCompleted={hasCompleted('financialProtection')} potentialPoints={REWARD_POINTS.financialProtection} />

                        <PowerOfSavingCard />
                        
                        <FinancialGoalsCard user={currentUser} goals={goals} goalCoverageRatios={metrics.goalCoverageRatios} onAddGoal={handleAddGoal} onRemoveGoal={handleRemoveGoal} isOpen={isGoalsOpen} onToggle={(e) => handleGoalsToggle(e.currentTarget)} isCompleted={hasCompleted('financialGoals')} potentialPoints={REWARD_POINTS.financialGoals} />

                        <RetirementTracker retirementReadiness={metrics.retirementReadiness} />

                        <InvestmentAllocation assets={financials.assets} />

                    </div>
                )}
            </>
        )}
        {activeView === 'plan' && (
            <MyPlan
                metrics={metrics}
                user={currentUser}
                userActions={userActions}
                triggeredActionKeys={triggeredActionKeys}
                onStartAction={handleStartAction}
                onCompleteAction={handleCompleteAction}
            />
        )}
      </main>
      
      {pointsAnimation && <div key={pointsAnimation.key} className="points-toast" style={{ left: `${pointsAnimation.x}px`, top: `${pointsAnimation.y}px` }}>+ {pointsAnimation.amount} ✨</div>}
      
       {activeView === 'dashboard' && (
          <button 
              className="fab" 
              onClick={() => setIsShareModalOpen(true)}
              title={lastSharedDate ? `Last shared on ${lastSharedDate}` : "Share report with advisor"}
              aria-label="Share report with advisor"
          >
              <ShareIcon />
          </button>
      )}

      {isShareModalOpen && (
          <div className="modal-overlay" onClick={() => setIsShareModalOpen(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '400px', textAlign: 'center'}}>
                  <div className="modal-header">
                      <h2>Share Report</h2>
                       <button className="modal-close-button" onClick={() => setIsShareModalOpen(false)} aria-label="Close modal">
                          <CloseIcon />
                      </button>
                  </div>
                  <div className="modal-body">
                      <p>By proceeding, you agree to share a summary of your financial planning data with your linked financial advisor, <strong>{linkedAdvisor?.name || 'your advisor'}</strong>.</p>
                  </div>
                  <div className="share-modal-footer">
                      <button className="action-button-secondary" onClick={() => setIsShareModalOpen(false)}>Cancel</button>
                      <button className="action-button-primary" onClick={handleShareReport}>Confirm & Share</button>
                  </div>
              </div>
          </div>
      )}

      {isRemoveAdvisorModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRemoveAdvisorModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '400px', textAlign: 'center'}}>
                <div className="modal-header">
                    <h2>Remove Advisor</h2>
                    <button className="modal-close-button" onClick={() => setIsRemoveAdvisorModalOpen(false)} aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>
                <div className="modal-body">
                    <p>Are you sure you want to remove <strong>{linkedAdvisor?.name || 'your advisor'}</strong>? This will revoke their access to your financial reports.</p>
                </div>
                <div className="share-modal-footer">
                    <button className="action-button-secondary" onClick={() => setIsRemoveAdvisorModalOpen(false)}>Cancel</button>
                    <button className="action-button-primary" style={{backgroundColor: 'var(--red)'}} onClick={handleRemoveAdvisor}>Confirm & Remove</button>
                </div>
            </div>
        </div>
      )}

      <nav className="bottom-nav">
          <div className="bottom-nav-content">
              <button className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}><HomeIcon /><span>Home</span></button>
              <button className={`nav-item ${activeView === 'plan' ? 'active' : ''}`} onClick={() => setActiveView('plan')}><PlanIcon /><span>My Moves</span></button>
          </div>
      </nav>
    </div>
  );
};

export default App;