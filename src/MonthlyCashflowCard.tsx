import React, { useMemo } from 'react';
import { type Expenses } from './db.ts';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const DonutChart = ({ data, children }: { data: any[], children: React.ReactNode }) => {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    let accumulatedPercentage = 0;
    
    return (
        <svg viewBox="0 0 100 100" className="donut-chart" role="img" aria-label="Investment allocation donut chart">
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

interface MonthlyCashflowCardProps {
  expenses: Expenses;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  onToggle: () => void;
  isCompleted: boolean;
  potentialPoints: number;
}

const MonthlyCashflowCard: React.FC<MonthlyCashflowCardProps> = ({ expenses, monthlyIncome, monthlyExpenses, monthlySavings, onToggle, isCompleted, potentialPoints }) => {
    const expenseBreakdown = useMemo(() => {
        const monthlyExpenseValues = Object.entries(expenses).map(([key, item]) => {
            const value = item.frequency === 'monthly' ? item.value : item.value / 12;
            const label = String(key).charAt(0).toUpperCase() + String(key).slice(1).replace(/([A-Z])/g, ' $1');
            return { label, value };
        }).filter(item => item.value > 0);

        if (monthlyExpenses === 0) return [];
        
        const colors = ['#38BDF8', '#A78BFA', '#F472B6', '#4ADE80', '#FDE047', '#FB923C', '#2DD4BF', '#F43F5E', '#818CF8', '#FB7185', '#34D399', '#FBBF24'];
        let colorIndex = 0;

        return monthlyExpenseValues
            .map(item => ({
                ...item,
                percentage: (item.value / monthlyExpenses) * 100,
                color: colors[colorIndex++ % colors.length]
            }))
            .sort((a, b) => b.value - a.value);

    }, [expenses, monthlyExpenses]);
    
    const savingsRatio = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

    return (
        <div className="card summary-card">
            <div className="summary-card-header">
                <div className="summary-card-title-group">
                    <h2>Monthly Cashflow</h2>
                    {!isCompleted && <div className="potential-points">✨ {potentialPoints} Points</div>}
                </div>
                <button className="update-button" onClick={onToggle}>{isCompleted ? 'Update' : 'Calculate'}</button>
            </div>
            {isCompleted && monthlyExpenses > 0 ? (
                 <div className="chart-with-legend" style={{marginTop: '1rem'}}>
                     <DonutChart data={expenseBreakdown}>
                        <tspan x="50" dy="-0.5em" className="donut-center-value">{savingsRatio.toFixed(0)}%</tspan>
                        <tspan x="50" dy="1.1em" style={{fontSize: '8px', fill: 'var(--text-color-light)'}}>Savings Rate</tspan>
                     </DonutChart>
                     <div className="chart-legend-container">
                        <ul className="chart-legend">
                            {expenseBreakdown.slice(0, 5).map(item => ( // Show top 5
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
            ) : isCompleted ? (
                 <div className="cashflow-absolute-summary" style={{margin: 'auto 0'}}>
                    <div className="summary-item">
                        <span>Income</span>
                        <strong>{formatCurrency(monthlyIncome || 0)}</strong>
                    </div>
                    <div className="summary-item">
                        <span>Expenses</span>
                        <strong>{formatCurrency(monthlyExpenses || 0)}</strong>
                    </div>
                     <div className="summary-item">
                        <span>Savings</span>
                        <strong>{formatCurrency(monthlySavings || 0)}</strong>
                    </div>
                </div>
            ) : (
                <div className="summary-placeholder"><p>Track your income and expenses to see your cashflow.</p></div>
            )}
        </div>
    );
}
export default MonthlyCashflowCard;
