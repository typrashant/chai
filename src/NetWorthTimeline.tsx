
import React, { useMemo } from 'react';
import { type UserProfile, type FinancialSnapshot } from './db';

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
    financialHistory: FinancialSnapshot[];
    onBack: () => void;
}

const NetWorthTimeline: React.FC<NetWorthTimelineProps> = ({ user, metrics, financialHistory, onBack }) => {
    const { monthlyIncome } = metrics;
    const age = user.age || 25;
    const annualIncome = monthlyIncome * 12;

    const chartData = useMemo(() => {
        const userProgressPoints = financialHistory
            .map(snapshot => {
                if (!snapshot.snapshot_data?.assets || !snapshot.snapshot_date) return null;
                const assets = Object.values(snapshot.snapshot_data.assets).reduce((s, v) => s + Number(v), 0);
                const liabilities = Object.values(snapshot.snapshot_data.liabilities || {}).reduce((s, v) => s + Number(v), 0);
                const snapshotNetWorth = assets - liabilities;

                const yearsAgo = (new Date().getTime() - new Date(snapshot.snapshot_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                const ageAtSnapshot = age - yearsAgo;

                return { age: ageAtSnapshot, value: snapshotNetWorth };
            })
            .filter((p): p is { age: number, value: number } => p !== null && p.value >= 0);

        const earliestAge = userProgressPoints.length > 0 ? userProgressPoints[0].age : age;
        const startAge = Math.max(18, Math.floor(earliestAge) - 2);
        const endAge = 85;

        const benchmarkPoints = Array.from({ length: endAge - startAge + 1 }, (_, i) => {
            const currentAge = startAge + i;
            return { age: currentAge, value: (annualIncome / 10) * currentAge };
        });

        const maxBenchmarkValue = benchmarkPoints[benchmarkPoints.length - 1]?.value || 0;
        const maxUserValue = Math.max(0, ...userProgressPoints.map(p => p.value));
        const maxYValue = Math.max(maxUserValue, maxBenchmarkValue) * 1.1;

        return { startAge, endAge, benchmarkPoints, userProgressPoints, maxYValue };
    }, [age, annualIncome, financialHistory]);

    const { startAge, endAge, benchmarkPoints, userProgressPoints, maxYValue } = chartData;

    const width = 800;
    const height = 400;
    const padding = { top: 20, right: 30, bottom: 50, left: 70 };

    const { yAxisTicks, effectiveMaxY } = useMemo(() => {
        if (maxYValue <= 0) {
            const defaultMax = 5000000, defaultInterval = 1000000;
            return { yAxisTicks: Array.from({ length: defaultMax / defaultInterval + 1 }, (_, i) => i * defaultInterval), effectiveMaxY: defaultMax };
        }
        const tenLakh = 1000000;
        const interval = Math.max(tenLakh, Math.ceil((maxYValue / 5) / tenLakh) * tenLakh);
        const newMaxY = Math.ceil(maxYValue / interval) * interval;
        const ticks = Array.from({ length: newMaxY / interval + 1 }, (_, i) => i * interval);
        return { yAxisTicks: ticks.length > 1 ? ticks : [0, interval], effectiveMaxY: newMaxY > 0 ? newMaxY : interval };
    }, [maxYValue]);

    const xAxisTicks = useMemo(() => {
        const ticks = [];
        const firstTick = Math.ceil(startAge / 5) * 5;
        for (let ageVal = firstTick; ageVal <= endAge; ageVal += 5) ticks.push(ageVal);
        return ticks;
    }, [startAge, endAge]);

    const xScale = (ageVal: number) => padding.left + ((ageVal - startAge) / (endAge - startAge)) * (width - padding.left - padding.right);
    const yScale = (netWorthVal: number) => {
        if (effectiveMaxY === 0) return height - padding.bottom;
        return height - padding.bottom - (netWorthVal / effectiveMaxY) * (height - padding.top - padding.bottom);
    };

    const benchmarkPath = useMemo(() => benchmarkPoints.map(p => `${xScale(p.age)},${yScale(p.value)}`).join(' '), [benchmarkPoints, xScale, yScale]);
    const userProgressPath = useMemo(() => userProgressPoints.map(p => `${xScale(p.age)},${yScale(p.value)}`).join(' '), [userProgressPoints, xScale, yScale]);

    return (
        <div className="card networth-timeline-view">
            <div className="timeline-header-container">
                <header className="timeline-header">
                    <button className="back-button" onClick={onBack} aria-label="Go back to dashboard">&lt;</button>
                    <h2>Net Worth Timeline</h2>
                </header>
                <div className="timeline-legend">
                    <div className="legend-item">
                        <span className="legend-color user-point"></span>
                        <span>Your Progress</span>
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
                    {yAxisTicks.map((tick, i) => (
                        <g key={i} className="grid-line-group">
                            <line x1={padding.left} y1={yScale(tick)} x2={width - padding.right} y2={yScale(tick)} className="grid-line" />
                            <text x={padding.left - 15} y={yScale(tick)} className="axis-label" textAnchor="end" alignmentBaseline="middle">{formatInLakhs(tick)}</text>
                        </g>
                    ))}
                    <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} className="axis-line" />
                    {xAxisTicks.map((tick, i) => (
                         <text key={i} x={xScale(tick)} y={height - padding.bottom + 25} className="axis-label" textAnchor="middle">{tick}</text>
                    ))}
                    <text x={width / 2} y={height - 5} className="axis-label x-axis-title" textAnchor="middle">Age</text>
                    <polyline points={benchmarkPath} className="benchmark-line" fill="none" strokeDasharray="5,5" />
                    {userProgressPoints.length > 1 && <polyline points={userProgressPath} className="user-progress-line" />}
                    {userProgressPoints.map((point, i) => (
                        <circle
                            key={i}
                            cx={xScale(point.age)}
                            cy={yScale(point.value)}
                            r={i === userProgressPoints.length - 1 ? 6 : 4}
                            className="user-progress-point"
                        >
                            <title>Net worth: {formatCurrency(point.value)} at age {point.age.toFixed(1)}</title>
                        </circle>
                    ))}
                </svg>
            </div>
        </div>
    );
};

export default NetWorthTimeline;
