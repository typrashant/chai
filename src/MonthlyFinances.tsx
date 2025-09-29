import React, { useMemo } from 'react';
import { type Income, type Expenses, type Financials, type Frequency, type FinancialItem } from './db.ts';

interface MonthlyFinancesProps {
  data: { income: Income; expenses: Expenses };
  onUpdate: (updatedData: Partial<Financials>) => void;
  onClose: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const FrequencyToggle = ({ frequency, onChange }: { frequency: Frequency, onChange: (newFreq: Frequency) => void }) => (
    <div className="frequency-toggle">
        <button 
            className={frequency === 'monthly' ? 'active' : ''} 
            onClick={() => onChange('monthly')}
            aria-pressed={frequency === 'monthly'}
            title="Monthly"
        >
            M
        </button>
        <button 
            className={frequency === 'annual' ? 'active' : ''} 
            onClick={() => onChange('annual')}
            aria-pressed={frequency === 'annual'}
            title="Annually"
        >
            Y
        </button>
    </div>
);

const MonthlyFinances: React.FC<MonthlyFinancesProps> = ({ data, onUpdate, onClose }) => {
  const { income, expenses } = data;

  const handleUpdate = (category: 'income' | 'expenses', field: string, updatedItem: Partial<FinancialItem>) => {
    if (category === 'income') {
        const itemToUpdate = { ...income[field as keyof Income], ...updatedItem };
        const updatedIncome = { ...income, [field as keyof Income]: itemToUpdate };
        onUpdate({ income: updatedIncome });
    } else { // category === 'expenses'
        const itemToUpdate = { ...expenses[field as keyof Expenses], ...updatedItem };
        const updatedExpenses = { ...expenses, [field as keyof Expenses]: itemToUpdate };
        onUpdate({ expenses: updatedExpenses });
    }
  };
  
  // FIX: Use Object.keys for type-safe reduction to calculate total monthly income.
  const totalMonthlyIncome = useMemo(() => Object.keys(income).reduce((sum, key) => {
      const item = income[key as keyof Income];
      if (!item) return sum;
      return sum + (item.frequency === 'monthly' ? item.value : item.value / 12);
  }, 0), [income]);

  // FIX: Use Object.keys for type-safe reduction to calculate total monthly expenses.
  const totalMonthlyExpenses = useMemo(() => Object.keys(expenses).reduce((sum, key) => {
      const item = expenses[key as keyof Expenses];
      if (!item) return sum;
      return sum + (item.frequency === 'monthly' ? item.value : item.value / 12);
  }, 0), [expenses]);

  const monthlySavings = useMemo(() => totalMonthlyIncome - totalMonthlyExpenses, [totalMonthlyIncome, totalMonthlyExpenses]);

  return (
    <div className="card">
      <h2>Monthly Savings: <span className="total">{formatCurrency(monthlySavings)}</span></h2>
      <div className="calculator-sections-container">
        <section>
          <h3>Income</h3>
          {/* FIX: Use Object.entries for iterating, and cast item to FinancialItem for type safety. */}
          {Object.entries(income).map(([key, itemValue]) => {
            const item = itemValue as FinancialItem;
            const label = String(key).charAt(0).toUpperCase() + String(key).slice(1).replace(/([A-Z])/g, ' $1');
            return (
              <div key={key} className="form-group-with-frequency">
                <div className="form-group">
                  <label htmlFor={key}>{label}</label>
                  <input id={key} type="number" value={item.value || ''} onChange={(e) => handleUpdate('income', key, { value: Number(e.target.value) || 0 })} placeholder="₹0" />
                </div>
                <FrequencyToggle frequency={item.frequency} onChange={(newFreq) => handleUpdate('income', key, { frequency: newFreq })} />
              </div>
            );
          })}
        </section>
        <section>
          <h3>Expenses</h3>
          {/* FIX: Use Object.entries for iterating, and cast item to FinancialItem for type safety. */}
           {Object.entries(expenses).map(([key, itemValue]) => {
            const item = itemValue as FinancialItem;
            const label = String(key).charAt(0).toUpperCase() + String(key).slice(1).replace(/([A-Z])/g, ' $1');
             return (
              <div key={key} className="form-group-with-frequency">
                <div className="form-group">
                  <label htmlFor={key}>{label}</label>
                  <input id={key} type="number" value={item.value || ''} onChange={(e) => handleUpdate('expenses', key, { value: Number(e.target.value) || 0 })} placeholder="₹0" />
                </div>
                <FrequencyToggle frequency={item.frequency} onChange={(newFreq) => handleUpdate('expenses', key, { frequency: newFreq })} />
              </div>
            );
          })}
        </section>
      </div>
      <button className="done-button" onClick={onClose}>Done</button>
    </div>
  );
};

export default MonthlyFinances;