import React, { useMemo } from 'react';
import { type UserProfile } from './db';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const formatInLakhs = (value: number) => {
    if (value === 0) return '₹0';
    const lakhs = value / 100000;
    // Show one decimal for values less than 1 Lakh for better precision
    const formatted = (lakhs < 1 && lakhs > 0) || (lakhs > 1 && lakhs % 1 !== 0) ? lakhs.toFixed(1) : lakhs.toFixed(0);
    return `₹${formatted}L`;
};

interface NetWorthTimelineProps {
    user: UserProfile;
    metrics: {
        netWorth: number;
        monthlyIncome: number;
    };
    onBack: () => void;
}

const NetWorthTimeline: React.FC<NetWorthTimelineProps> = ({ user, metrics, onBack }) => {
    const { netWorth, monthlyIncome } = metrics;
    const age = user.age || 25; // fallback age
    const annualIncome = monthlyIncome * 12;

    const chartData = useMemo(() => {
        const startAge = Math.max(18, age - 10);
        const endAge = 85;

        // Benchmark calculation: (Annual Income / 10) * Age
        const benchmarkPoints = Array.from({ length: endAge - startAge + 1 }, (_, i) => {
            const currentAge = startAge + i;
            return {
                age: currentAge,
                value: (annualIncome / 10) * currentAge,
            };
        });

        const maxBenchmarkValue = benchmarkPoints[benchmarkPoints.length - 1].value;
        const maxYValue = Math.max(netWorth, maxBenchmarkValue) * 1.1; // Add 10% padding

        return {
            startAge,
            endAge,
            benchmarkPoints,
            maxYValue,
        };
    }, [age, netWorth, annualIncome]);

    const { startAge, endAge, benchmarkPoints, maxYValue } = chartData;

    // SVG dimensions and padding
    const width = 800;
    const height = 400;
    const padding = { top: 20, right: 30, bottom: 50, left: 70 };

    const { yAxisTicks, effectiveMaxY } = useMemo(() => {
        if (maxYValue <= 0) {
            const defaultMax = 5000000; // 50 Lakhs
            const defaultInterval = 1000000; // 10 Lakhs
            const ticks = [];
            for (let i = 0; i <= defaultMax; i += defaultInterval) {
                ticks.push(i);
            }
            return { yAxisTicks: ticks, effectiveMaxY: defaultMax };
        }

        const desiredTickCount = 5;
        const roughInterval = maxYValue / desiredTickCount;
        
        const tenLakh = 1000000;
        const interval = Math.max(tenLakh, Math.ceil(roughInterval / tenLakh) * tenLakh);
        
        const newMaxY = Math.ceil(maxYValue / interval) * interval;

        const ticks = [];
        for (let i = 0; i <= newMaxY; i += interval) {
            ticks.push(i);
        }

        return { yAxisTicks: ticks.length > 1 ? ticks : [0, interval], effectiveMaxY: newMaxY > 0 ? newMaxY : interval };
    }, [maxYValue]);

    const xAxisTicks = useMemo(() => {
        const ticks = [];
        const interval = 5;
        const firstTick = Math.ceil(startAge / interval) * interval;
        for (let ageVal = firstTick; ageVal <= endAge; ageVal += interval) {
            ticks.push(ageVal);
        }
        return ticks;
    }, [startAge, endAge]);


    const xScale = (ageVal: number) => {
        return padding.left + ((ageVal - startAge) / (endAge - startAge)) * (width - padding.left - padding.right);
    };

    const yScale = (netWorthVal: number) => {
        if (effectiveMaxY === 0) return height - padding.bottom;
        return height - padding.bottom - (netWorthVal / effectiveMaxY) * (height - padding.top - padding.bottom);
    };
    
    const benchmarkPath = useMemo(() => {
        return benchmarkPoints.map(p => `${xScale(p.age)},${yScale(p.value)}`).join(' ');
    }, [benchmarkPoints, xScale, yScale]);

    return (
        <div className="card networth-timeline-view">
            <div className="timeline-header-container">
                <header className="timeline-header">
                    <button className="back-button" onClick={onBack} aria-label="Go back to dashboard">
                        &lt;
                    </button>
                    <h2>Net Worth Timeline</h2>
                </header>
                <div className="timeline-legend">
                    <div className="legend-item">
                        <span className="legend-color user-point"></span>
                        <span>Your Net Worth</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-color benchmark-point"></span>
                        <span>Benchmark for your income & age</span>
                    </div>
                </div>
            </div>
            <div className="timeline-chart-container">
                <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="figure" aria-label="Net worth timeline chart">
                    <title>Chart of your net worth compared to a benchmark over time</title>
                    {/* Y-axis grid lines and labels */}
                    {yAxisTicks.map((tick, i) => (
                        <g key={i} className="grid-line-group">
                            <line
                                x1={padding.left}
                                y1={yScale(tick)}
                                x2={width - padding.right}
                                y2={yScale(tick)}
                                className="grid-line"
                            />
                            <text x={padding.left - 15} y={yScale(tick)} className="axis-label y-axis-label" textAnchor="end" alignmentBaseline="middle">
                                {formatInLakhs(tick)}
                            </text>
                        </g>
                    ))}

                    {/* X-axis and labels */}
                    <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} className="axis-line" />
                    {xAxisTicks.map((tick, i) => (
                         <text key={i} x={xScale(tick)} y={height - padding.bottom + 25} className="axis-label x-axis-label" textAnchor="middle">
                            {tick}
                        </text>
                    ))}
                    <text x={width / 2} y={height - 5} className="axis-label x-axis-title" textAnchor="middle">Age</text>
                    
                    {/* Benchmark line */}
                    <polyline
                        points={benchmarkPath}
                        className="benchmark-line"
                        fill="none"
                        strokeDasharray="5,5"
                    />

                    {/* User's net worth point */}
                    {netWorth >= 0 && (
                         <circle
                            cx={xScale(age)}
                            cy={yScale(netWorth)}
                            r="6"
                            className="user-networth-point"
                         >
                             <title>Your current net worth: {formatCurrency(netWorth)} at age {age}</title>
                         </circle>
                    )}
                </svg>
            </div>
        </div>
    );
};

export default NetWorthTimeline;
