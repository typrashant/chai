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
  
  // FIX: Cast `item` to `FinancialItem` to ensure type-safe access.
  const totalMonthlyIncome = useMemo(() => Object.values(income).reduce((sum, item) => {
      if (!item) return sum;
      const financialItem = item as FinancialItem;
      return sum + (financialItem.frequency === 'monthly' ? financialItem.value : financialItem.value / 12);
  }, 0), [income]);

  // FIX: Cast `item` to `FinancialItem` to ensure type-safe access.
  const totalMonthlyExpenses = useMemo(() => Object.values(expenses).reduce((sum, item) => {
      if (!item) return sum;
      const financialItem = item as FinancialItem;
      return sum + (financialItem.frequency === 'monthly' ? financialItem.value : financialItem.value / 12);
  }, 0), [expenses]);

  const monthlySavings = useMemo(() => totalMonthlyIncome - totalMonthlyExpenses, [totalMonthlyIncome, totalMonthlyExpenses]);

  return (
    <div className="card">
      <h2>Monthly Savings: <span className="total">{formatCurrency(monthlySavings)}</span></h2>
      <div className="calculator-sections-container">
        <section>
          <h3>Income</h3>
          {/* FIX: Refactored to use Object.entries for improved type safety and code clarity. */}
          {Object.entries(income).map(([key, item]) => {
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
          {/* FIX: Refactored to use Object.entries for improved type safety and code clarity. */}
           {Object.entries(expenses).map(([key, item]) => {
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