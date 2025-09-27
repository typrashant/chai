
import React, { useState, useEffect, useMemo } from 'react';
import { type UserProfile, type Goal, type Financials, getLatestFinancialSnapshot, getUserGoals, calculateAllFinancialMetrics } from './db.ts';
import { CloseIcon } from './icons.tsx';

// Re-using some components for consistency, but they will be read-only
import InvestmentAllocation from './InvestmentAllocation.tsx';
import FinancialHealthCard from './FinancialHealthCard.tsx';
import FinancialProtectionCard from './FinancialProtectionCard.tsx';
import FinancialGoalsCard from './FinancialGoalsCard.tsx';
import MonthlyCashflowCard from './MonthlyCashflowCard.tsx';


interface ClientReportModalProps {
    client: UserProfile;
    onClose: () => void;
}

const ClientReportModal: React.FC<ClientReportModalProps> = ({ client, onClose }) => {
    const [financials, setFinancials] = useState<Financials | null>(null);
    const [goals, setGoals] = useState<Goal[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [fetchedFinancials, fetchedGoals] = await Promise.all([
                getLatestFinancialSnapshot(client.user_id),
                getUserGoals(client.user_id),
            ]);
            setFinancials(fetchedFinancials);
            setGoals(fetchedGoals);
            setIsLoading(false);
        };
        fetchData();
    }, [client.user_id]);

    const metricsData = useMemo(() => {
        if (!financials || !goals) return null;
        return calculateAllFinancialMetrics(financials, client, goals);
    }, [financials, client, goals]);

    const metrics = metricsData?.metrics;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content report-modal" onClick={e => e.stopPropagation()}>
                {isLoading ? (
                     <div style={{ padding: '2rem', textAlign: 'center' }}>Loading client report...</div>
                ) : !financials || !metrics || !goals ? (
                     <div style={{ padding: '2rem', textAlign: 'center' }}>Could not load client data.</div>
                ) : (
                    <>
                         <header className="report-header no-print">
                             <div className="report-header-main">
                                <div className="report-client-info">
                                    <h2>{client.name}'s Financial Snapshot</h2>
                                    <p>{client.phone_number} | Age: {client.age}</p>
                                </div>
                                <div className="report-actions">
                                    <button className="update-button" onClick={() => window.print()}>Print / Save as PDF</button>
                                    <button className="modal-close-button" onClick={onClose} aria-label="Close modal">
                                        <CloseIcon />
                                    </button>
                                </div>
                             </div>
                         </header>
                         <main className="report-body">
                             <section className="report-section">
                                <h3>Financial Persona</h3>
                                <strong>{client.persona || 'Not defined'}</strong>
                             </section>
                             <section className="report-section">
                                <h3>Net Worth Summary</h3>
                                <p><strong>Total Net Worth:</strong> {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(metrics.netWorth)}</p>
                                <p><strong>Total Assets:</strong> {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(metrics.totalAssets)}</p>
                                <p><strong>Total Liabilities:</strong> {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(metrics.totalLiabilities)}</p>
                             </section>
                             <section className="report-section full-width">
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
                             <section className="report-section full-width">
                                <h3>Investment Allocation</h3>
                                <InvestmentAllocation assets={financials.assets} />
                             </section>
                              <section className="report-section full-width">
                                <h3>Financial Health Ratios</h3>
                                <FinancialHealthCard ratios={metrics.healthRatios} />
                             </section>
                             <section className="report-section full-width">
                                <h3>Financial Protection</h3>
                                 <FinancialProtectionCard financials={financials} protectionScores={metrics.protectionScores} onUpdate={()=>{}} isOpen={false} onToggle={()=>{}} isCompleted={true} potentialPoints={0} />
                             </section>
                              <section className="report-section full-width">
                                <h3>Financial Goals</h3>
                                 <FinancialGoalsCard user={client} goals={goals} goalCoverageRatios={metrics.goalCoverageRatios} onAddGoal={()=>{}} onRemoveGoal={()=>{}} isOpen={false} onToggle={()=>{}} isCompleted={true} potentialPoints={0} />
                             </section>
                         </main>
                    </>
                )}
            </div>
        </div>
    );
};

export default ClientReportModal;
