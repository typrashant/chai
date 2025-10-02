
import React, { useState, useEffect, useMemo } from 'react';
import { type UserProfile } from './db.ts';
import { getAdvisorClientsWithStats, getLatestFinancialSnapshot, getUserGoals, type Financials, type Goal } from './db.ts';
import InviteClientModal from './InviteClientModal.tsx';
import ClientReportModal from './ClientReportModal.tsx';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const KPICard = ({ title, value }: { title: string; value: string | number }) => (
    <div className="kpi-card">
        <h3>{title}</h3>
        <p className="value">{value}</p>
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
            // Search
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = client.name.toLowerCase().includes(searchLower) || client.phone_number.includes(searchLower);

            // Completion Filter
            let matchesCompletion = true;
            if (filters.completion !== 'all') {
                if (filters.completion === 'completed') matchesCompletion = client.completion === 100;
                else if (filters.completion === 'in-progress') matchesCompletion = client.completion > 0 && client.completion < 100;
                else if (filters.completion === 'not-started') matchesCompletion = client.completion === 0;
            }

            // Other filters
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
        <div className="advisor-dashboard">
            <div className="kpi-grid">
                <KPICard title="Total Clients" value={stats.totalClients} />
                <KPICard title="Net Worth Calculated" value={stats.netWorthCalculated} />
                <KPICard title="Cash Flow Added" value={stats.cashflowAdded} />
                <KPICard title="Planning Completed" value={stats.planningCompleted} />
            </div>

            <div className="client-management-section">
                <div className="client-controls-header">
                    <h2>Client Management</h2>
                    <button className="done-button" onClick={() => setIsInviteModalOpen(true)}>Invite New Client</button>
                </div>

                <div className="client-filters">
                    <input type="text" placeholder="Search by name or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <div className="form-group">
                        <label htmlFor="completion">Status</label>
                        <select id="completion" name="completion" value={filters.completion} onChange={handleFilterChange}>
                            <option value="all">All Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="in-progress">In Progress</option>
                            <option value="not-started">Not Started</option>
                        </select>
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
                                    <td>
                                        <div className="client-info">
                                            <span>{client.name}</span>
                                            <span>{client.phone_number}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="completion-bar-container">
                                            <div className="completion-bar"><div className="completion-bar-inner" style={{ width: `${client.completion}%` }}></div></div>
                                            <span>{client.completion}%</span>
                                        </div>
                                    </td>
                                    <td>
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
