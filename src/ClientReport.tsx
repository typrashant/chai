import React from 'react';
import { type UserProfile, type Financials, type Goal } from './db';
import InvestmentAllocation from './InvestmentAllocation';
import FinancialHealthCard from './FinancialHealthCard';
import MonthlyCashflowCard from './MonthlyCashflowCard';
import FinancialGoalsCard from './FinancialGoalsCard';
import FinancialProtectionCard from './FinancialProtectionCard';
import RetirementTracker from './RetirementTracker';

interface ClientReportProps {
    client: UserProfile;
    reportData: {
        financials: Financials;
        goals: Goal[];
        metrics: any;
    };
    onClose: () => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const personaTypes: { [key: string]: string } = {
    Guardian: "A meticulous planner who prioritizes capital preservation.",
    Planner: "A goal-oriented and methodical individual.",
    Adventurer: "A calculated risk-taker who researches high-growth opportunities.",
    Spender: "Prioritizes their present lifestyle and prefer keeping money accessible.",
    Seeker: "Interested in growth but lacks a concrete strategy.",
    Accumulator: "An optimistic, spontaneous investor motivated by potential big wins."
};

const ClientReport: React.FC<ClientReportProps> = ({ client, reportData, onClose }) => {
    const { financials, goals, metrics } = reportData;

    const handlePrint = () => window.print();

    if (!metrics) {
        return (
             <div className="client-report-modal">
                <div className="client-report-content">
                    <div className="summary-placeholder">Loading report...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="client-report-modal">
            <div className="client-report-content">
                <header className="client-report-header">
                    <div>
                        <h2>Financial Report for {client.name}</h2>
                        <p style={{fontSize: '0.8rem', color: 'var(--text-color-light)'}}>
                            Phone: {client.phone_number} | Age: {client.age}
                        </p>
                    </div>
                    <div className="client-report-actions no-print">
                        <button className="update-button" onClick={handlePrint}>Print/Save PDF</button>
                        <button className="modal-close-button" onClick={onClose}>&times;</button>
                    </div>
                </header>

                <div className="client-report-body">
                    <div className="report-section full-width">
                        <h3>Financial Persona: {client.persona}</h3>
                        <p>{client.persona ? personaTypes[client.persona] : 'Not defined'}</p>
                    </div>
                    
                     <div className="report-section">
                        <h3>Net Worth Summary</h3>
                        <div className="summary-item"><span>Total Net Worth</span><strong>{formatCurrency(metrics.netWorth)}</strong></div>
                        <div className="summary-item"><span>Total Assets</span><strong>{formatCurrency(metrics.totalAssets)}</strong></div>
                        <div className="summary-item"><span>Total Liabilities</span><strong>{formatCurrency(metrics.totalLiabilities)}</strong></div>
                    </div>
                    
                    <div className="report-section">
                        <h3>Cash Flow</h3>
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
                            isReadOnly={true}
                        />
                    </div>

                    <div className="report-section full-width">
                       <FinancialHealthCard ratios={metrics.healthRatios} />
                    </div>

                    <div className="report-section full-width">
                       <InvestmentAllocation assets={financials.assets} />
                    </div>

                    <div className="report-section">
                        <FinancialProtectionCard 
                            financials={financials} 
                            protectionScores={metrics.protectionScores} 
                            onUpdate={() => {}} 
                            isOpen={false} 
                            onToggle={() => {}} 
                            isCompleted={true} 
                            potentialPoints={0}
                            isReadOnly={true}
                        />
                    </div>
                    
                    <div className="report-section">
                         <RetirementTracker retirementReadiness={metrics.retirementReadiness} />
                    </div>
                    
                    <div className="report-section full-width">
                       <FinancialGoalsCard 
                            user={client} 
                            goals={goals} 
                            goalCoverageRatios={metrics.goalCoverageRatios} 
                            onAddGoal={() => {}} 
                            onRemoveGoal={() => {}} 
                            isOpen={false} 
                            onToggle={() => {}} 
                            isCompleted={goals.length > 0} 
                            potentialPoints={0} 
                            isReadOnly={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientReport;