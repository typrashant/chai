
import React, { useState, useMemo, useEffect } from 'react';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
};

const formatCompact = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return formatCurrency(value);
}

interface WealthSimulatorProps {
    defaults?: {
        investment: number;
        duration: number;
        rate: number;
        stepUp: number;
    }
}

const WealthSimulatorCard: React.FC<WealthSimulatorProps> = ({ defaults }) => {
    // Initialize state with defaults or fallbacks, but allow user to change them
    const [monthlyInvestment, setMonthlyInvestment] = useState(10000);
    const [years, setYears] = useState(20);
    const [returnRate, setReturnRate] = useState(12);
    const [stepUpRate, setStepUpRate] = useState(10);
    const [isStepUpEnabled, setIsStepUpEnabled] = useState(true);

    // Effect to update state when defaults change (e.g. data loads)
    useEffect(() => {
        if (defaults) {
            setMonthlyInvestment(defaults.investment);
            setYears(defaults.duration);
            setReturnRate(defaults.rate);
            setStepUpRate(defaults.stepUp);
        }
    }, [defaults]);

    const { totalCorpus, totalInvested, chartData } = useMemo(() => {
        const monthlyRate = returnRate / 100 / 12;
        let corpus = 0;
        let invested = 0;
        let currentMonthlyInv = monthlyInvestment;
        
        const dataPoints = [];

        for (let y = 1; y <= years; y++) {
            for (let m = 1; m <= 12; m++) {
                corpus = (corpus + currentMonthlyInv) * (1 + monthlyRate);
                invested += currentMonthlyInv;
            }
            // Annual Step Up
            if (isStepUpEnabled) {
                currentMonthlyInv = currentMonthlyInv * (1 + stepUpRate / 100);
            }
            
            dataPoints.push({ year: y, value: corpus });
        }

        return { 
            totalCorpus: corpus, 
            totalInvested: invested, 
            chartData: dataPoints 
        };
    }, [monthlyInvestment, years, returnRate, stepUpRate, isStepUpEnabled]);

    // Simple SVG Chart generation
    const chartWidth = 100;
    const chartHeight = 50;
    const maxVal = chartData[chartData.length - 1]?.value || 1;
    
    const points = chartData.map((d, i) => {
        const x = (i / (chartData.length - 1)) * chartWidth;
        const y = chartHeight - (d.value / maxVal) * chartHeight;
        return `${x},${y}`;
    }).join(' ');
    
    const areaPath = `${points} ${chartWidth},${chartHeight} 0,${chartHeight}`;

    return (
        <div className="card wealth-simulator-card col-span-2">
            <div className="wealth-header">
                <div>
                    <h2 className="shimmer-text">Future Wealth Potential</h2>
                    <p className="wealth-subtitle">Projected wealth by age {((defaults?.duration || 0) + (60 - (defaults?.duration || 0)))}</p>
                </div>
                <div className="wealth-badge">
                    🚀 Target: {formatCompact(totalCorpus)}
                </div>
            </div>

            <div className="wealth-display">
                <div className="big-number-container">
                    <span className="currency-symbol">₹</span>
                    <span className="big-number">
                        {(totalCorpus / 10000000).toFixed(2)}
                    </span>
                    <span className="unit">Crores</span>
                </div>
                <div className="wealth-breakdown">
                    <div className="breakdown-item">
                        <span>Invested</span>
                        <strong>{formatCompact(totalInvested)}</strong>
                    </div>
                    <div className="breakdown-item profit">
                        <span>Wealth Gained</span>
                        <strong>+{formatCompact(totalCorpus - totalInvested)}</strong>
                    </div>
                </div>
            </div>

            <div className="simulator-chart-viz">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="wealthGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8"/>
                            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.1"/>
                        </linearGradient>
                    </defs>
                    <polygon points={areaPath} fill="url(#wealthGradient)" />
                    <polyline points={points} fill="none" stroke="#FBBF24" strokeWidth="2" />
                </svg>
            </div>

            <div className="simulator-controls">
                <div className="control-row">
                    <div className="slider-container">
                        <label>Monthly Investment: <strong>{formatCurrency(monthlyInvestment)}</strong></label>
                        <input type="range" min="1000" max="200000" step="500" value={monthlyInvestment} onChange={(e) => setMonthlyInvestment(Number(e.target.value))} />
                    </div>
                     <div className="slider-container">
                        <label>Duration: <strong>{years} Years</strong></label>
                        <input type="range" min="3" max="50" step="1" value={years} onChange={(e) => setYears(Number(e.target.value))} />
                    </div>
                </div>

                <div className="control-row">
                     <div className="slider-container">
                        <label>Expected Return: <strong>{returnRate}%</strong></label>
                        <input type="range" min="6" max="25" step="0.5" value={returnRate} onChange={(e) => setReturnRate(Number(e.target.value))} />
                    </div>
                    
                    <div className="toggle-container">
                        <div className="toggle-header">
                            <label>Annual Step-Up ({stepUpRate}%)</label>
                            <button 
                                className={`toggle-switch ${isStepUpEnabled ? 'on' : 'off'}`} 
                                onClick={() => setIsStepUpEnabled(!isStepUpEnabled)}
                            >
                                <div className="toggle-knob" />
                            </button>
                        </div>
                         <input 
                            type="range" 
                            min="0" max="20" step="1" 
                            value={stepUpRate} 
                            disabled={!isStepUpEnabled}
                            onChange={(e) => setStepUpRate(Number(e.target.value))} 
                            className={!isStepUpEnabled ? 'disabled' : ''}
                        />
                        <p className="control-note">Increasing your investment as your income grows.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WealthSimulatorCard;
