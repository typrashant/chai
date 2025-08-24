import React, { useMemo } from 'react';
import { type Assets } from './db';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const formatInLakhs = (value: number) => {
    if (value >= 100000) {
        const lakhs = value / 100000;
        const formatted = lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1);
        return `₹${formatted}L`;
    }
    return formatCurrency(value);
};

const investmentCategories = {
  equity: ['stocks', 'mutualFunds', 'crypto'],
  debt: ['nps', 'ppf', 'pf', 'sukanyaSamriddhi', 'cashInHand', 'savingsAccount', 'recurringDeposit', 'fixedDeposit'],
  
  longTerm: ['stocks', 'nps', 'ppf', 'pf', 'sukanyaSamriddhi'],
  mediumTerm: ['mutualFunds'],
  shortTerm: ['crypto', 'cashInHand', 'savingsAccount', 'recurringDeposit', 'fixedDeposit'],
  
  growth: ['stocks', 'mutualFunds', 'crypto'],
  savings: ['nps', 'ppf', 'pf', 'sukanyaSamriddhi', 'cashInHand', 'savingsAccount', 'recurringDeposit', 'fixedDeposit'],
};

const investmentLabels: { [K in keyof Assets]?: string } = {
  stocks: 'Stocks',
  mutualFunds: 'Mutual Funds',
  crypto: 'Crypto',
  nps: 'NPS',
  ppf: 'PPF',
  pf: 'PF',
  sukanyaSamriddhi: 'SSY',
  cashInHand: 'Cash',
  savingsAccount: 'Savings A/C',
  fixedDeposit: 'Fixed Deposit',
  recurringDeposit: 'RD',
};

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

const AnalyticsBar = ({ title, segments }: { title: string, segments: { label: string, value: number, color: string }[] }) => {
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    if (total === 0) return null;

    return (
        <div className="analytics-section">
            <h3>{title}</h3>
            <div className="analytics-bar">
                {segments.map(s => (
                    <div key={s.label} className="analytics-bar-segment" style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}>
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

const InvestmentAllocation: React.FC<{ assets: Assets }> = ({ assets }) => {
  const { total, allocations, analytics } = useMemo(() => {
    const investmentAssets = Object.entries(assets).filter(([key]) => investmentLabels[key as keyof Assets]);
    const total = investmentAssets.reduce((sum, [, value]) => sum + value, 0);

    if (total === 0) {
      return { total: 0, allocations: [], analytics: null };
    }
    
    const colors = ['#38BDF8', '#A78BFA', '#F472B6', '#4ADE80', '#FDE047', '#FB923C', '#2DD4BF', '#F43F5E'];
    let colorIndex = 0;

    const allocations = investmentAssets
      .map(([key, value]) => ({
        label: investmentLabels[key as keyof Assets]!,
        value,
        percentage: (value / total) * 100,
        color: colors[colorIndex++ % colors.length]
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
      
    const analytics = {
        riskProfile: [
            { label: 'Equity', value: investmentCategories.equity.reduce((sum, key) => sum + (assets[key as keyof Assets] || 0), 0), color: '#4ADE80' },
            { label: 'Debt', value: investmentCategories.debt.reduce((sum, key) => sum + (assets[key as keyof Assets] || 0), 0), color: '#60A5FA' },
        ],
        horizon: [
            { label: 'Long-Term', value: investmentCategories.longTerm.reduce((sum, key) => sum + (assets[key as keyof Assets] || 0), 0), color: '#A78BFA' },
            { label: 'Medium-Term', value: investmentCategories.mediumTerm.reduce((sum, key) => sum + (assets[key as keyof Assets] || 0), 0), color: '#F472B6' },
            { label: 'Short-Term', value: investmentCategories.shortTerm.reduce((sum, key) => sum + (assets[key as keyof Assets] || 0), 0), color: '#FBBF24' },
        ],
        purpose: [
            { label: 'Growth', value: investmentCategories.growth.reduce((sum, key) => sum + (assets[key as keyof Assets] || 0), 0), color: '#2DD4BF' },
            { label: 'Savings', value: investmentCategories.savings.reduce((sum, key) => sum + (assets[key as keyof Assets] || 0), 0), color: '#818CF8' },
        ]
    }

    return { total, allocations, analytics };
  }, [assets]);
  
  return (
    <div className="card investment-allocation">
      <h2>Investment Allocation</h2>
      <div className="card-content">
        {total > 0 && analytics ? (
          <>
            <div className="chart-with-legend">
                <DonutChart data={allocations}>
                    <tspan x="50" className="donut-center-value">{formatInLakhs(total)}</tspan>
                </DonutChart>
                <ul className="chart-legend">
                    {allocations.map(item => (
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
            <div className="portfolio-analytics">
                <AnalyticsBar title="Debt vs. Equity" segments={analytics.riskProfile} />
                <AnalyticsBar title="Investment Horizon" segments={analytics.horizon} />
                <AnalyticsBar title="Asset Purpose" segments={analytics.purpose} />
            </div>
          </>
        ) : (
          <p style={{ color: '#666', textAlign: 'center', margin: 'auto' }}>No investment data entered yet.</p>
        )}
      </div>
    </div>
  );
};

export default InvestmentAllocation;
