import React, { useState, useMemo } from 'react';
import { type Goal, type UserProfile } from './db.ts';

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

export const FinancialGoalsCard = ({ user, goals, goalCoverageRatios, onAddGoal, onRemoveGoal, isOpen, onToggle, isCompleted, potentialPoints }: { user: UserProfile, goals: Goal[], goalCoverageRatios: any, onAddGoal: (goal: Omit<Goal, 'goal_id' | 'user_id' | 'created_at' | 'is_achieved'>) => void, onRemoveGoal: (id: string) => void, isOpen: boolean, onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void, isCompleted: boolean, potentialPoints: number }) => {
    const [showFormForAge, setShowFormForAge] = useState<number | null>(null);
    const [newGoalType, setNewGoalType] = useState(GOAL_TYPES[0]);
    const [otherGoalName, setOtherGoalName] = useState('');
    const [newGoalValue, setNewGoalValue] = useState('');

    const sortedGoals = useMemo(() => {
        return [...goals].sort((a, b) => b.target_value - a.target_value);
    }, [goals]);
    
    const age = useMemo(() => {
        if (!user.date_of_birth) return 18;
        return new Date().getFullYear() - new Date(user.date_of_birth).getFullYear();
    }, [user.date_of_birth]);

    const handleAddGoal = (e: React.FormEvent) => {
        e.preventDefault();
        const goalName = newGoalType === 'Others' ? otherGoalName : newGoalType;

        if (goalName && newGoalValue && showFormForAge) {
            const newGoal = {
                goal_name: goalName,
                target_age: showFormForAge,
                target_value: Number(newGoalValue),
            };
            onAddGoal(newGoal);
            setShowFormForAge(null);
            setNewGoalType(GOAL_TYPES[0]);
            setOtherGoalName('');
            setNewGoalValue('');
        }
    };
    
    const startAge = age;
    const timelineAges = Array.from({ length: 100 - startAge + 1 }, (_, i) => startAge + i);
    const hasGoals = goals.length > 0;

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
                     {hasGoals && goalCoverageRatios ? (
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
                                        <div className="goal-summary-item" key={goal.goal_id}>
                                            <div className="goal-item-info">
                                                <span className="goal-item-name">{goal.goal_name}</span>
                                                <span className="goal-item-time">{goal.target_age - startAge} years left</span>
                                            </div>
                                            <span className="goal-item-value">{formatCurrency(goal.target_value)}</span>
                                        </div>
                                    ))}
                                </div>
                                {otherGoals.length > 0 && (
                                    <div className="other-goals-list">
                                        {otherGoals.map(goal => (
                                            <div className="goal-summary-item" key={goal.goal_id}>
                                                <div className="goal-item-info">
                                                    <span className="goal-item-name">{goal.goal_name}</span>
                                                    <span className="goal-item-time">{goal.target_age - startAge} years left</span>
                                                </div>
                                                <span className="goal-item-value">{formatCurrency(goal.target_value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                         <div className="summary-placeholder" style={{flexGrow: 1}}>
                            <p>Add your goals to see how you're tracking.</p>
                         </div>
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
                    {goals.length > 0 ? (
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
                                {goals.sort((a,b) => a.target_age - b.target_age).map(goal => (
                                    <tr key={goal.goal_id}>
                                        <td>{goal.goal_name}</td>
                                        <td>{goal.target_age - startAge} years</td>
                                        <td>{formatCurrency(goal.target_value)}</td>
                                        <td><button className="delete-goal-btn" onClick={() => onRemoveGoal(goal.goal_id)}>✕</button></td>
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

export default FinancialGoalsCard;