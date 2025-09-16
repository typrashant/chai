import React, { useMemo, useState } from 'react';
import { type Expenses, type FinancialItem } from './db.ts';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

// FIX: Made the `children` prop optional to resolve a TypeScript error where it was not being correctly inferred.
const DonutChart = ({ data, children }: { data: any[], children?: React.ReactNode }) => {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    let accumulatedPercentage = 0;
    
    return (
        <svg viewBox="0 0 100 100" className="donut-chart" role="img" aria-label="Expenses breakdown donut chart">
            <circle className="donut-background" cx="50" cy="50" r={radius}></circle>
            {data.map(item => {
                const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                const transform = `rotate(${(accumulatedPercentage / 100) * 360 - 90} 50 50)`;
                accumulatedPercentage += item.percentage;
                return (
                    <g key={item.label} className="donut-segment-group" transform={transform}>
                        <circle
                            className="donut-segment"
                            cx="50" cy="50" r={radius}
                            stroke={item.color}
                            strokeDasharray={strokeDasharray}
                        ><title>{`${item.label}: ${item.percentage.toFixed(0)}%`}</title></circle>
                    </g>
                );
            })}
            <text x="50" y="50" className="donut-center-text">
                {children}
            </text>
        </svg>
    )
}

const AnalyticsBar = ({ segments }: { segments: { label: string, value: number, color: string }[] }) => {
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    if (total === 0) return null;

    return (
        <div className="analytics-section" style={{marginBottom: '0.5rem'}}>
            <div className="analytics-bar">
                {segments.map(s => (
                    <div key={s.label} className="analytics-bar-segment" style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }} title={`${s.label}: ${formatCurrency(s.value)}`}>
                         { (s.value / total) * 100 > 15 ? `${((s.value / total) * 100).toFixed(0)}%` : ''}
                    </div>
                ))}
            </div>
            <div className="analytics-bar-legend">
                {segments.map(s => (
                    <div key={s.label} className="legend-item">
                        <span className="legend-color" style={{ backgroundColor: s.color }}></span>
                        <span>{s.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}


interface MonthlyCashflowCardProps {
  expenses: Expenses;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  totalMonthlyIncome_MonthlyItems: number;
  totalAnnualIncome_AnnualItems: number;
  totalMonthlyExpenses_MonthlyItems: number;
  totalAnnualExpenses_AnnualItems: number;
  onToggle: () => void;
  isCompleted: boolean;
  potentialPoints: number;
}

const needsKeys: (keyof Expenses)[] = ['rent', 'emi', 'utilities', 'societyMaintenance', 'propertyTax', 'groceries', 'transport', 'health', 'education', 'insurancePremiums'];
const wantsKeys: (keyof Expenses)[] = ['clothing', 'diningOut', 'entertainment', 'subscriptions', 'vacation', 'other'];

const MonthlyCashflowCard: React.FC<MonthlyCashflowCardProps> = ({ 
    expenses, 
    monthlyIncome, 
    monthlyExpenses, 
    monthlySavings, 
    totalMonthlyIncome_MonthlyItems,
    totalAnnualIncome_AnnualItems,
    totalMonthlyExpenses_MonthlyItems,
    totalAnnualExpenses_AnnualItems,
    onToggle, 
    isCompleted, 
    potentialPoints 
}) => {
    const [viewMode, setViewMode] = useState<'monthly' | 'annually'>('monthly');
    
    const { displayedIncome, displayedExpenses, displayedSavings } = useMemo(() => {
        let income = 0;
        let expenses = 0;
        if (viewMode === 'monthly') {
            income = totalMonthlyIncome_MonthlyItems;
            expenses = totalMonthlyExpenses_MonthlyItems;
        } else { // annually
            income = (totalMonthlyIncome_MonthlyItems * 12) + totalAnnualIncome_AnnualItems;
            expenses = (totalMonthlyExpenses_MonthlyItems * 12) + totalAnnualExpenses_AnnualItems;
        }
        const savings = income - expenses;
        return { displayedIncome: income, displayedExpenses: expenses, displayedSavings: savings };
    }, [viewMode, totalMonthlyIncome_MonthlyItems, totalAnnualIncome_AnnualItems, totalMonthlyExpenses_MonthlyItems, totalAnnualExpenses_AnnualItems]);


    const { needs, wants } = useMemo(() => {
        const calculateTotal = (keys: (keyof Expenses)[]) => {
            return keys.reduce((sum, key) => {
                const item = expenses[key] as FinancialItem;
                if (!item || item.value <= 0) return sum;
                
                let valueForView = 0;
                if (viewMode === 'monthly') {
                    if (item.frequency === 'monthly') {
                        valueForView = item.value;
                    }
                } else { // annually
                    valueForView = item.frequency === 'monthly' ? item.value * 12 : item.value;
                }
                return sum + valueForView;
            }, 0);
        };
        return {
            needs: calculateTotal(needsKeys),
            wants: calculateTotal(wantsKeys),
        };
    }, [expenses, viewMode]);
    
     const { expenseBreakdown, savingsRatio } = useMemo(() => {
        if (displayedExpenses <= 0) {
            return { expenseBreakdown: [], savingsRatio: 0 };
        }

        const colors = ['#38BDF8', '#A78BFA', '#F472B6', '#4ADE80', '#FDE047', '#FB923C', '#2DD4BF', '#F43F5E'];
        let colorIndex = 0;

        const expenseItems = Object.entries(expenses).map(([key, item]) => {
            const financialItem = item as FinancialItem;
            if (!financialItem || financialItem.value <= 0) return null;

            let valueForView = 0;
            if (viewMode === 'monthly') {
                if (financialItem.frequency === 'monthly') {
                    valueForView = financialItem.value;
                }
            } else { // annually
                valueForView = financialItem.frequency === 'monthly' ? financialItem.value * 12 : financialItem.value;
            }

            if (valueForView <= 0) return null;

            return {
                label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                value: valueForView,
            };
        }).filter((item): item is { label: string; value: number; } => item !== null);

        const breakdown = expenseItems
            .map(item => ({
                ...item,
                percentage: (item.value / displayedExpenses) * 100,
                color: colors[colorIndex++ % colors.length],
            }))
            .sort((a, b) => b.value - a.value);

        const calculatedSavingsRatio = displayedIncome > 0 ? (displayedSavings / displayedIncome) * 100 : 0;

        return { expenseBreakdown: breakdown, savingsRatio: calculatedSavingsRatio };
    }, [viewMode, expenses, displayedIncome, displayedExpenses, displayedSavings]);


    return (
        <div className="card summary-card">
            <div className="summary-card-header">
                <div className="summary-card-title-group">
                    <h2>Income & Expenses</h2>
                    {!isCompleted && <div className="potential-points">✨ {potentialPoints} Points</div>}
                </div>
                 <div className="summary-card-controls">
                    {isCompleted && (
                        <div className="view-toggle">
                            <button className={viewMode === 'monthly' ? 'active' : ''} onClick={() => setViewMode('monthly')}>Monthly</button>
                            <button className={viewMode === 'annually' ? 'active' : ''} onClick={() => setViewMode('annually')}>Annually</button>
                        </div>
                    )}
                    <button className="update-button" onClick={onToggle}>{isCompleted ? 'Update' : 'Calculate'}</button>
                </div>
            </div>

            {isCompleted ? (
                 <div className="cashflow-content">
                    <div className="cashflow-absolute-summary" style={{margin: '1rem 0'}}>
                        <div className="summary-item">
                            <span>Income</span>
                            <strong>{formatCurrency(displayedIncome)}</strong>
                        </div>
                        <div className="summary-item">
                            <span>Expenses</span>
                            <strong>{formatCurrency(displayedExpenses)}</strong>
                        </div>
                         <div className="summary-item">
                            <span>Savings</span>
                            <strong>{formatCurrency(displayedSavings)}</strong>
                        </div>
                    </div>
                    
                    <div className="needs-wants-summary">
                        {displayedExpenses > 0 && (
                            <>
                                <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center' }}>Top Expense Categories</h3>
                                <div className="chart-with-legend">
                                    <DonutChart data={expenseBreakdown}>
                                        <tspan x="50" dy="-0.4em" className="donut-center-value">{savingsRatio.toFixed(0)}%</tspan>
                                        <tspan x="50" dy="1.1em" className="donut-center-label">Saved</tspan>
                                    </DonutChart>
                                    <div className="chart-legend-container">
                                        <ul className="chart-legend">
                                            {expenseBreakdown.map(item => (
                                                <li key={item.label} className="legend-item">
                                                    <div className="legend-info">
                                                        <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                                                        <span>{item.label}</span>
                                                    </div>
                                                    <span className="legend-value">{item.percentage.toFixed(0)}%</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                
                                <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center' }}>Needs vs. Wants Breakdown</h3>
                                <AnalyticsBar segments={[
                                    { label: 'Needs', value: needs, color: '#A78BFA' },
                                    { label: 'Wants', value: wants, color: '#F472B6' },
                                ]} />
                            </>
                        )}
                    </div>
                 </div>
            ) : (
                <div className="summary-placeholder"><p>Track your income and expenses to see your cashflow.</p></div>
            )}
        </div>
    );
}
export default MonthlyCashflowCard;