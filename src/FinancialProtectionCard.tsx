import React from 'react';
import { type Financials, type Insurance } from './db';

type RagStatus = 'green' | 'amber' | 'red';
const getRagColor = (status: RagStatus) => {
    if (status === 'green') return 'var(--green)';
    if (status === 'amber') return 'var(--amber)';
    return 'var(--red)';
};

const ProtectionItem = ({ title, score, status }: { title: string; score: number; status: RagStatus; }) => (
    <div className="protection-item">
        <h3>{title}</h3>
        <p>{score.toFixed(0)}%</p>
        <div className="coverage-bar">
            <div className="coverage-bar-inner" style={{ width: `${Math.min(score, 100)}%`, backgroundColor: getRagColor(status) }} />
        </div>
    </div>
);

const FinancialProtectionCard = ({ financials, protectionScores, onUpdate, isOpen, onToggle, isCompleted, potentialPoints }: { financials: Financials; protectionScores: any; onUpdate: (data: Insurance) => void; isOpen: boolean; onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void; isCompleted: boolean; potentialPoints: number; }) => {
    const handleInsuranceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        onUpdate({ ...financials.insurance, [id]: Number(value) || 0 });
    };
    
    const handleBinaryInsuranceChange = (type: 'car' | 'property', hasInsurance: boolean) => {
        let newValue = 0;
        if (hasInsurance) {
            if (type === 'car') {
                newValue = financials.assets.car || 1; // Use asset value, or 1 if asset exists but value is 0
            } else { // property
                newValue = (financials.assets.house || 0) + (financials.assets.otherProperty || 0) || 1;
            }
        }
        onUpdate({ ...financials.insurance, [type]: newValue });
    };

    if (!isOpen) {
        return (
            <div className="card summary-card">
                 <div className="summary-card-header">
                    <div className="summary-card-title-group">
                        <h2>Financial Protection</h2>
                        {!isCompleted && <div className="potential-points">✨ {potentialPoints} Points</div>}
                    </div>
                    <div className="summary-card-controls">
                        <button className="update-button" onClick={onToggle}>{isCompleted ? 'Update' : 'Calculate'}</button>
                    </div>
                </div>
                {isCompleted && protectionScores ? (
                    <div className="protection-summary">
                        <ProtectionItem title="Life Protection" {...protectionScores.life} />
                        <ProtectionItem title="Health Protection" {...protectionScores.health} />
                        <ProtectionItem title="Car Protection" {...protectionScores.car} />
                        <ProtectionItem title="Property Protection" {...protectionScores.property} />
                    </div>
                ) : (
                    <div className="summary-placeholder">
                        <p>Assess your insurance coverage to see your protection score.</p>
                    </div>
                )}
            </div>
        );
    }

    const hasCarAsset = (financials.assets.car || 0) > 0;
    const hasPropertyAsset = ((financials.assets.house || 0) + (financials.assets.otherProperty || 0)) > 0;
    const currentInsurance = financials.insurance;
    
    return (
        <div className="card financial-goals-card-open">
             <h2>Update Financial Protection</h2>
            <div className="calculator-sections-container">
                <div className="form-group">
                    <label htmlFor="life">Life Protection Cover</label>
                    <input id="life" type="number" value={currentInsurance.life || ''} onChange={handleInsuranceChange} placeholder="₹0" />
                </div>
                <div className="form-group">
                    <label htmlFor="health">Health Protection Cover</label>
                    <input id="health" type="number" value={currentInsurance.health || ''} onChange={handleInsuranceChange} placeholder="₹0" />
                </div>
                <div className="form-group">
                    <label>Car Insurance</label>
                    {hasCarAsset ? (
                        <div className="binary-toggle">
                            <button type="button" className={currentInsurance.car > 0 ? 'active' : ''} onClick={() => handleBinaryInsuranceChange('car', true)}>Yes</button>
                            <button type="button" className={currentInsurance.car === 0 ? 'active' : ''} onClick={() => handleBinaryInsuranceChange('car', false)}>No</button>
                        </div>
                    ) : (
                        <p className="form-group-note">No car asset entered</p>
                    )}
                </div>
                <div className="form-group">
                    <label>Property Insurance</label>
                    {hasPropertyAsset ? (
                        <div className="binary-toggle">
                             <button type="button" className={currentInsurance.property > 0 ? 'active' : ''} onClick={() => handleBinaryInsuranceChange('property', true)}>Yes</button>
                            <button type="button" className={currentInsurance.property === 0 ? 'active' : ''} onClick={() => handleBinaryInsuranceChange('property', false)}>No</button>
                        </div>
                    ) : (
                         <p className="form-group-note">No property asset entered</p>
                    )}
                </div>
            </div>
            <div className="card-footer">
                <button className="done-button" onClick={onToggle}>Done</button>
            </div>
        </div>
    );
};

export default FinancialProtectionCard;