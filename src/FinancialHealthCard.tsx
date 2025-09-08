import React from 'react';

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
  value: number;
  status: RagStatus;
}

interface Ratios {
  savingsRatio: Ratio;
  financialAssetRatio: Ratio;
  liquidityRatio: Ratio;
  leverageRatio: Ratio;
  debtToIncomeRatio: Ratio;
  wealthRatio: Ratio;
}

interface FinancialHealthCardProps {
  ratios: Ratios;
}


const ratioDetails: { [K in keyof Ratios]: { name: string; description: string; suffix: string } } = {
    savingsRatio: { name: 'Savings Ratio', description: '% of income saved monthly. Ideal: > 20%', suffix: '%' },
    financialAssetRatio: { name: 'Financial Asset Ratio', description: '% of assets in financial investments. Ideal: > 50%', suffix: '%' },
    liquidityRatio: { name: 'Liquidity Ratio', description: 'Months of expenses covered by liquid assets. Ideal: 3-6 months', suffix: ' months' },
    leverageRatio: { name: 'Leverage Ratio', description: '% of assets funded by debt. Ideal: < 30%', suffix: '%' },
    debtToIncomeRatio: { name: 'Debt to Income Ratio', description: '% of income going to EMI payments. Ideal: < 36%', suffix: '%' },
    wealthRatio: { name: 'Wealth Ratio', description: 'Net worth as a % of annual income. Ideal: > 200%', suffix: '%' },
};

const FinancialHealthCard: React.FC<FinancialHealthCardProps> = ({ ratios }) => {
  return (
    <div className="card financial-health-card">
      <h2>Financial Health</h2>
      <div className="health-ratios-grid">
        {(Object.keys(ratios) as Array<keyof Ratios>).map((key) => {
            const ratio = ratios[key];
            const details = ratioDetails[key];
            if (!details) return null;
            const displayValue = `${ratio.value.toFixed(key === 'liquidityRatio' ? 1 : 0)}${details.suffix}`;
            return (
              <div className="ratio-item" key={details.name}>
                <RagSmiley status={ratio.status} />
                <div className="ratio-info">
                  <h3>{details.name}</h3>
                  <p className="ratio-value">{displayValue}</p>
                  <p className="ratio-description">{details.description}</p>
                </div>
              </div>
            )
        })}
      </div>
    </div>
  );
};

export default FinancialHealthCard;
