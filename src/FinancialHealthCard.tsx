import React, { useMemo } from 'react';
import { type Assets, type Liabilities, type Income, type Expenses } from './db';

interface FinancialHealthCardProps {
  netWorthData: { assets: Assets; liabilities: Liabilities };
  monthlyFinancesData: { income: Income; expenses: Expenses };
}

type RagStatus = 'green' | 'amber' | 'red' | 'neutral';

const RagSmiley = ({ status }: { status: RagStatus }) => {
    const commonProps = {
        width: "20",
        height: "20",
        viewBox: "0 0 24 24",
        fill: "none",
        strokeWidth: "2",
        strokeLinecap: "round" as "round",
        strokeLinejoin: "round" as "round",
        className: "rag-smiley"
    };

    const eyeProps = {
        strokeWidth: "2.5",
    };

    switch (status) {
        case 'green':
            return (
                <svg {...commonProps} stroke="var(--green)" aria-label="Happy face indicator">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 13 C9.5 15, 14.5 15, 16 13" />
                    <line x1="9" y1="9" x2="9.01" y2="9" {...eyeProps} />
                    <line x1="15" y1="9" x2="15.01" y2="9" {...eyeProps} />
                </svg>
            );
        case 'amber':
            return (
                <svg {...commonProps} stroke="var(--amber)" aria-label="Neutral face indicator">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="8" y1="13" x2="16" y2="13" />
                    <line x1="9" y1="9" x2="9.01" y2="9" {...eyeProps} />
                    <line x1="15" y1="9" x2="15.01" y2="9" {...eyeProps} />
                </svg>
            );
        case 'red':
            return (
                <svg {...commonProps} stroke="var(--red)" aria-label="Sad face indicator">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14 C9.5 12, 14.5 12, 16 14" />
                    <line x1="9" y1="9" x2="9.01" y2="9" {...eyeProps} />
                    <line x1="15" y1="9" x2="15.01" y2="9" {...eyeProps} />
                </svg>
            );
        case 'neutral':
             return (
                <svg {...commonProps} stroke="var(--text-color-light)" aria-label="Neutral indicator">
                    <circle cx="12" cy="12" r="10" />
                </svg>
            );
    }
};

interface Ratio {
  name: string;
  value: string;
  status: RagStatus;
  description: string;
}

const getRagStatus = (value: number, green: number, amber: number): RagStatus => {
  if (value >= green) return 'green';
  if (value >= amber) return 'amber';
  return 'red';
};
const getRagStatusReversed = (value: number, green: number, amber: number): RagStatus => {
  if (value <= green) return 'green';
  if (value <= amber) return 'amber';
  return 'red';
};

const FinancialHealthCard: React.FC<FinancialHealthCardProps> = ({ netWorthData, monthlyFinancesData }) => {
  const ratios = useMemo<Ratio[]>(() => {
    const totalAssets = Object.values(netWorthData?.assets || {}).reduce((a, b) => a + b, 0);
    const totalLiabilities = Object.values(netWorthData?.liabilities || {}).reduce((a, b) => a + b, 0);
    
    const monthlyIncome = Object.values(monthlyFinancesData?.income || {}).reduce((sum, item) => {
      if (!item) return sum;
      return sum + (item.frequency === 'monthly' ? item.value : item.value / 12);
    }, 0);
    const monthlyExpenses = Object.values(monthlyFinancesData?.expenses || {}).reduce((sum, item) => {
        if (!item) return sum;
        return sum + (item.frequency === 'monthly' ? item.value : item.value / 12);
    }, 0);

    const monthlySavings = monthlyIncome - monthlyExpenses;
    const netWorth = totalAssets - totalLiabilities;
    
    const investableAssetKeys: (keyof Assets)[] = [
        'stocks', 'mutualFunds', 'crypto', 'nps', 'ppf', 'pf', 'sukanyaSamriddhi', 
        'cashInHand', 'savingsAccount', 'recurringDeposit', 'fixedDeposit'
    ];
    const financialAssets = investableAssetKeys.reduce((sum, key) => sum + (netWorthData?.assets[key] || 0), 0);
    const liquidAssets = (netWorthData?.assets?.cashInHand || 0) + (netWorthData?.assets?.savingsAccount || 0);

    const annualIncome = monthlyIncome * 12;

    const savingsRatio = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
    const financialAssetRatio = totalAssets > 0 ? (financialAssets / totalAssets) * 100 : 0;
    const liquidityRatio = monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 0; // Months of expenses covered
    const leverageRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;

    const emi = monthlyFinancesData?.expenses?.emi;
    const monthlyEmi = emi ? (emi.frequency === 'monthly' ? emi.value : emi.value / 12) : 0;
    const debtToIncomeRatio = monthlyIncome > 0 ? (monthlyEmi / monthlyIncome) * 100 : 0;
    
    const wealthRatio = annualIncome > 0 ? (netWorth / annualIncome) * 100 : 0;

    return [
      { name: 'Savings Ratio', value: `${savingsRatio.toFixed(0)}%`, status: getRagStatus(savingsRatio, 20, 10), description: '% of income saved monthly. Ideal: > 20%' },
      { name: 'Financial Asset Ratio', value: `${financialAssetRatio.toFixed(0)}%`, status: getRagStatus(financialAssetRatio, 50, 25), description: '% of assets in financial investments. Ideal: > 50%' },
      { name: 'Liquidity Ratio', value: `${liquidityRatio.toFixed(1)} months`, status: getRagStatus(liquidityRatio, 6, 3), description: 'Months of expenses covered by liquid assets. Ideal: 3-6 months' },
      { name: 'Leverage Ratio', value: `${leverageRatio.toFixed(0)}%`, status: getRagStatusReversed(leverageRatio, 30, 50), description: '% of assets funded by debt. Ideal: < 30%' },
      { name: 'Debt to Income Ratio', value: `${debtToIncomeRatio.toFixed(0)}%`, status: getRagStatusReversed(debtToIncomeRatio, 36, 43), description: '% of income going to EMI payments. Ideal: < 36%' },
      { name: 'Wealth Ratio', value: `${wealthRatio.toFixed(0)}%`, status: getRagStatus(wealthRatio, 200, 100), description: 'Net worth as a % of annual income. Ideal: > 200%' },
    ];
  }, [netWorthData, monthlyFinancesData]);

  return (
    <div className="card financial-health-card">
      <h2>Financial Health</h2>
      <div className="health-ratios-grid">
        {ratios.map(({ name, value, status, description }) => (
          <div className="ratio-item" key={name}>
            <RagSmiley status={status} />
            <div className="ratio-info">
              <h3>{name}</h3>
              <p className="ratio-value">{value}</p>
              <p className="ratio-description">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinancialHealthCard;
