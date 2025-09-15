
import React from 'react';
import { CloseIcon } from './icons.tsx';

const actionDetails: { [key: string]: any } = {
    'savingsRatio': {
        title: 'Boost Your Savings Ratio',
        topProducts: ['High-yield Savings Accounts', 'Recurring Deposits (RDs)', 'Liquid Mutual Funds'],
        howMuch: 'Aim to increase your current savings by at least 5-10% of your take-home pay. Even starting with an extra ₹2,000 per month can build a strong habit.'
    },
     'financialAssetRatio': {
        title: 'Grow Your Financial Assets',
        topProducts: ['Index Mutual Funds (Nifty 50, Sensex)', 'Flexi-cap Mutual Funds', 'Public Provident Fund (PPF)'],
        howMuch: 'Start a Systematic Investment Plan (SIP) of ₹5,000 per month in a diversified mutual fund. This builds the habit of investing regularly for long-term growth.'
    },
    'liquidityRatio': {
        title: 'Build Your Emergency Fund',
        topProducts: ['High-yield Savings Accounts', 'Liquid Mutual Funds with instant redemption', 'Fixed Deposits with no penalty on premature withdrawal'],
        howMuch: 'Start with a goal of saving one full month of expenses. A good initial target is ₹25,000. Automate a fixed amount, like ₹5,000, every month towards this goal.'
    },
     'leverageRatio': {
        title: 'Manage Your Debt Levels',
        topProducts: ['Debt consolidation loan', 'Balance transfer credit card'],
        howMuch: 'Prioritize paying off high-interest debt. Allocate an additional 5% of your income to EMIs, starting with the most expensive loan, to reduce your overall leverage.'
    },
    'debtToIncomeRatio': {
        title: 'Reduce High-Interest Debt',
        topProducts: ['Balance Transfer Credit Cards (0% interest for a period)', 'Debt Consolidation Loans (to get a lower overall interest rate)'],
        howMuch: 'Try to allocate an extra ₹1,000 - ₹5,000 per month towards your highest-interest debt. This can significantly reduce the total interest you pay over time.'
    },
    'wealthRatio': {
        title: 'Increase Your Net Worth',
        topProducts: ['Systematic Investment Plans (SIPs) in Equity Funds', 'Real Estate Investment Trusts (REITs)', 'National Pension System (NPS)'],
        howMuch: 'Focus on consistently investing a portion of your savings. A good start is to invest 50% of your monthly savings into growth assets like mutual funds.'
    },
    'protection-life': {
        title: 'Review Your Life Insurance',
        topProducts: ['Term Life Insurance Plan (most cost-effective for high cover)'],
        howMuch: 'Premiums are very affordable, especially when you are young. A ₹1 Crore cover can cost as little as ₹500 - ₹1,500 per month depending on your age and health.'
    },
    'protection-health': {
        title: 'Increase Health Coverage',
        topProducts: ['Family Floater Health Insurance Plans', 'Super Top-up Health Plans (to increase cover cost-effectively)'],
        howMuch: 'A comprehensive family health plan can start from ₹1,000 - ₹2,500 per month in premiums, a small price for peace of mind.'
    },
    'goals-overall': {
        title: 'Align Investments with Goals',
        topProducts: ['Equity Mutual Funds (for long-term goals)', 'Hybrid or Balanced Advantage Funds (for medium-term)', 'Debt Funds or RDs (for short-term)'],
        howMuch: 'Use an online SIP calculator to see how much you need to invest monthly for each goal. Start with what you can afford and aim to increase your SIP amount by 10% each year.'
    },
    'retirement': {
        title: 'Accelerate Retirement Savings',
        topProducts: ['NPS / Pension Plans', 'Public Provident Fund (PPF)', 'Equity Linked Savings Scheme (ELSS - for tax saving & growth)'],
        howMuch: 'Aim to save at least 15% of your income specifically for retirement. If you get a salary hike, allocate at least 50% of the increment towards your retirement SIPs.'
    },
    'asset-allocation-persona-aggressive': {
        title: 'Align Investments to Your Persona',
        topProducts: ['Public Provident Fund (PPF)', 'Debt Mutual Funds', 'Fixed Deposits (FDs)'],
        howMuch: 'Consider reallocating 10-20% of your portfolio from high-risk assets (like stocks, crypto) to more stable debt instruments to better match your risk profile.'
    },
    'asset-allocation-persona-conservative': {
        title: 'Align Investments to Your Persona',
        topProducts: ['Index Mutual Funds (Nifty 50, Sensex)', 'Flexi-cap Mutual Funds', 'Blue-chip Stocks'],
        howMuch: 'To capture more growth, consider increasing your monthly SIPs into equity mutual funds by ₹5,000 - ₹10,000 or reallocating a portion of your debt investments.'
    },
    'asset-allocation-age-aggressive': {
        title: 'Review Your Portfolio Risk',
        topProducts: ['Hybrid/Balanced Advantage Funds', 'Large-cap Mutual Funds', 'Gold Bonds'],
        howMuch: 'A phased reduction in high-risk assets is advisable. Start by trimming your most volatile investments (e.g., small-cap or thematic funds, crypto) by 5-10% and moving the proceeds to more stable options.'
    },
    'asset-allocation-age-conservative': {
        title: 'Review Your Portfolio for Growth',
        topProducts: ['Equity Linked Savings Scheme (ELSS)', 'Mid-cap or Flexi-cap Mutual Funds', 'Diversified stock portfolio'],
        howMuch: 'You have a long time horizon. A good starting point is to increase your equity exposure by 10%. You can do this by starting a new SIP of ₹5,000 in a diversified equity fund.'
    }
};


const ActionDetailModal = ({ actionKey, onClose }: { actionKey: string; onClose: () => void; }) => {
    const details = actionDetails[actionKey];
    if (!details) return null;

    return (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 id="modal-title">{details.title}</h2>
                    <button className="modal-close-button" onClick={onClose} aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>
                <div className="modal-body">
                     <div className="modal-section">
                        <h3>Top Products</h3>
                        <ul>
                             {details.topProducts.slice(0, 3).map((product: string, index: number) => <li key={index}>{product}</li>)}
                        </ul>
                    </div>
                     <div className="modal-section">
                        <h3>How much to start with</h3>
                        <p>{details.howMuch}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActionDetailModal;