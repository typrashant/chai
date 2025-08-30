import React, { useMemo } from 'react';
import { type Financials } from './db';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

type RagStatus = 'green' | 'amber' | 'red';

const getRagStatus = (value: number, green: number, amber: number): RagStatus => {
  if (value >= green) return 'green';
  if (value >= amber) return 'amber';
  return 'red';
};

const getRagColor = (status: RagStatus) => {
    if (status === 'green') return 'var(--green)';
    if (status === 'amber') return 'var(--amber)';
    return 'var(--red)';
};

export const RetirementTracker = ({ financials, userAge }: { financials: Financials; userAge: number; }) => {
    const {
        readinessPercentage,
        investableAssets,
        retirementTarget,
        status,
    } = useMemo(() => {
        const annualExpenses = Object.values(financials.expenses).reduce((sum, item) => {
            if (!item) return sum;
            return sum + (item.frequency === 'monthly' ? item.value * 12 : item.value);
        }, 0);

        const retirementTarget = (100 - userAge) * annualExpenses;

        const assets = financials.assets;
        const investableAssets =
            (assets.stocks || 0) +
            (assets.mutualFunds || 0) +
            (assets.crypto || 0) +
            (assets.nps || 0) +
            (assets.ppf || 0) +
            (assets.pf || 0) +
            (assets.sukanyaSamriddhi || 0);

        const rawPercentage = retirementTarget > 0 ? (investableAssets / retirementTarget) * 100 : (investableAssets > 0 ? 100 : 0);
        const readinessPercentage = Math.min(rawPercentage, 100);

        const status = getRagStatus(readinessPercentage, 40, 20); // Green > 40%, Amber > 20%

        return { readinessPercentage, investableAssets, retirementTarget, status };
    }, [financials, userAge]);

    if (retirementTarget <= 0) {
        return (
            <div className="card retirement-tracker">
                <h2>Retirement Readiness</h2>
                <div className="summary-placeholder">
                    <p>Enter your expenses to calculate your retirement goal.</p>
                </div>
            </div>
        );
    }
    
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = `${(readinessPercentage / 100) * circumference} ${circumference}`;

    return (
        <div className="card retirement-tracker">
            <h2>Retirement Readiness</h2>
            <div className="retirement-gauge-container">
                <svg viewBox="0 0 100 100" className="donut-chart" role="img" aria-label={`Retirement readiness gauge at ${readinessPercentage.toFixed(0)}%`}>
                    <circle className="donut-background" cx="50" cy="50" r={radius}></circle>
                    <g className="donut-segment-group" transform="rotate(-90 50 50)">
                        <circle
                            className="donut-segment"
                            cx="50"
                            cy="50"
                            r={radius}
                            stroke={getRagColor(status)}
                            strokeDasharray={strokeDasharray}
                        ></circle>
                    </g>
                    <text x="50" y="50" className="donut-center-text">
                        <tspan x="50" className="donut-center-value">{readinessPercentage.toFixed(0)}%</tspan>
                    </text>
                </svg>
            </div>
            <div className="retirement-summary-details">
                <div className="retirement-detail-item">
                    <span>Current Savings</span>
                    <strong aria-label={`Current savings are ${formatCurrency(investableAssets)}`}>{formatCurrency(investableAssets)}</strong>
                </div>
                <div className="retirement-detail-item">
                    <span>Retirement Goal</span>
                    <strong aria-label={`Retirement goal is ${formatCurrency(retirementTarget)}`}>{formatCurrency(retirementTarget)}</strong>
                </div>
            </div>
        </div>
    );
};

export default RetirementTracker;