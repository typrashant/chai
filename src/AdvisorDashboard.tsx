import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { type UserProfile, getAdvisorClients, getLatestFinancialSnapshot, type Financials } from './db.ts';
import ClientReportModal from './ClientReportModal.tsx';

interface AdvisorDashboardProps {
    user: UserProfile;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const AdvisorDashboard: React.FC<AdvisorDashboardProps> = ({ user }) => {
    const [clients, setClients] = useState<UserProfile[]>([]);
    const [clientFinancials, setClientFinancials] = useState<Map<string, Financials>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
    
    // Filtering state
    const [searchTerm, setSearchTerm] = useState('');
    const [completionFilter, setCompletionFilter] = useState('all');

    useEffect(() => {
        const fetchClientsAndData = async () => {
            setIsLoading(true);
            const fetchedClients = await getAdvisorClients(user.user_id);
            setClients(fetchedClients);

            const financialsMap = new Map<string, Financials>();
            await Promise.all(fetchedClients.map(async (client) => {
                const financials = await getLatestFinancialSnapshot(client.user_id);
                if (financials) {
                    financialsMap.set(client.user_id, financials);
                }
            }));
            setClientFinancials(financialsMap);
            setIsLoading(false);
        };

        fetchClientsAndData();
    }, [user.user_id]);

    const inviteLink = `${window.location.origin}?advisorCode=${user.advisor_code}`;

    useEffect(() => {
        if (isInviteModalOpen && user.advisor_code) {
            QRCode.toDataURL(inviteLink, { width: 200, margin: 2 })
                .then(url => setQrCodeUrl(url))
                .catch(err => console.error(err));
        }
    }, [isInviteModalOpen, user.advisor_code, inviteLink]);
    
    const clientData = useMemo(() => {
        return clients.map(client => {
            const financials = clientFinancials.get(client.user_id);
            const netWorth = financials ? Object.values(financials.assets).reduce((s, v) => s + v, 0) - Object.values(financials.liabilities).reduce((s, v) => s + v, 0) : null;
            
            let completion = 0;
            const sources = (client.points_source as any) || {};
            if (client.persona) completion += 20;
            if (sources.netWorth) completion += 20;
            if (sources.monthlyFinances) completion += 20;
            if (sources.financialProtection) completion += 20;
            if (sources.financialGoals) completion += 20;

            return { ...client, netWorth, completion };
        });
    }, [clients, clientFinancials]);

    const filteredClients = useMemo(() => {
        return clientData.filter(client => {
            const searchMatch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || client.phone_number.includes(searchTerm);
            const completionMatch = completionFilter === 'all' ||
                (completionFilter === 'completed' && client.completion === 100) ||
                (completionFilter === 'inprogress' && client.completion > 0 && client.completion < 100) ||
                (completionFilter === 'notstarted' && client.completion === 0);
            
            return searchMatch && completionMatch;
        });
    }, [clientData, searchTerm, completionFilter]);
    
     const kpis = useMemo(() => {
        const totalClients = clientData.length;
        const netWorthCalculated = clientData.filter(c => (c.points_source as any)?.netWorth).length;
        const cashFlowAdded = clientData.filter(c => (c.points_source as any)?.monthlyFinances).length;
        const planningCompleted = clientData.filter(c => c.completion === 100).length;
        return { totalClients, netWorthCalculated, cashFlowAdded, planningCompleted };
    }, [clientData]);

    if (isLoading) {
        return <div>Loading clients...</div>;
    }

    return (
        <div className="advisor-dashboard-container">
            <section className="kpi-grid">
                <div className="kpi-card"><h3>Total Clients</h3><p className="value">{kpis.totalClients}</p></div>
                <div className="kpi-card"><h3>Net Worth Added</h3><p className="value">{kpis.netWorthCalculated}</p></div>
                <div className="kpi-card"><h3>Cash Flow Added</h3><p className="value">{kpis.cashFlowAdded}</p></div>
                <div className="kpi-card"><h3>Planning Complete</h3><p className="value">{kpis.planningCompleted}</p></div>
            </section>
            
            <section className="client-management-section card">
                 <div className="client-controls-header">
                     <h2>Client Management</h2>
                     <button className="done-button" onClick={() => setIsInviteModalOpen(true)}>Invite New Client</button>
                 </div>
                 <div className="client-filters">
                    <input type="text" placeholder="Search by name or phone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <select value={completionFilter} onChange={e => setCompletionFilter(e.target.value)}>
                        <option value="all">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="inprogress">In Progress</option>
                        <option value="notstarted">Not Started</option>
                    </select>
                 </div>
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
                            {filteredClients.length > 0 ? filteredClients.map(client => (
                                <tr key={client.user_id}>
                                    <td>
                                        <span className="client-name">{client.name}</span>
                                        <span className="client-phone">{client.phone_number}</span>
                                    </td>
                                    <td>{new Date(client.created_at).toLocaleDateString()}</td>
                                    <td>{client.age}</td>
                                    <td>{client.netWorth !== null ? formatCurrency(client.netWorth) : 'N/A'}</td>
                                    <td>
                                        <div className="completion-bar" title={`${client.completion}% Complete`}>
                                            <div className="completion-bar-inner" style={{width: `${client.completion}%`}}></div>
                                        </div>
                                    </td>
                                    <td>
                                        {client.report_shared_at ? (
                                            <button className="update-button" onClick={() => setSelectedClient(client)}>View Report</button>
                                        ) : (
                                            <span className="not-shared-text">Not Shared</span>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} style={{textAlign: 'center', padding: '2rem'}}>No clients found.</td>
                                </tr>
                            )}
                         </tbody>
                     </table>
                 </div>
            </section>

            {isInviteModalOpen && (
                <div className="modal-overlay" onClick={() => setIsInviteModalOpen(false)}>
                    <div className="modal-content invite-modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Invite New Client</h3>
                        <p>Share your code, link, or QR code with new clients to onboard them.</p>
                        <div className="advisor-code-display">{user.advisor_code}</div>
                        {qrCodeUrl && <div className="qr-code-container"><img src={qrCodeUrl} alt="QR Code" /></div>}
                        <input type="text" readOnly value={inviteLink} style={{textAlign: 'center', fontSize: '0.8rem'}} onFocus={e => e.target.select()} />
                        <button className="done-button" style={{marginTop: '1.5rem'}} onClick={() => setIsInviteModalOpen(false)}>Close</button>
                    </div>
                </div>
            )}
            
            {selectedClient && (
                <ClientReportModal client={selectedClient} onClose={() => setSelectedClient(null)} />
            )}

        </div>
    );
};

export default AdvisorDashboard;
