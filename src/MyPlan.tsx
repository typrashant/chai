
import React, { useState, useMemo } from 'react';
import { type UserProfile, type UserAction } from './db.ts';
import { WarningIcon } from './icons.tsx';
import ActionDetailModal from './ActionDetailModal.tsx';

interface MyPlanProps {
    metrics: any;
    user: UserProfile;
    userActions: UserAction[] | null;
    onStartAction: (actionKey: string, targetDate: string) => void;
    onCompleteAction: (actionId: string) => void;
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

const ActionCardInProgress = ({ title, targetDate, onComplete }: { title: string; targetDate: string; onComplete: () => void; }) => {
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


const MyPlan: React.FC<MyPlanProps> = ({ metrics, user, userActions, onStartAction, onCompleteAction }) => {
    const [selectedAction, setSelectedAction] = useState<string | null>(null);

    const age = useMemo(() => {
        if (!user.age) return undefined;
        return user.age;
    }, [user.age]);

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
      'goals-long': { severity: "medium", icon: <WarningIcon />, title: "Boost Long-Term Goal Savings", description: "To meet your long-term goals (> 5 years), ensure you're investing consistently in growth assets like equities or diversified mutual funds." },
      'retirement': { severity: "high", icon: <WarningIcon />, title: "Accelerate Retirement Savings", description: `Your retirement savings are behind schedule. Consider increasing your contributions to NPS, PPF, or equity mutual funds to build a sufficient corpus.` },
      'asset-allocation-persona-aggressive': { severity: "medium", icon: <WarningIcon />, title: "Align Investments to Your Persona", description: `As a ${persona}, your portfolio has a high equity allocation (${equityAllocationPercentage.toFixed(0)}%), which may be riskier than you're comfortable with. Consider balancing with debt instruments.` },
      'asset-allocation-persona-conservative': { severity: "medium", icon: <WarningIcon />, title: "Align Investments to Your Persona", description: `As a ${persona}, your portfolio has a low equity allocation (${equityAllocationPercentage.toFixed(0)}%). You might be missing out on growth opportunities. Consider adding more equity.` },
      'asset-allocation-age-aggressive': { severity: "medium", icon: <WarningIcon />, title: "Review Your Portfolio Risk", description: `Your equity exposure is ${equityAllocationPercentage.toFixed(0)}%, which is high for your age. While growth is important, consider rebalancing to protect your gains.` },
      'asset-allocation-age-conservative': { severity: "medium", icon: <WarningIcon />, title: "Review Your Portfolio for Growth", description: `Your equity exposure is ${equityAllocationPercentage.toFixed(0)}%, which is conservative for your age. You have a long time horizon to benefit from market growth.` },
    };

    const { actionKeys, inProgressActions, todoActionKeys } = useMemo(() => {
        const actionList: {key: string; priority: number}[] = [];
        if (healthRatios) {
            Object.entries(healthRatios).forEach(([key, ratio]: [string, any]) => { if (ratio.status === 'red') actionList.push({ key, priority: 1 }); });
            Object.entries(healthRatios).forEach(([key, ratio]: [string, any]) => { if (ratio.status === 'amber') actionList.push({ key, priority: 2 }); });
        }
        if (protectionScores) Object.entries(protectionScores).forEach(([key, score]: [string, any]) => { if (score.status === 'red') actionList.push({ key: `protection-${key}`, priority: 3 }); });
        if (goalCoverageRatios) Object.entries(goalCoverageRatios).forEach(([key, ratio]: [string, any]) => { if (ratio.status === 'red') actionList.push({ key: `goals-${key}`, priority: 4 }); });
        if (retirementReadiness && retirementReadiness.status !== 'green') actionList.push({ key: 'retirement', priority: 5 });
        
        const lowRiskPersonas = ['Guardian', 'Spender'], highRiskPersonas = ['Adventurer', 'Accumulator'];
        const recommendedEquityByAge = Math.max(0, 110 - (age || 30));
        let allocationAnomalyDetected = false;
        if (persona && lowRiskPersonas.includes(persona) && equityAllocationPercentage > 40) { actionList.push({ key: 'asset-allocation-persona-aggressive', priority: 6 }); allocationAnomalyDetected = true; }
        else if (persona && highRiskPersonas.includes(persona) && equityAllocationPercentage < 50) { actionList.push({ key: 'asset-allocation-persona-conservative', priority: 6 }); allocationAnomalyDetected = true; }
        if (!allocationAnomalyDetected && age) {
            if (equityAllocationPercentage > recommendedEquityByAge + 15) actionList.push({ key: 'asset-allocation-age-aggressive', priority: 6 });
            else if (equityAllocationPercentage < recommendedEquityByAge - 15) actionList.push({ key: 'asset-allocation-age-conservative', priority: 6 });
        }

        const uniqueActions = Array.from(new Map(actionList.map(item => [item.key, item])).values()).sort((a, b) => a.priority - b.priority);
        const allActionKeys = uniqueActions.map(a => a.key);
        
        const currentInProgress = userActions?.filter(a => a.status === 'in_progress') || [];
        const inProgressKeys = new Set(currentInProgress.map(a => a.action_key));
        const todoKeys = allActionKeys.filter(key => !inProgressKeys.has(key));

        return { actionKeys: allActionKeys, inProgressActions: currentInProgress, todoActionKeys: todoKeys };
    }, [metrics, user, userActions]);

    const handleStartAndCloseModal = (actionKey: string, targetDate: string) => {
        onStartAction(actionKey, targetDate);
        setSelectedAction(null);
    }
    
    const actionCategorization: { [key: string]: { level: 1 | 2 | 3 } } = {
        'savingsRatio': { level: 1 }, 'liquidityRatio': { level: 1 }, 'debtToIncomeRatio': { level: 1 }, 'protection-health': { level: 1 }, 'goals-short': { level: 1 },
        'leverageRatio': { level: 2 }, 'protection-life': { level: 2 }, 'goals-medium': { level: 2 }, 'asset-allocation-persona-aggressive': { level: 2 }, 'asset-allocation-persona-conservative': { level: 2 }, 'asset-allocation-age-aggressive': { level: 2 }, 'asset-allocation-age-conservative': { level: 2 },
        'financialAssetRatio': { level: 3 }, 'wealthRatio': { level: 3 }, 'goals-overall': { level: 3 }, 'goals-long': { level: 3 }, 'retirement': { level: 3 },
    };

    const categorizedTodoActions = {
        1: { title: "Level 1: Quick Wins", description: "Tackle these foundational tasks first to build a solid financial base.", icon: "🚀", actions: [] as { key: string; props: any }[] },
        2: { title: "Level 2: The Strategist", description: "Focus on medium-term planning to align your strategy and protect your assets.", icon: "🎯", actions: [] as { key: string; props: any }[] },
        3: { title: "Level 3: Boss Mode", description: "Optimize your portfolio and accelerate your journey to long-term wealth.", icon: "👑", actions: [] as { key: string; props: any }[] },
    };

    todoActionKeys.forEach(key => {
        const categoryInfo = actionCategorization[key];
        const actionProps = actionMap[key];
        if (categoryInfo && actionProps) {
            categorizedTodoActions[categoryInfo.level].actions.push({ key, props: actionProps });
        } else if (actionProps) {
            categorizedTodoActions[2].actions.push({ key, props: actionProps }); // Fallback
        }
    });

    return (
        <div className="my-plan-container">
            <h1>My Moves</h1>
            {inProgressActions.length > 0 && (
                <div className="plan-level-category">
                    <div className="plan-level-header">
                        <span className="plan-level-icon">⏳</span>
                        <div className="plan-level-title-group">
                            <h2>In Progress</h2>
                            <p>Great job starting! Keep the momentum going.</p>
                        </div>
                    </div>
                    <div className="plan-level-actions">
                        {inProgressActions.map(action => (
                            <ActionCardInProgress
                                key={action.action_id}
                                title={actionMap[action.action_key]?.title || 'Action'}
                                targetDate={action.target_date}
                                onComplete={() => onCompleteAction(action.action_id)}
                            />
                        ))}
                    </div>
                </div>
            )}
            
            {todoActionKeys.length > 0 && (
                 Object.values(categorizedTodoActions).map(category => (
                    category.actions.length > 0 && (
                        <div key={category.title} className="plan-level-category">
                            <div className="plan-level-header">
                               <span className="plan-level-icon">{category.icon}</span>
                               <div className="plan-level-title-group">
                                  <h2>{category.title}</h2>
                                  <p>{category.description}</p>
                               </div>
                            </div>
                            <div className="plan-level-actions">
                              {category.actions.map(({ key, props }) => (
                                  <ActionCard
                                      key={key}
                                      title={props.title}
                                      description={props.description}
                                      severity={props.severity}
                                      icon={props.icon}
                                      onStart={() => setSelectedAction(key)}
                                  />
                              ))}
                            </div>
                        </div>
                    )
                ))
            )}

            {actionKeys.length === 0 && (
                <div className="action-card no-actions-card">
                    <div className="emoji">🎉</div>
                    <h3>All Clear!</h3>
                    <p>Your financial health is looking great. Keep up the good work and continue tracking your progress.</p>
                </div>
            )}
            {selectedAction && <ActionDetailModal actionKey={selectedAction} onClose={() => setSelectedAction(null)} onStartAction={handleStartAndCloseModal} />}
        </div>
    );
};

export default MyPlan;
