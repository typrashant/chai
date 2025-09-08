import React, { useState, useMemo } from 'react';
import { type UserProfile } from './db.ts';
import { WarningIcon } from './icons.tsx';
import ActionDetailModal from './ActionDetailModal.tsx';

interface MyPlanProps {
    metrics: any;
    user: UserProfile;
}

const ActionCard = ({ title, description, severity, icon, onStart }: { title: string; description: string; severity: 'high' | 'medium'; icon: React.ReactNode; onStart: () => void; }) => (
    <div className="action-card">
        <div className="action-card-main-content">
            <div className={`action-card-icon severity-${severity}`}>
                {icon}
            </div>
            <div className="action-card-content">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
        </div>
        <div className="action-card-buttons">
            <button className="action-button-secondary" onClick={() => alert('Coming soon: Connect with a certified financial planner!')}>Connect to an Expert</button>
            <button className="action-button-primary" onClick={onStart}>Start</button>
        </div>
    </div>
);


const MyPlan: React.FC<MyPlanProps> = ({ metrics, user }) => {
    const [selectedAction, setSelectedAction] = useState<string | null>(null);

    const age = useMemo(() => {
        if (!user.date_of_birth) return undefined;
        return new Date().getFullYear() - new Date(user.date_of_birth).getFullYear();
    }, [user.date_of_birth]);

    if (!metrics) {
        return (
            <div className="my-plan-container">
                <h1>My Moves</h1>
                <div className="summary-placeholder" style={{padding: '2rem'}}>
                    <p>Complete your Net Worth and Monthly Finances to generate your action plan.</p>
                </div>
            </div>
        );
    }
    
    const { persona } = user;
    const { healthRatios, protectionScores, goalCoverageRatios, retirementReadiness, equityAllocationPercentage } = metrics;
    const actionList: {key: string; priority: number}[] = [];

    // Prioritization Logic
    // 1. Financial Health (Reds)
    Object.entries(healthRatios).forEach(([key, ratio]: [string, any]) => {
        if (ratio.status === 'red') {
            actionList.push({ key, priority: 1 });
        }
    });

    // 2. Financial Health (Ambers)
    Object.entries(healthRatios).forEach(([key, ratio]: [string, any]) => {
        if (ratio.status === 'amber') {
            actionList.push({ key, priority: 2 });
        }
    });

    // 3. Financial Protection (Reds)
    Object.entries(protectionScores).forEach(([key, score]: [string, any]) => {
        if (score.status === 'red') {
            actionList.push({ key: `protection-${key}`, priority: 3 });
        }
    });

    // 4. Financial Goals (Reds)
    Object.entries(goalCoverageRatios).forEach(([key, ratio]: [string, any]) => {
        if (ratio.status === 'red') {
            actionList.push({ key: `goals-${key}`, priority: 4 });
        }
    });
    
    // 5. Retirement Readiness (Red or Amber)
    if (retirementReadiness.status !== 'green') {
        actionList.push({ key: 'retirement', priority: 5 });
    }

    // 6. Asset Allocation Anomalies
    const lowRiskPersonas = ['Guardian', 'Spender'];
    const highRiskPersonas = ['Adventurer', 'Accumulator'];
    const recommendedEquityByAge = Math.max(0, 110 - (age || 30)); 

    let allocationAnomalyDetected = false;
    if (persona && lowRiskPersonas.includes(persona) && equityAllocationPercentage > 40) {
        actionList.push({ key: 'asset-allocation-persona-aggressive', priority: 6 });
        allocationAnomalyDetected = true;
    } else if (persona && highRiskPersonas.includes(persona) && equityAllocationPercentage < 50) {
        actionList.push({ key: 'asset-allocation-persona-conservative', priority: 6 });
        allocationAnomalyDetected = true;
    }

    if (!allocationAnomalyDetected && age) {
        if (equityAllocationPercentage > recommendedEquityByAge + 15) {
            actionList.push({ key: 'asset-allocation-age-aggressive', priority: 6 });
        } else if (equityAllocationPercentage < recommendedEquityByAge - 15) {
            actionList.push({ key: 'asset-allocation-age-conservative', priority: 6 });
        }
    }

    const uniqueActions = Array.from(new Map(actionList.map(item => [item.key, item])).values());
    uniqueActions.sort((a, b) => a.priority - b.priority);
    
    const actionKeys = uniqueActions.map(a => a.key);

    const actionMap: { [key: string]: Omit<React.ComponentProps<typeof ActionCard>, 'onStart'> } = {
      'savingsRatio': { severity: "high", icon: <WarningIcon />, title: "Boost Your Savings Ratio", description: `Your savings ratio is ${healthRatios.savingsRatio.value.toFixed(0)}%, which is below the recommended 20%. Review your expenses or explore ways to increase your income to save more each month.` },
      'liquidityRatio': { severity: "high", icon: <WarningIcon />, title: "Build Your Emergency Fund", description: `You have ${healthRatios.liquidityRatio.value.toFixed(1)} months of expenses saved. Aim for at least 3-6 months in an easily accessible account to cover unexpected events.` },
      'debtToIncomeRatio': { severity: "high", icon: <WarningIcon />, title: "Reduce High-Interest Debt", description: `Your debt-to-income ratio is high at ${healthRatios.debtToIncomeRatio.value.toFixed(0)}%. Focus on paying down high-interest loans like credit cards or personal loans to free up your cash flow.` },
      'leverageRatio': { severity: "medium", icon: <WarningIcon />, title: "Manage Your Debt Levels", description: `Your leverage ratio is ${healthRatios.leverageRatio.value.toFixed(0)}%. A high ratio suggests a significant portion of your assets is financed by debt, which can be risky.`},
      'financialAssetRatio': { severity: "medium", icon: <WarningIcon />, title: "Grow Your Financial Assets", description: `Your financial assets make up ${healthRatios.financialAssetRatio.value.toFixed(0)}% of your total assets. Increasing this can lead to better wealth creation over time.`},
      'wealthRatio': { severity: "medium", icon: <WarningIcon />, title: "Increase Your Net Worth", description: `Your wealth ratio is ${healthRatios.wealthRatio.value.toFixed(0)}%. Focus on increasing your net worth relative to your income for stronger long-term financial security.`},
      'protection-health': { severity: "high", icon: <WarningIcon />, title: "Increase Health Insurance Coverage", description: `Medical emergencies can be costly. Consider increasing your health insurance to a minimum of ₹15 Lakhs to ensure you and your family are adequately protected.` },
      'protection-life': { severity: "medium", icon: <WarningIcon />, title: "Review Your Life Insurance", description: `Your life insurance coverage is lower than the recommended 10x your annual income. This is crucial for protecting your dependents' financial future.` },
      'goals-overall': { severity: "medium", icon: <WarningIcon />, title: "Align Investments with Goals", description: `Your current investments are not on track to meet your financial goals. Review your investment allocation to ensure it aligns with your short, medium, and long-term objectives.` },
      'goals-short': { severity: "high", icon: <WarningIcon />, title: "Fund Your Short-Term Goals", description: "You have a shortfall in funds for goals due within 2 years. Prioritize allocating liquid assets to avoid taking risks with near-term objectives." },
      'goals-medium': { severity: "medium", icon: <WarningIcon />, title: "Plan for Medium-Term Goals", description: "Your medium-term goals (2-5 years) are underfunded. Consider increasing your investments in balanced or hybrid funds to meet these targets." },
      'goals-long': { severity: "medium", icon: <WarningIcon />, title: "Boost Long-Term Goal Savings", description: "Your investments for long-term goals (> 5 years) are falling behind. A small increase in your monthly equity investments can make a big difference over time." },
      'retirement': { severity: "high", icon: <WarningIcon />, title: "Accelerate Your Retirement Savings", description: `Your retirement readiness is at ${retirementReadiness.readinessPercentage.toFixed(0)}%. Increasing your contributions to long-term retirement accounts is crucial.` },
      'asset-allocation-persona-aggressive': { severity: "medium", icon: <WarningIcon />, title: "Align Investments to Your Persona", description: "Your portfolio has a high equity exposure, which might not align with your cautious financial persona. Consider rebalancing towards more stable assets." },
      'asset-allocation-persona-conservative': { severity: "medium", icon: <WarningIcon />, title: "Align Investments to Your Persona", description: "Your portfolio is quite conservative for your risk-taking persona. You may be missing out on potential growth by not having enough exposure to equity." },
      'asset-allocation-age-aggressive': { severity: "medium", icon: <WarningIcon />, title: "Review Your Portfolio Risk for Your Age", description: `Your portfolio's equity exposure of ${equityAllocationPercentage.toFixed(0)}% is higher than recommended for your age. Rebalancing could help protect your capital.` },
      'asset-allocation-age-conservative': { severity: "medium", icon: <WarningIcon />, title: "Increase Growth Potential for Your Age", description: `Your portfolio's equity exposure of ${equityAllocationPercentage.toFixed(0)}% is low for your age. With a long time horizon, you could potentially take on more risk for higher growth.` },
    };

    return (
        <div className="my-plan-container">
            <h1>My Moves</h1>
            {actionKeys.length > 0 ? (
                actionKeys.map(key => {
                    const actionProps = actionMap[key];
                    if (!actionProps) return null;
                    return <ActionCard key={key} {...actionProps} onStart={() => setSelectedAction(key)} />;
                })
            ) : (
                <div className="action-card no-actions-card">
                    <div className="emoji" role="img" aria-label="Sparkles emoji">🎉</div>
                    <h3>All Clear!</h3>
                    <p>Your finances are in great shape and there are no immediate actions needed. Keep up the great work!</p>
                </div>
            )}
            {selectedAction && <ActionDetailModal actionKey={selectedAction} onClose={() => setSelectedAction(null)} />}
        </div>
    );
};

export default MyPlan;