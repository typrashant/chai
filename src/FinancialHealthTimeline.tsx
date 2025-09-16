import React, { useMemo } from 'react';

type RagStatus = 'green' | 'amber' | 'red' | 'neutral';
interface Ratio {
  value: number;
  status: RagStatus;
}
interface Ratios {
  savingsRatio: Ratio;
  financialAssetRatio: Ratio;
  liquidityRatio: Ratio;
  leverageRatio: Ratio;
  debtToIncomeRatio: Ratio;
  wealthRatio: Ratio;
}
interface HistoricalRatioData {
    age: number;
    ratios: Ratios;
}

const ratioDetails: { [K in keyof Ratios]: { name: string; description: string; suffix: string, benchmarks: { green: number, amber: number, reversed?: boolean } } } = {
    savingsRatio: { name: 'Savings Ratio', description: '% of income saved', suffix: '%', benchmarks: { green: 20, amber: 10 } },
    financialAssetRatio: { name: 'Financial Asset Ratio', description: '% of assets in financial investments', suffix: '%', benchmarks: { green: 50, amber: 25 } },
    liquidityRatio: { name: 'Liquidity Ratio', description: 'Months of expenses covered', suffix: ' months', benchmarks: { green: 6, amber: 3 } },
    leverageRatio: { name: 'Leverage Ratio', description: '% of assets funded by debt', suffix: '%', benchmarks: { green: 30, amber: 50, reversed: true } },
    debtToIncomeRatio: { name: 'Debt to Income Ratio', description: '% of income for EMIs', suffix: '%', benchmarks: { green: 36, amber: 43, reversed: true } },
    wealthRatio: { name: 'Wealth Ratio', description: 'Net worth / annual income', suffix: '%', benchmarks: { green: 200, amber: 100 } },
};

interface RatioTimelineChartProps {
    title: string;
    description: string;
    suffix: string;
    data: { age: number, value: number }[];
    benchmarks: { green: number, amber: number, reversed?: boolean };
}

const RatioTimelineChart: React.FC<RatioTimelineChartProps> = ({ title, description, suffix, data, benchmarks }) => {
    const width = 300;
    const height = 150;
    const padding = { top: 10, right: 20, bottom: 30, left: 45 };

    const { minX, maxX, minY, maxY } = useMemo(() => {
        if (data.length === 0) return { minX: 20, maxX: 60, minY: 0, maxY: 100 };
        const xValues = data.map(d => d.age);
        const yValues = data.map(d => d.value);

        const dataMinY = Math.min(...yValues);
        const dataMaxY = Math.max(...yValues);
        const range = Math.max(dataMaxY - dataMinY, benchmarks.green * 0.2); // Ensure a minimum range

        return {
            minX: Math.min(...xValues),
            maxX: Math.max(...xValues),
            minY: Math.max(0, dataMinY - range * 0.2), // give a little space below
            maxY: dataMaxY + range * 0.2, // and above
        };
    }, [data, benchmarks]);

    const yAxisTicks = useMemo(() => {
        const tickCount = 3;
        if (maxY <= minY) return [maxY];
        const ticks = [];
        const interval = (maxY - minY) / (tickCount - 1);
        for (let i = 0; i < tickCount; i++) {
            ticks.push(minY + i * interval);
        }
        return ticks;
    }, [minY, maxY]);
    
    if (data.length < 2) {
        return (
             <div className="ratio-timeline-card">
                <h3>{title}</h3>
                <p>{description}</p>
                <div className="summary-placeholder" style={{flexGrow: 1}}>
                    <p>Not enough data to show a trend.</p>
                </div>
            </div>
        )
    }

    const xScale = (age: number) => padding.left + ((age - minX) / (maxX - minX)) * (width - padding.left - padding.right);
    const yScale = (value: number) => {
        if (maxY === minY) return height / 2;
        return height - padding.bottom - ((value - minY) / (maxY - minY)) * (height - padding.top - padding.bottom);
    }
    
    const linePath = data.map(d => `${xScale(d.age)},${yScale(d.value)}`).join(' ');

    const { greenZone, amberZone, redZone } = useMemo(() => {
        const zones = {
            green: { y: 0, height: 0 },
            amber: { y: 0, height: 0 },
            red: { y: 0, height: 0 },
        };
        const chartHeight = height - padding.top - padding.bottom;

        if (benchmarks.reversed) {
            zones.green.y = yScale(benchmarks.green);
            zones.green.height = Math.max(0, chartHeight - zones.green.y);
            
            zones.amber.y = yScale(benchmarks.amber);
            zones.amber.height = Math.max(0, zones.green.y - zones.amber.y);

            zones.red.y = padding.top;
            zones.red.height = Math.max(0, zones.amber.y - padding.top);
        } else {
            zones.green.y = padding.top;
            zones.green.height = Math.max(0, yScale(benchmarks.green) - padding.top);

            zones.amber.y = yScale(benchmarks.green);
            zones.amber.height = Math.max(0, yScale(benchmarks.amber) - zones.green.y);

            zones.red.y = yScale(benchmarks.amber);
            zones.red.height = Math.max(0, (height - padding.bottom) - zones.red.y);
        }
        return { greenZone: zones.green, amberZone: zones.amber, redZone: zones.red };
    }, [yScale, benchmarks, height, padding]);
    
    const lastValue = data[data.length - 1]?.value.toFixed(title.includes('Liquidity') ? 1 : 0);

    return (
        <div className="ratio-timeline-card">
            <h3>{title}</h3>
            <p>{description}: <strong style={{color: 'var(--text-color)'}}>{lastValue}{suffix}</strong></p>
            <div className="ratio-chart-container">
                <svg className="ratio-chart-svg" width="100%" viewBox={`0 0 ${width} ${height}`} aria-label={`Chart of ${title} over time`}>
                    {/* Y-Axis Grid Lines and Labels */}
                    {yAxisTicks.map((tick, i) => (
                        <g key={i} className="y-axis-tick">
                            <line 
                                className="grid-line"
                                x1={padding.left} y1={yScale(tick)} 
                                x2={width - padding.right} y2={yScale(tick)} 
                                strokeDasharray={i > 0 && i < yAxisTicks.length - 1 ? '2,3' : 'none'}
                            />
                            <text 
                                className="axis-label"
                                x={padding.left - 8} y={yScale(tick)} 
                                textAnchor="end" 
                                alignmentBaseline="middle"
                            >
                                {tick.toFixed(title.includes('Liquidity') ? 1 : 0)}
                            </text>
                        </g>
                    ))}

                    <rect x={padding.left} y={redZone.y} width={width - padding.left - padding.right} height={redZone.height} className="benchmark-zone-red" />
                    <rect x={padding.left} y={amberZone.y} width={width - padding.left - padding.right} height={amberZone.height} className="benchmark-zone-amber" />
                    <rect x={padding.left} y={greenZone.y} width={width - padding.left - padding.right} height={greenZone.height} className="benchmark-zone-green" />
                    
                    <polyline points={linePath} className="user-ratio-line" />

                    <text x={padding.left} y={height - padding.bottom + 15} className="axis-label" textAnchor="start">{minX.toFixed(0)} yrs</text>
                    <text x={width-padding.right} y={height - padding.bottom + 15} className="axis-label" textAnchor="end">{maxX.toFixed(0)} yrs</text>
                </svg>
            </div>
        </div>
    );
};


interface FinancialHealthTimelineProps {
  historicalRatios: HistoricalRatioData[];
  onBack: () => void;
}

const FinancialHealthTimeline: React.FC<FinancialHealthTimelineProps> = ({ historicalRatios, onBack }) => {
    
    return (
        <div className="financial-health-timeline-view">
            <header className="timeline-header">
                <button className="back-button" onClick={onBack} aria-label="Go back to dashboard">&lt;</button>
                <h2>Financial Health Timeline</h2>
            </header>
            <div className="financial-health-grid">
                {(Object.keys(ratioDetails) as Array<keyof Ratios>).map(key => {
                    const details = ratioDetails[key];
                    const chartData = historicalRatios.map(h => ({
                        age: h.age,
                        value: h.ratios[key].value
                    }));

                    return (
                        <RatioTimelineChart
                            key={key}
                            title={details.name}
                            description={details.description}
                            suffix={details.suffix}
                            data={chartData}
                            benchmarks={details.benchmarks}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default FinancialHealthTimeline;