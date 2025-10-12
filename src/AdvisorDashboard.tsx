
import React, { useState, useEffect, useMemo } from 'react';
import { type UserProfile } from './db.ts';
import { getAdvisorClientsWithStats, getLatestFinancialSnapshot, getUserGoals, type Financials, type Goal } from './db.ts';
import InviteClientModal from './InviteClientModal.tsx';
import ClientReportModal from './ClientReportModal.tsx';

// Replicated from App.tsx for reuse
const Logo = () => (
    <svg className="logo-svg" width="50" height="50" viewBox="0 0 50 50" aria-label="ChAi app logo, a steaming cutting chai glass">
        <defs><linearGradient id="glassShine" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" className="shine-start" /><stop offset="50%" className="shine-mid" /><stop offset="100%" className="shine-end" /></linearGradient></defs>
        <path className="glass-body" d="M 12,15 L 38,15 C 39,15 40,16 40,18 L 37,43 C 37,44 36,45 35,45 L 15,45 C 14,45 13,44 13,43 L 10,18 C 10,16 11,15 12,15 Z" /><path className="glass-shine" d="M 12,15 L 38,15 C 39,15 40,16 40,18 L 37,43 C 37,44 36,45 35,45 L 15,45 C 14,45 13,44 13,43 L 10,18 C 10,16 11,15 12,15 Z" fill="url(#glassShine)" /><path className="chai-liquid" d="M 14,24 L 36,24 L 35.5,41 C 35.5,42 34.5,43 33.5,43 L 16.5,43 C 15.5,43 14.5,42 14.5,41 Z" /><path className="chai-foam" d="M 14 24 C 18 22, 22 25, 25 24 C 28 23, 32 25, 36 24" />
        <g transform="translate(3,0)"><path className="steam steam-1" d="M22 8 C 25 2, 30 2, 33 8" /><path className="steam steam-2" d="M25 10 C 28 4, 33 4, 36 10" /><path className="steam steam-3" d="M20 12 C 23 6, 28 6, 31 12" /></g>
    </svg>
);
const ProfileIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);


const KPICard = ({ title, value, colorVariant }: { title: string; value: string | number; colorVariant: '1' | '2' | '3' | '4' }) => (
    <div className="kpi-card">
        <h3>{title}</h3>
        <p className={`value color-${colorVariant}`}>{value}</p>
    </div>
);

const AdvisorDashboard = ({ advisor, onLogout }: { advisor: UserProfile, onLogout: () => void }) => {
    const [clients, setClients] = useState<(UserProfile & { completion: number; netWorth: number })[]>([]);
    const [stats, setStats] = useState({ totalClients: 0, netWorthCalculated: 0, cashflowAdded: 0, planningCompleted: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
    const [clientFinancials, setClientFinancials] = useState<Financials | null>(null);
    const [clientGoals, setClientGoals] = useState<Goal[] | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        completion: 'all',
        regDateStart: '',
        regDateEnd: '',
        netWorthMin: '',
        netWorthMax: '',
        ageMin: '',
        ageMax: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const { clients: fetchedClients, stats: fetchedStats } = await getAdvisorClientsWithStats(advisor.user_id);
            setClients(fetchedClients);
            setStats(fetchedStats);
            setIsLoading(false);
        };
        fetchData();
    }, [advisor.user_id]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = client.name.toLowerCase().includes(searchLower) || client.phone_number.includes(searchLower);

            let matchesCompletion = true;
            if (filters.completion !== 'all') {
                if (filters.completion === 'completed') matchesCompletion = client.completion === 100;
                else if (filters.completion === 'in-progress') matchesCompletion = client.completion > 0 && client.completion < 100;
                else if (filters.completion === 'not-started') matchesCompletion = client.completion === 0;
            }

            const matchesRegDate = (!filters.regDateStart || new Date(client.created_at) >= new Date(filters.regDateStart)) && (!filters.regDateEnd || new Date(client.created_at) <= new Date(filters.regDateEnd));
            const matchesNetWorth = (!filters.netWorthMin || client.netWorth >= Number(filters.netWorthMin)) && (!filters.netWorthMax || client.netWorth <= Number(filters.netWorthMax));
            const matchesAge = (!filters.ageMin || client.age >= Number(filters.ageMin)) && (!filters.ageMax || client.age <= Number(filters.ageMax));

            return matchesSearch && matchesCompletion && matchesRegDate && matchesNetWorth && matchesAge;
        });
    }, [clients, searchTerm, filters]);
    
    const handleViewReport = async (client: UserProfile) => {
        setSelectedClient(client);
        const [financials, goals] = await Promise.all([
            getLatestFinancialSnapshot(client.user_id),
            getUserGoals(client.user_id)
        ]);
        setClientFinancials(financials);
        setClientGoals(goals);
    }
    
    if (isLoading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Advisor Dashboard...</div>;
    }

    return (
        <div className="container">
             <header className="header">
                <Logo />
                <div className="header-actions">
                    <div className="points-display">
                        ✨ {advisor.points}
                    </div>
                    <button className="profile-button" onClick={() => setIsProfileOpen(!isProfileOpen)}><ProfileIcon /></button>
                </div>
                {isProfileOpen && (
                    <div className="profile-dropdown">
                        <div className="profile-dropdown-item"><span>Name</span><strong>{advisor.name}</strong></div>
                        <div className="profile-dropdown-item"><span>Phone</span><strong>{advisor.phone_number}</strong></div>
                        <div className="profile-dropdown-item"><span>Advisor Code</span><strong>{advisor.advisor_code}</strong></div>
                        <div className="profile-dropdown-divider"></div>
                        <button className="logout-button" onClick={onLogout}>Logout</button>
                    </div>
                )}
            </header>
            <main>
                <div className="kpi-grid">
                    <KPICard title="Total Clients" value={stats.totalClients} colorVariant="1" />
                    <KPICard title="Net Worth Calculated" value={stats.netWorthCalculated} colorVariant="2" />
                    <KPICard title="Cash Flow Added" value={stats.cashflowAdded} colorVariant="3" />
                    <KPICard title="Planning Completed" value={stats.planningCompleted} colorVariant="4" />
                </div>

                <div className="client-management-section">
                    <div className="client-controls-header">
                        <h2>Client Management</h2>
                        <button className="done-button" onClick={() => setIsInviteModalOpen(true)}>Invite New Client</button>
                    </div>

                    <div className="client-filters-container">
                        <input type="text" placeholder="Search by name or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="filter-search-input" />
                        <div className="filter-group">
                            <label htmlFor="completion">Status</label>
                            <select id="completion" name="completion" value={filters.completion} onChange={handleFilterChange}>
                                <option value="all">All</option>
                                <option value="completed">Completed</option>
                                <option value="in-progress">In Progress</option>
                                <option value="not-started">Not Started</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label htmlFor="regDateStart">Registered</label>
                            <div className="filter-input-range">
                                <input type="date" id="regDateStart" name="regDateStart" value={filters.regDateStart} onChange={handleFilterChange} title="Registration start date" />
                                <span>-</span>
                                <input type="date" id="regDateEnd" name="regDateEnd" value={filters.regDateEnd} onChange={handleFilterChange} title="Registration end date" />
                            </div>
                        </div>
                        <div className="filter-group">
                            <label htmlFor="ageMin">Age</label>
                            <div className="filter-input-range">
                                <input type="number" id="ageMin" name="ageMin" placeholder="Min" value={filters.ageMin} onChange={handleFilterChange} />
                                <span>-</span>
                                <input type="number" id="ageMax" name="ageMax" placeholder="Max" value={filters.ageMax} onChange={handleFilterChange} />
                            </div>
                        </div>
                        <div className="filter-group">
                            <label htmlFor="netWorthMin">Net Worth</label>
                            <div className="filter-input-range">
                                <input type="number" id="netWorthMin" name="netWorthMin" placeholder="Min" value={filters.netWorthMin} onChange={handleFilterChange} />
                                <span>-</span>
                                <input type="number" id="netWorthMax" name="netWorthMax" placeholder="Max" value={filters.netWorthMax} onChange={handleFilterChange} />
                            </div>
                        </div>
                    </div>
                    <div className="table-wrapper">
                        <table className="client-list-table">
                            <thead>
                                <tr>
                                    <th>Client Name</th>
                                    <th>Completion</th>
                                    <th>Report</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClients.map(client => (
                                    <tr key={client.user_id}>
                                        <td data-label="Client Name">
                                            <div className="client-info">
                                                <span>{client.name}</span>
                                                <span>{client.phone_number}</span>
                                            </div>
                                        </td>
                                        <td data-label="Completion">
                                            <div className="completion-bar-container">
                                                <div className="completion-bar"><div className="completion-bar-inner" style={{ width: `${client.completion}%` }}></div></div>
                                                <span>{client.completion}%</span>
                                            </div>
                                        </td>
                                        <td data-label="Report">
                                            {client.report_shared_at ? (
                                                <button className="update-button view-report-btn" onClick={() => handleViewReport(client)}>View Report</button>
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
            </main>

            {isInviteModalOpen && <InviteClientModal advisorCode={advisor.advisor_code || ''} onClose={() => setIsInviteModalOpen(false)} />}
            {selectedClient && clientFinancials && clientGoals && (
                <ClientReportModal 
                    client={selectedClient} 
                    financials={clientFinancials}
                    goals={clientGoals}
                    onClose={() => setSelectedClient(null)} 
                />
            )}
        </div>
    );
};

export default AdvisorDashboard;
