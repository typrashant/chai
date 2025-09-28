import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './SupabaseClient';
// FIX: Import Assets and Liabilities types for type-safe calculations.
import { type UserProfile, getAdvisorClients, getLatestFinancialSnapshot, getUserGoals, type Financials, type Goal, type Assets, type Liabilities } from './db';
import QRCode from 'qrcode';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

interface ClientData extends UserProfile {
    financials?: Financials | null;
    goals?: Goal[] | null;
    completion?: number;
    netWorth?: number;
}

const FilterIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>);

const calculateCompletion = (client: { persona: string | null, financials?: Financials | null, goals?: Goal[] | null }): number => {
    let score = 0;
    if (client.persona) score += 20;
    if (client.financials) {
        if (Object.values(client.financials.assets).some(v => v > 0)) score += 20;
        if (Object.values(client.financials.income).some(v => v.value > 0)) score += 20;
        if (Object.values(client.financials.insurance).some(v => v > 0)) score += 20;
    }
    if (client.goals && client.goals.length > 0) score += 20;
    return score;
};

const KpiCard = ({ title, value }: { title: string, value: string | number }) => (
    <div className="kpi-card">
        <h3>{title}</h3>
        <p className="value">{value}</p>
    </div>
);

const InviteModal = ({ advisor, onClose }: { advisor: UserProfile, onClose: () => void }) => {
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const inviteLink = `${window.location.origin}?advisorCode=${advisor.advisor_code}`;

    useEffect(() => {
        QRCode.toDataURL(inviteLink, { width: 200, margin: 2 }, (err, url) => {
            if (!err) setQrCodeUrl(url);
        });
    }, [inviteLink]);

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink).then(() => {
            alert('Invite link copied to clipboard!');
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Invite New Client</h2>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="invite-modal-content">
                    <div>
                        <h3>Share Invite Link</h3>
                        <div className="invite-link-container">
                            <span className="invite-link">{inviteLink}</span>
                            <button className="done-button copy-button" onClick={handleCopy}>Copy</button>
                        </div>
                    </div>
                    <div>
                        <h3>Scan QR Code</h3>
                        {qrCodeUrl && <div className="qr-code-container"><img src={qrCodeUrl} alt="Invite QR Code" /></div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdvisorDashboard = ({ advisor, onViewClientReport }: { advisor: UserProfile; onViewClientReport: (client: UserProfile) => void; }) => {
    const [clients, setClients] = useState<ClientData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({ search: '', status: 'all', regDateStart: '', regDateEnd: '', netWorthMin: '', netWorthMax: '', ageMin: '', ageMax: '' });
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isFiltersVisible, setIsFiltersVisible] = useState(false);

    useEffect(() => {
        const fetchClientData = async () => {
            if (!supabase) return;
            const initialClients = await getAdvisorClients(advisor.user_id);
            const clientIds = initialClients.map(c => c.user_id);

            if (clientIds.length > 0) {
                const [financialsResults, goalsResults] = await Promise.all([
                    supabase.from('financial_snapshots').select('user_id, snapshot_data').in('user_id', clientIds).order('snapshot_date', { ascending: false }),
                    supabase.from('goals').select('user_id, goal_id').in('user_id', clientIds)
                ]);

                const latestFinancialsMap = new Map();
                if (financialsResults.data) {
                    for (const row of financialsResults.data) {
                        if (!latestFinancialsMap.has(row.user_id)) {
                            latestFinancialsMap.set(row.user_id, row.snapshot_data);
                        }
                    }
                }
                
                const goalsMap = new Map();
                if (goalsResults.data) {
                    for (const row of goalsResults.data) {
                        if (!goalsMap.has(row.user_id)) goalsMap.set(row.user_id, []);
                        goalsMap.get(row.user_id).push(row);
                    }
                }

                const clientsWithData = initialClients.map(c => {
                    const financials = latestFinancialsMap.get(c.user_id);
                    const goals = goalsMap.get(c.user_id) || [];
                    const completion = calculateCompletion({ persona: c.persona, financials, goals });
                    // FIX: Use a type-safe method with Object.keys() to calculate sums, preventing errors from `Object.values()` returning `unknown[]`.
                    const assets = financials?.assets ? Object.keys(financials.assets).reduce((s, k) => s + Number(financials.assets![k as keyof Assets] || 0), 0) : 0;
                    const liabilities = financials?.liabilities ? Object.keys(financials.liabilities).reduce((s, k) => s + Number(financials.liabilities![k as keyof Liabilities] || 0), 0) : 0;
                    
                    return { ...c, financials, goals, completion, netWorth: assets - liabilities };
                });

                setClients(clientsWithData);
            }
            setIsLoading(false);
        };

        fetchClientData();
    }, [advisor.user_id]);
    
    const filteredClients = useMemo(() => {
        return clients.filter(c => {
            const searchLower = filters.search.toLowerCase();
            if (filters.search && !c.name.toLowerCase().includes(searchLower) && !c.phone_number.includes(searchLower)) return false;
            
            if (filters.status !== 'all') {
                if (filters.status === 'completed' && c.completion !== 100) return false;
                if (filters.status === 'in_progress' && (c.completion === 0 || c.completion === 100)) return false;
                if (filters.status === 'not_started' && c.completion !== 0) return false;
            }

            if (filters.regDateStart && new Date(c.created_at) < new Date(filters.regDateStart)) return false;
            if (filters.regDateEnd && new Date(c.created_at) > new Date(filters.regDateEnd)) return false;

            const netWorth = c.netWorth || 0;
            if (filters.netWorthMin && netWorth < Number(filters.netWorthMin)) return false;
            if (filters.netWorthMax && netWorth > Number(filters.netWorthMax)) return false;

            if (filters.ageMin && c.age < Number(filters.ageMin)) return false;
            if (filters.ageMax && c.age > Number(filters.ageMax)) return false;
            
            return true;
        });
    }, [clients, filters]);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const kpis = useMemo(() => ({
        totalClients: clients.length,
        netWorthCalculated: clients.filter(c => (c.completion || 0) >= 20).length,
        cashFlowAdded: clients.filter(c => (c.completion || 0) >= 40).length,
        planningCompleted: clients.filter(c => c.completion === 100).length,
    }), [clients]);

    if (isLoading) return <div style={{textAlign: 'center', padding: '2rem'}}>Loading Advisor Dashboard...</div>;

    return (
        <div className="advisor-dashboard">
            <div className="kpi-grid">
                <KpiCard title="Total Clients" value={kpis.totalClients} />
                <KpiCard title="Net Worth Calculated" value={kpis.netWorthCalculated} />
                <KpiCard title="Cash Flow Added" value={kpis.cashFlowAdded} />
                <KpiCard title="Planning Completed" value={kpis.planningCompleted} />
            </div>

            <div className="card client-management-card">
                 <div className="client-controls">
                     <input type="text" className="form-group input" name="search" placeholder="Search by name or phone..." value={filters.search} onChange={handleFilterChange} />
                    <div className="client-controls-right">
                        <button className={`filter-toggle-button ${isFiltersVisible ? 'active' : ''}`} onClick={() => setIsFiltersVisible(!isFiltersVisible)}>
                            <FilterIcon />
                            <span>Filters</span>
                        </button>
                        <button className="invite-button" onClick={() => setIsInviteModalOpen(true)}>+ Invite New Client</button>
                    </div>
                </div>

                {isFiltersVisible && (
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label>Completion Status</label>
                            <select name="status" value={filters.status} onChange={handleFilterChange} className="form-group select">
                                <option value="all">All Statuses</option>
                                <option value="completed">Completed (100%)</option>
                                <option value="in_progress">In Progress (1-99%)</option>
                                <option value="not_started">Not Started (0%)</option>
                            </select>
                        </div>
                         <div className="filter-group">
                            <label>Net Worth</label>
                            <div className="input-range">
                                <input type="number" name="netWorthMin" placeholder="Min" value={filters.netWorthMin} onChange={handleFilterChange} className="form-group input" />
                                <input type="number" name="netWorthMax" placeholder="Max" value={filters.netWorthMax} onChange={handleFilterChange} className="form-group input" />
                            </div>
                        </div>
                        <div className="filter-group">
                            <label>Age</label>
                            <div className="input-range">
                                <input type="number" name="ageMin" placeholder="Min" value={filters.ageMin} onChange={handleFilterChange} className="form-group input" />
                                <input type="number" name="ageMax" placeholder="Max" value={filters.ageMax} onChange={handleFilterChange} className="form-group input" />
                            </div>
                        </div>
                    </div>
                )}

                <div className="client-table-container">
                    <table className="client-table">
                        <thead>
                            <tr>
                                <th>Client Name</th>
                                <th>Registered On</th>
                                <th>Age</th>
                                <th>Net Worth</th>
                                <th>Completion</th>
                                <th>Report</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map(client => (
                                <tr key={client.user_id}>
                                    <td>
                                        <div className="client-name-cell">{client.name}</div>
                                        <div className="client-phone-cell">{client.phone_number}</div>
                                    </td>
                                    <td>{new Date(client.created_at).toLocaleDateString()}</td>
                                    <td>{client.age || 'N/A'}</td>
                                    <td>{client.netWorth != null ? formatCurrency(client.netWorth) : 'N/A'}</td>
                                    <td>
                                        <div className="completion-bar" title={`${client.completion}%`}>
                                            <div className="completion-bar-inner" style={{width: `${client.completion || 0}%`}}></div>
                                        </div>
                                    </td>
                                    <td>
                                        {client.report_shared_at ? (
                                            <button className="view-report-button" onClick={() => onViewClientReport(client)}>View Report</button>
                                        ) : (
                                            <span className="report-not-shared">Not Shared</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isInviteModalOpen && <InviteModal advisor={advisor} onClose={() => setIsInviteModalOpen(false)} />}
        </div>
    );
};

export default AdvisorDashboard;