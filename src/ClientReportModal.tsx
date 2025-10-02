
import React from 'react';
import { type UserProfile, type Financials, type Goal, type Expenses, type FinancialItem } from './db.ts';
import { calculateAllFinancialMetrics } from './App.tsx';
import { CloseIcon, PrintIcon } from './icons.tsx';
import FinancialHealthCard from './FinancialHealthCard.tsx';
import InvestmentAllocation from './InvestmentAllocation.tsx';
import MonthlyCashflowCard from './MonthlyCashflowCard.tsx';

interface ClientReportModalProps {
    client: UserProfile;
    financials: Financials;
    goals: Goal[];
    onClose: () => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const personaDetails: { [key: string]: { name: string; archetype: string; avatar: string } } = {
    Guardian: { name: 'The Cautious Owl', archetype: 'Capital Protector', avatar: '🦉' },
    Planner: { name: 'The Balanced Red Panda', archetype: 'Balanced Strategist', avatar: '🐼' },
    Adventurer: { name: 'The Daring Falcon', archetype: 'Calculated Risk-Taker', avatar: '🦅' },
    Spender: { name: 'The Joyful Otter', archetype: 'Lifestyle Enthusiast', avatar: '🦦' },
    Seeker: { name: 'The Curious Fox', archetype: 'Growth Explorer', avatar: '🦊' },
    Accumulator: { name: 'The Bold Lion', archetype: 'Optimistic Investor', avatar: '🦁' }
};


const ClientReportModal: React.FC<ClientReportModalProps> = ({ client, financials, goals, onClose }) => {
    const metricsData = calculateAllFinancialMetrics(financials, client, goals);
    if (!metricsData) return null; // Or show loading/error state
    
    const { metrics } = metricsData;
    const { netWorth, totalAssets, totalLiabilities } = metrics;
    const persona = client.persona ? personaDetails[client.persona] : null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content report-modal" onClick={e => e.stopPropagation()}>
                <header className="report-modal-header">
                    <div>
                        <h2>{client.name}'s Financial Report</h2>
                        <p style={{color: 'var(--text-color-light)', fontSize: '0.9rem', margin: 0}}>{client.phone_number} &bull; Age {client.age}</p>
                    </div>
                    <div className="report-modal-actions">
                        <button className="action-button-secondary" onClick={() => window.print()}><PrintIcon/> Print/Save</button>
                        <button className="modal-close-button" onClick={onClose}><CloseIcon/></button>
                    </div>
                </header>
                <main className="report-modal-body">
                    <section className="report-section report-grid">
                        {persona && (
                             <div className="report-persona-card">
                                <h3>Financial Persona</h3>
                                <div className="avatar">{persona.avatar}</div>
                                <h4>{persona.name}</h4>
                                <p>{persona.archetype}</p>
                            </div>
                        )}
                        <div className="report-networth-card">
                             <h3>Net Worth Summary</h3>
                             <p className="summary-value" style={{fontSize: '2.5rem', margin: '1rem 0'}}>{formatCurrency(netWorth)}</p>
                             <div style={{display: 'flex', justifyContent: 'space-around', textAlign: 'center'}}>
                                 <div>
                                     <p style={{color: 'var(--text-color-light)', fontSize: '0.9rem'}}>Total Assets</p>
                                     <strong style={{fontSize: '1.2rem'}}>{formatCurrency(totalAssets)}</strong>
                                 </div>
                                  <div>
                                     <p style={{color: 'var(--text-color-light)', fontSize: '0.9rem'}}>Total Liabilities</p>
                                     <strong style={{fontSize: '1.2rem'}}>{formatCurrency(totalLiabilities)}</strong>
                                 </div>
                             </div>
                        </div>
                    </section>
                    
                     <section className="report-section">
                        <h3>Cash Flow & Expenses</h3>
                         <MonthlyCashflowCard 
                            expenses={financials.expenses}
                            monthlyIncome={metrics.monthlyIncome}
                            monthlyExpenses={metrics.monthlyExpenses}
                            monthlySavings={metrics.monthlySavings}
                            totalMonthlyIncome_MonthlyItems={metrics.totalMonthlyIncome_MonthlyItems}
                            totalAnnualIncome_AnnualItems={metrics.totalAnnualIncome_AnnualItems}
                            totalMonthlyExpenses_MonthlyItems={metrics.totalMonthlyExpenses_MonthlyItems}
                            totalAnnualExpenses_AnnualItems={metrics.totalAnnualExpenses_AnnualItems}
                            onToggle={() => {}}
                            isCompleted={true}
                            potentialPoints={0}
                        />
                    </section>
                    
                    <section className="report-section">
                        <h3>Investment Allocation</h3>
                        <InvestmentAllocation assets={financials.assets} />
                    </section>

                    <section className="report-section">
                        <h3>Financial Health Ratios</h3>
                        <FinancialHealthCard ratios={metrics.healthRatios} />
                    </section>

                </main>
            </div>
        </div>
    );
};

export default ClientReportModal;
