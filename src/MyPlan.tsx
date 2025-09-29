
import React, { useState, useMemo } from 'react';
import { type UserProfile, type UserAction } from './db.ts';
import { WarningIcon } from './icons.tsx';
import ActionDetailModal from './ActionDetailModal';

interface MyPlanProps {
    metrics: any;
    user: UserProfile;
    userActions: UserAction[] | null;
    triggeredActionKeys: string[];
    onStartAction: (actionKey: string, targetDate: string) => void;
    onCompleteAction: (actionId: string) => void;
}

interface ActionCardProps {
    title: string;
    description: string;
    severity: 'high' | 'medium';
    icon: React.ReactNode;
    onStart: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ title, description, severity, icon, onStart }) => (
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

interface ActionCardInProgressProps {
    title: string;
    targetDate: string;
    onComplete: () => void;
}

const ActionCardInProgress: React.FC<ActionCardInProgressProps> = ({ title, targetDate, onComplete }) => {
    const formattedDate = new Date(targetDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    return (
        <div className="action-card in-progress">
            <div className="action-card-main-content">
                 <div className="action-card-icon severity-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <div className="action-card-content">
                    <h3>{title}</h3>
                    <p>Target Date: <strong>{formattedDate}</strong></p>
                </div>
            </div>
            <div className="action-card-buttons">
                <button className="action-button-primary" onClick={onComplete}>Mark as Complete</button>
            </div>
        </div>
    );
};


const MyPlan: React.FC<MyPlanProps> = ({ metrics, user, userActions, triggeredActionKeys, onStartAction, onCompleteAction }) => {
    const [selectedAction, setSelectedAction] = useState<string | null>(null);

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
    
    const actionMap: { [key: string]: Omit<ActionCardProps, 'onStart'> } = {
      'savingsRatio': { severity: "high", icon: <WarningIcon />, title: "Boost Your Savings Ratio", description: `Your savings ratio is ${healthRatios.savingsRatio.value.toFixed(0)}%, which is below the recommended 20%. Review your expenses or explore ways to increase your income to save more each month.` },
      'liquidityRatio': { severity: "high", icon: <WarningIcon />, title: "Build Your Emergency Fund", description: `You have ${healthRatios.liquidityRatio.value.toFixed(1)} months of expenses saved. Aim for at least 3-6 months in an easily accessible account to cover unexpected events.` },
      'debtToIncomeRatio': { severity: "high", icon: <WarningIcon />, title: "Reduce High-Interest Debt", description: `Your debt-to-income ratio is ${healthRatios.debtToIncomeRatio.value.toFixed(0)}%. Lenders prefer this to be under 36%. Focus on paying down high-interest loans.` },
      'leverageRatio': { severity: "high", icon: <WarningIcon />, title: "Manage Your Debt Levels", description: `Your leverage ratio is ${healthRatios.leverageRatio.value.toFixed(0)}%, indicating a high reliance on debt. Aim to bring this below 30% by paying down loans.` },
      'financialAssetRatio': { severity: "medium", icon: <WarningIcon />, title: "Grow Your Financial Assets", description: `Your financial assets make up ${healthRatios.financialAssetRatio.value.toFixed(0)}% of your total assets. Increase this to over 50% for better growth and liquidity.` },
      'wealthRatio': { severity: "medium", icon: <WarningIcon />, title: "Increase Your Net Worth", description: `Your wealth ratio is ${healthRatios.wealthRatio.value.toFixed(0)}%. Consistently investing will help you build wealth faster than your income grows.` },
      'protection-life': { severity: "high", icon: <WarningIcon />, title: "Review Your Life Insurance", description: `Your life insurance coverage is lower than the recommended 10x your annual income. Ensure your family is protected in case of an unforeseen event.` },
      'protection-health': { severity: "high", icon: <WarningIcon />, title: "Increase Health Coverage", description: "Your health coverage appears low. Medical emergencies can be expensive; ensure you have adequate cover for your family." },
      'goals-overall': { severity: "medium", icon: <WarningIcon />, title: "Align Investments with Goals", description: "Your current investments may not be sufficient to meet all your financial goals. Review your goal-based investment strategy." },
      'retirement': { severity: "medium", icon: <WarningIcon />, title: "Accelerate Retirement Savings", description: `You are ${retirementReadiness.readinessPercentage.toFixed(0)}% on track for retirement. Increase your contributions to retirement accounts like NPS or PPF.` },
      'asset-allocation-persona-aggressive': { severity: "medium", icon: <WarningIcon />, title: "Align Investments to Your Persona", description: `Your portfolio's equity exposure of ${equityAllocationPercentage.toFixed(0)}% seems high for a '${persona}' persona. Consider rebalancing towards more stable assets.` },
      'asset-allocation-persona-conservative': { severity: "medium", icon: <WarningIcon />, title: "Align Investments to Your Persona", description: `Your portfolio's equity exposure of ${equityAllocationPercentage.toFixed(0)}% is conservative for a '${persona}' persona. Consider adding more growth assets.` },
      'asset-allocation-age-aggressive': { severity: "medium", icon: <WarningIcon />, title: "Review Your Portfolio Risk", description: `Your portfolio's equity exposure of ${equityAllocationPercentage.toFixed(0)}% is higher than recommended for your age. Consider reducing risk as you get older.` },
      'asset-allocation-age-conservative': { severity: "medium", icon: <WarningIcon />, title: "Review Your Portfolio for Growth", description: `Your portfolio's equity exposure of ${equityAllocationPercentage.toFixed(0)}% may be too low for your age, potentially missing out on long-term growth.` },
    };

    const activeUserActions = useMemo(() => userActions?.filter(a => a.status === 'in_progress') || [], [userActions]);
    const completedUserActions = useMemo(() => userActions?.filter(a => a.status === 'completed') || [], [userActions]);
    const activeActionKeys = useMemo(() => activeUserActions.map(a => a.action_key), [activeUserActions]);

    const suggestedActions = triggeredActionKeys.filter(key => !activeActionKeys.includes(key) && actionMap[key]);
    
    return (
        <div className="my-plan-container">
            <h1>My Moves</h1>
            
            {suggestedActions.length === 0 && activeUserActions.length === 0 && (
                 <div className="summary-placeholder" style={{padding: '2rem'}}>
                    <p>Great job! You've addressed all the high-priority items on your financial plan.</p>
                </div>
            )}

            {activeUserActions.length > 0 && (
                <section className="plan-section">
                    <h2>In Progress</h2>
                    <div className="action-cards-grid">
                        {activeUserActions.map(action => (
                            <ActionCardInProgress
                                key={action.action_id}
                                title={actionMap[action.action_key]?.title || 'Action'}
                                targetDate={action.target_date}
                                onComplete={() => onCompleteAction(action.action_id)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {suggestedActions.length > 0 && (
                 <section className="plan-section">
                    <h2>Suggested Moves</h2>
                    <div className="action-cards-grid">
                        {suggestedActions.map(key => {
                            const actionProps = actionMap[key];
                            if (!actionProps) return null;
                            return (
                                <ActionCard 
                                    key={key}
                                    {...actionProps}
                                    onStart={() => setSelectedAction(key)}
                                />
                            );
                        })}
                    </div>
                 </section>
            )}

            {completedUserActions.length > 0 && (
                <section className="plan-section">
                    <h2>Completed Moves</h2>
                     <ul className="completed-actions-list">
                        {completedUserActions.map(action => (
                            <li key={action.action_id}>
                                ✓ {actionMap[action.action_key]?.title || 'Completed Action'} 
                                {action.completed_at && <span> ({new Date(action.completed_at).toLocaleDateString('en-IN')})</span>}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {selectedAction && (
                <ActionDetailModal 
                    actionKey={selectedAction} 
                    onClose={() => setSelectedAction(null)} 
                    onStartAction={onStartAction} 
                />
            )}
        </div>
    );
};

// FIX: Added default export for the MyPlan component to resolve the import error.
export default MyPlan;
