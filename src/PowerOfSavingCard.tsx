
import React, { useState, useMemo } from 'react';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

// A self-contained area chart component for this card
const SavingAreaChart = ({ data, width = 200, height = 250 }: { data: { year: number; totalValue: number; totalInvested: number }[], width?: number, height?: number }) => {
    // We need at least two points (start and end) to draw a line/area.
    if (!data || data.length < 2) {
        return <svg className="saving-chart-svg" width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" />;
    }

    const maxYear = data[data.length - 1].year;
    const maxValue = data[data.length - 1].totalValue;

    // Avoid division by zero if there's no time horizon or value
    if (maxValue === 0 || maxYear === 0) {
        return <svg className="saving-chart-svg" width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" />;
    }

    // Functions to scale data points to SVG coordinates
    const scaleX = (year: number) => (year / maxYear) * width;
    const scaleY = (value: number) => height - (value / maxValue) * height; // Y is inverted in SVG

    // Generate SVG path 'd' attribute string for total invested amount
    const investedPathData = `M${scaleX(0)},${height} ` + data.map(p => `L${scaleX(p.year)},${scaleY(p.totalInvested)}`).join(' ') + ` V${height} Z`;

    // Generate SVG path 'd' attribute string for total value (invested + gains)
    const totalValuePathData = `M${scaleX(0)},${height} ` + data.map(p => `L${scaleX(p.year)},${scaleY(p.totalValue)}`).join(' ') + ` V${height} Z`;

    return (
        <svg className="saving-chart-svg" width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-label="Line area graph showing investment growth over time">
            {/* The total value path is drawn first (background) */}
            <path className="gains-path" d={totalValuePathData}>
                <title>Total Value Growth including gains</title>
            </path>
            {/* The invested path is drawn on top (foreground) */}
            <path className="invested-path" d={investedPathData}>
                <title>Total Amount Invested</title>
            </path>
        </svg>
    );
};


const PowerOfSavingCard = () => {
    const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
    const [annualRate, setAnnualRate] = useState(12);
    const [years, setYears] = useState(20);

    const { futureValue, totalInvested, totalGains, chartData } = useMemo(() => {
        const monthlyRate = annualRate / 100 / 12;
        const dataPoints: { year: number; totalValue: number; totalInvested: number }[] = [];

        // Calculate value for each year to plot on the graph
        for (let y = 0; y <= years; y++) {
            const numberOfMonths = y * 12;
            let fv = 0;
            // Handle 0% rate case to avoid division by zero
            if (monthlyRate === 0) {
                fv = monthlyInvestment * numberOfMonths;
            } else {
                fv = monthlyInvestment * (Math.pow(1 + monthlyRate, numberOfMonths) - 1) / monthlyRate;
            }
            const invested = monthlyInvestment * numberOfMonths;
            dataPoints.push({ year: y, totalValue: fv, totalInvested: invested });
        }
        
        const finalDataPoint = dataPoints[dataPoints.length - 1] || { totalValue: 0, totalInvested: 0 };

        return {
            futureValue: finalDataPoint.totalValue,
            totalInvested: finalDataPoint.totalInvested,
            totalGains: finalDataPoint.totalValue - finalDataPoint.totalInvested,
            chartData: dataPoints
        };
    }, [monthlyInvestment, annualRate, years]);

    return (
        <div className="card power-of-saving-card">
            <h2>The Power of Saving</h2>
            <div className="saving-card-content">
                <div className="saving-chart-container">
                    <div className="saving-chart-area">
                        <SavingAreaChart data={chartData} />
                    </div>
                    <div className="saving-chart-legend">
                        <div className="legend-item">
                            <div className="legend-info">
                                <span className="legend-color" style={{ backgroundColor: '#FBBF24' }}></span>
                                <span>Invested</span>
                            </div>
                            <strong>{formatCurrency(totalInvested)}</strong>
                        </div>
                        <div className="legend-item">
                            <div className="legend-info">
                                <span className="legend-color" style={{ backgroundColor: '#4ade80' }}></span>
                                <span>Gains</span>
                            </div>
                            <strong>{formatCurrency(totalGains)}</strong>
                        </div>
                         <div className="legend-item total-value">
                            <span>Total Value</span>
                            <strong>{formatCurrency(futureValue)}</strong>
                        </div>
                    </div>
                </div>
                <div className="saving-controls">
                    <p className="saving-summary">
                        Saving <strong>{formatCurrency(monthlyInvestment)}</strong> per month for <strong>{years} years</strong> with an expected annual return of <strong>{annualRate}%</strong> could result in a total value of <strong>{formatCurrency(futureValue)}</strong>.
                    </p>
                    <div className="slider-group">
                        <label htmlFor="monthly-investment">Monthly Savings: <span>{formatCurrency(monthlyInvestment)}</span></label>
                        <input
                            type="range"
                            id="monthly-investment"
                            min="1000"
                            max="50000"
                            step="1000"
                            value={monthlyInvestment}
                            onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                            aria-valuemin={1000}
                            aria-valuemax={50000}
                            aria-valuenow={monthlyInvestment}
                            aria-label="Monthly Savings Amount"
                        />
                    </div>
                    <div className="slider-group">
                        <label htmlFor="annual-rate">Expected Return (% p.a.): <span>{annualRate}%</span></label>
                        <input
                            type="range"
                            id="annual-rate"
                            min="1"
                            max="25"
                            step="1"
                            value={annualRate}
                            onChange={(e) => setAnnualRate(Number(e.target.value))}
                            aria-valuemin={1}
                            aria-valuemax={25}
                            aria-valuenow={annualRate}
                            aria-label="Expected Annual Return Percentage"
                        />
                    </div>
                    <div className="slider-group">
                        <label htmlFor="years">Time Horizon (Years): <span>{years}</span></label>
                        <input
                            type="range"
                            id="years"
                            min="1"
                            max="40"
                            step="1"
                            value={years}
                            onChange={(e) => setYears(Number(e.target.value))}
                            aria-valuemin={1}
                            aria-valuemax={40}
                            aria-valuenow={years}
                            aria-label="Time Horizon in Years"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PowerOfSavingCard;