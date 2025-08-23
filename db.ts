export type Frequency = 'monthly' | 'annual';

export interface FinancialItem {
  value: number;
  frequency: Frequency;
}

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
    // Housing & Utilities
    rent: FinancialItem;
    emi: FinancialItem;
    utilities: FinancialItem;
    societyMaintenance: FinancialItem;
    propertyTax: FinancialItem;
    // Daily Living
    groceries: FinancialItem;
    transport: FinancialItem;
    // Personal & Family
    health: FinancialItem;
    education: FinancialItem;
    insurancePremiums: FinancialItem;
    clothing: FinancialItem;
    // Lifestyle
    diningOut: FinancialItem;
    entertainment: FinancialItem;
    subscriptions: FinancialItem;
    vacation: FinancialItem;
    // Other
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

export interface Goal {
    id: string;
    name: string;
    targetAge: number;
    value: number;
}

export interface User {
  clientID: string;
  name: string;
  phone: string;
  points: number;
  persona?: string;
  financials?: Financials;
  age?: number;
  gender?: string;
  profession?: 'Salaried' | 'Self-employed';
  goals: Goal[];
  dependents?: number;
  pointsSource?: {
      netWorth?: boolean;
      monthlyFinances?: boolean;
      financialProtection?: boolean;
      financialGoals?: boolean;
      personaQuiz?: boolean;
  }
}

// In-memory store that is cleared on page reload.
const users = new Map<string, User>();
let userCounter = 0;

const generateClientID = (): string => {
  userCounter++;
  const yearMonth = '2407'; // July 2024
  const sequence = String(userCounter).padStart(7, '0');
  return `IN${yearMonth}${sequence}`;
};

export const createUser = (name: string, phone: string): User | null => {
  if (Array.from(users.values()).some(user => user.phone === phone)) {
    return null; // User already exists in this session
  }

  const clientID = generateClientID();
  const newUser: User = { clientID, name, phone, points: 70, goals: [] };
  users.set(clientID, newUser);
  return newUser;
};

export const findUserByPhone = (phone: string): User | undefined => {
  return Array.from(users.values()).find(user => user.phone === phone);
};

export const findUserByClientID = (clientID: string): User | undefined => {
  return users.get(clientID);
};

export const updateUserFinancials = (clientID: string, financials: Financials): User | null => {
    const user = users.get(clientID);
    if (user) {
        const updatedUser = { ...user, financials };
        users.set(clientID, updatedUser);
        return updatedUser;
    }
    return null;
}

export const updateUserDemographics = (clientID: string, age: number, gender: string, dependents: number, profession: 'Salaried' | 'Self-employed'): User | null => {
    const user = users.get(clientID);
    if (user) {
        const updatedUser = { 
            ...user, 
            age, 
            gender,
            dependents,
            profession,
        };
        users.set(clientID, updatedUser);
        return updatedUser;
    }
    return null;
}

export const updateUserPersona = (clientID: string, persona: string): User | null => {
    const user = users.get(clientID);
    if (user) {
        const updatedUser = { 
            ...user, 
            persona
        };
        users.set(clientID, updatedUser);
        return updatedUser;
    }
    return null;
}

export const awardPoints = (clientID: string, source: string, points: number): User | null => {
    const user = users.get(clientID);
    if (user) {
        const pointsSource = user.pointsSource || {};
        if (pointsSource[source as keyof typeof pointsSource]) {
            return user; // Points already awarded for this source
        }

        const updatedUser = {
            ...user,
            points: user.points + points,
            pointsSource: { ...pointsSource, [source]: true }
        };
        users.set(clientID, updatedUser);
        return updatedUser;
    }
    return null;
}

export const addUserGoal = (clientID: string, goal: Goal): User | null => {
    const user = users.get(clientID);
    if (user) {
        const updatedGoals = [...user.goals, goal];
        const updatedUser = { ...user, goals: updatedGoals };
        users.set(clientID, updatedUser);
        return updatedUser;
    }
    return null;
}

export const removeUserGoal = (clientID: string, goalId: string): User | null => {
    const user = users.get(clientID);
    if (user) {
        const updatedGoals = user.goals.filter(g => g.id !== goalId);
        const updatedUser = { ...user, goals: updatedGoals };
        users.set(clientID, updatedUser);
        return updatedUser;
    }
    return null;
}