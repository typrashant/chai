import React, { useState, useMemo } from 'react';
import { type Goal, type User, type Financials } from './db';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const GOAL_TYPES = ['House', 'Education', 'Vacation', 'Gadgets', 'Others'];

const GoalCoverageRatioBar = ({ label, ratio, status }: { label: string, ratio: number, status: string }) => {
    if (status === 'neutral') return null;

    return (
        <div className="goal-ratio-item">
            <div className="goal-ratio-labels">
                <span>{label}</span>
                <span>{ratio.toFixed(0)}%</span>
            </div>
            <div className="goal-ratio-bar">
                <div className={`goal-ratio-bar-inner status-${status}`} style={{ width: `${ratio}%` }}></div>
            </div>
        </div>
    );
};


export const FinancialGoalsCard = ({ user, financials, onAddGoal, onRemoveGoal, isOpen, onToggle, isCompleted, potentialPoints }: { user: User, financials: Financials, onAddGoal: (goal: Goal) => void, onRemoveGoal: (id: string) => void, isOpen: boolean, onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void, isCompleted: boolean, potentialPoints: number }) => {
    const [showFormForAge, setShowFormForAge] = useState<number | null>(null);
    const [newGoalType, setNewGoalType] = useState(GOAL_TYPES[0]);
    const [otherGoalName, setOtherGoalName] = useState('');
    const [newGoalValue, setNewGoalValue] = useState('');

    const sortedGoals = useMemo(() => {
        return [...user.goals].sort((a, b) => b.value - a.value);
    }, [user.goals]);

    const goalCoverageRatios = useMemo(() => {
        const startAge = user.age || 18;

        const goalsByTerm = {
            short: { value: 0 },
            medium: { value: 0 },
            long: { value: 0 },
        };

        user.goals.forEach(goal => {
            const yearsLeft = goal.targetAge - startAge;
            if (yearsLeft < 2) {
                goalsByTerm.short.value += goal.value;
            } else if (yearsLeft >= 2 && yearsLeft <= 5) {
                goalsByTerm.medium.value += goal.value;
            } else {
                goalsByTerm.long.value += goal.value;
            }
        });
        
        const totalGoalValue = user.goals.reduce((sum, goal) => sum + goal.value, 0);
        
        const investableAssetKeys: (keyof Financials['assets'])[] = [
            'stocks', 'mutualFunds', 'crypto', 'nps', 'ppf', 'pf', 'sukanyaSamriddhi', 
            'cashInHand', 'savingsAccount', 'recurringDeposit', 'fixedDeposit'
        ];
        const totalInvestableAssets = investableAssetKeys.reduce((sum, key) => sum + (financials.assets[key] || 0), 0);

        const assetsByTerm = {
            short: (financials.assets.crypto || 0) + (financials.assets.cashInHand || 0) + (financials.assets.savingsAccount || 0) + (financials.assets.recurringDeposit || 0) + (financials.assets.fixedDeposit || 0),
            medium: (financials.assets.mutualFunds || 0),
            long: (financials.assets.stocks || 0) + (financials.assets.nps || 0) + (financials.assets.ppf || 0) + (financials.assets.pf || 0) + (financials.assets.sukanyaSamriddhi || 0),
        };
        
        type Status = 'red' | 'amber' | 'green' | 'neutral';

        const calculateRatio = (assetValue: number, goalValue: number): { ratio: number; status: Status } => {
            if (goalValue === 0) return { ratio: 0, status: 'neutral' };
            const ratio = Math.min((assetValue / goalValue) * 100, 100);
            let status: Status = 'red';
            if (ratio >= 75) status = 'green';
            else if (ratio >= 40) status = 'amber';
            return { ratio, status };
        };

        return {
            overall: { ...calculateRatio(totalInvestableAssets, totalGoalValue), label: 'Overall Goal Coverage' },
            short: { ...calculateRatio(assetsByTerm.short, goalsByTerm.short.value), label: 'Short-Term (< 2 Years)' },
            medium: { ...calculateRatio(assetsByTerm.medium, goalsByTerm.medium.value), label: 'Medium-Term (2-5 Years)' },
            long: { ...calculateRatio(assetsByTerm.long, goalsByTerm.long.value), label: 'Long-Term (> 5 Years)' },
        };
    }, [user.goals, user.age, financials.assets]);

    const handleAddGoal = (e: React.FormEvent) => {
        e.preventDefault();
        const goalName = newGoalType === 'Others' ? otherGoalName : newGoalType;

        if (goalName && newGoalValue && showFormForAge) {
            const newGoal: Goal = {
                id: `goal_${Date.now()}`,
                name: goalName,
                targetAge: showFormForAge,
                value: Number(newGoalValue),
            };
            onAddGoal(newGoal);
            setShowFormForAge(null);
            setNewGoalType(GOAL_TYPES[0]);
            setOtherGoalName('');
            setNewGoalValue('');
        }
    };
    
    const startAge = user.age || 18;
    const timelineAges = Array.from({ length: 100 - startAge + 1 }, (_, i) => startAge + i);
    const hasGoals = user.goals.length > 0;

    if (!isOpen) {
        const topGoals = sortedGoals.slice(0, 3);
        const otherGoals = sortedGoals.slice(3);

        return (
            <div className="card">
                <div className="summary-card-header">
                     <div className="summary-card-title-group">
                        <h2>Financial Goals</h2>
                        {!isCompleted && <div className="potential-points">✨ {potentialPoints} Points</div>}
                    </div>
                    <button className="update-button" onClick={onToggle}>{isCompleted ? 'Update' : 'Add'}</button>
                </div>
                <div className="goals-summary">
                     {hasGoals ? (
                        <>
                            <div className="goal-ratios-container">
                                <GoalCoverageRatioBar {...goalCoverageRatios.overall} />
                                <GoalCoverageRatioBar {...goalCoverageRatios.short} />
                                <GoalCoverageRatioBar {...goalCoverageRatios.medium} />
                                <GoalCoverageRatioBar {...goalCoverageRatios.long} />
                            </div>
                            <div className="goals-summary-container">
                                <div className={`top-goals-list ${otherGoals.length > 0 ? 'has-more-goals' : ''}`}>
                                    {topGoals.map(goal => (
                                        <div className="goal-summary-item" key={goal.id}>
                                            <div className="goal-item-info">
                                                <span className="goal-item-name">{goal.name}</span>
                                                <span className="goal-item-time">{goal.targetAge - startAge} years left</span>
                                            </div>
                                            <span className="goal-item-value">{formatCurrency(goal.value)}</span>
                                        </div>
                                    ))}
                                </div>
                                {otherGoals.length > 0 && (
                                    <div className="other-goals-list">
                                        {otherGoals.map(goal => (
                                            <div className="goal-summary-item" key={goal.id}>
                                                <div className="goal-item-info">
                                                    <span className="goal-item-name">{goal.name}</span>
                                                    <span className="goal-item-time">{goal.targetAge - startAge} years left</span>
                                                </div>
                                                <span className="goal-item-value">{formatCurrency(goal.value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <p style={{ color: '#666', textAlign: 'center', margin: 'auto' }}>No goals added yet.</p>
                    )}
                </div>
            </div>
        );
    }
    
    return (
        <div className="card financial-goals-card-open">
            <h2>Update Financial Goals</h2>
            <div className="goals-card-content">
                <div className="goals-editor-section">
                    <div className="timeline-container">
                        <h3>Select an age to add a goal:</h3>
                        <div className="timeline">
                            {timelineAges.map(age => (
                                <button key={age} className="timeline-age" onClick={() => setShowFormForAge(age)}>
                                    {age} +
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {showFormForAge && (
                        <form className="goal-form" onSubmit={handleAddGoal}>
                            <h4>Add Goal for Age {showFormForAge}</h4>
                            <div className="form-group">
                                <label htmlFor="goalType">Goal Type</label>
                                <select id="goalType" value={newGoalType} onChange={e => setNewGoalType(e.target.value)}>
                                    {GOAL_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                            {newGoalType === 'Others' && (
                                <div className="form-group">
                                    <label htmlFor="goalName">Specify Goal Name</label>
                                    <input id="goalName" type="text" value={otherGoalName} onChange={e => setOtherGoalName(e.target.value)} placeholder="e.g., World Tour" required />
                                </div>
                            )}
                            <div className="form-group">
                                <label htmlFor="goalValue">Target Value</label>
                                <input id="goalValue" type="number" value={newGoalValue} onChange={e => setNewGoalValue(e.target.value)} placeholder="₹5,000,000" required />
                            </div>
                             <div className="goal-form-buttons">
                                <button type="button" className="update-button" style={{borderColor: '#aaa', color: '#666'}} onClick={() => setShowFormForAge(null)}>Cancel</button>
                                <button type="submit" className="done-button">Add Goal</button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="goals-list-section">
                    <h3>Your Goals</h3>
                    {user.goals.length > 0 ? (
                        <table className="goal-summary-table">
                            <thead>
                                <tr>
                                    <th>Goal</th>
                                    <th>Years to Go</th>
                                    <th>Value</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {user.goals.sort((a,b) => a.targetAge - b.targetAge).map(goal => (
                                    <tr key={goal.id}>
                                        <td>{goal.name}</td>
                                        <td>{goal.targetAge - startAge} years</td>
                                        <td>{formatCurrency(goal.value)}</td>
                                        <td><button className="delete-goal-btn" onClick={() => onRemoveGoal(goal.id)}>✕</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <p style={{ color: '#666', textAlign: 'center' }}>No goals added yet. Use the timeline above.</p>}
                </div>
            </div>

            <div className="card-footer">
                <button className="done-button" onClick={onToggle}>Done</button>
            </div>
        </div>
    );
};