import React, { useState, useEffect } from 'react';
import { getAdvisorClients, type UserProfile, type ClientProfile } from './db';
import { CloseIcon } from './icons';

const AdvisorInviteModal = ({ inviteLink, onClose }: { inviteLink: string, onClose: () => void }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Invite a New Client</h2>
                    <button className="modal-close-button" onClick={onClose}><CloseIcon /></button>
                </div>
                <div className="modal-body">
                    <p>Share this unique link with your clients to onboard them. Their profile will automatically be linked to your dashboard.</p>
                    <div className="form-group">
                        <label htmlFor="invite-link">Your Invite Link</label>
                        <input id="invite-link" type="text" readOnly value={inviteLink} />
                    </div>
                </div>
                <div className="modal-footer" style={{paddingTop: '0.5rem'}}>
                     <button className="action-button-primary" style={{width: '100%'}} onClick={handleCopy}>
                        {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                </div>
            </div>
        </div>
    );
};


const AdvisorDashboard = ({ user }: { user: UserProfile }) => {
    const [clients, setClients] = useState<ClientProfile[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    
    useEffect(() => {
        const fetchClients = async () => {
            const fetchedClients = await getAdvisorClients(user.user_id);
            setClients(fetchedClients);
            setIsLoading(false);
        };
        fetchClients();
    }, [user.user_id]);
    
    const inviteLink = `${window.location.origin}?advisor_id=${user.user_id}`;

    return (
        <main className="advisor-dashboard">
            <div className="advisor-header">
                <h1>Client Dashboard</h1>
                <button className="action-button-primary" onClick={() => setIsInviteModalOpen(true)}>Invite Client</button>
            </div>

            <div className="client-list-container">
                {isLoading ? (
                    <p>Loading clients...</p>
                ) : !clients || clients.length === 0 ? (
                    <div className="summary-placeholder" style={{padding: '3rem'}}>
                        <p>You haven't invited any clients yet. Click "Invite Client" to get started.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="goal-summary-table">
                            <thead>
                                <tr>
                                    <th>Client Name</th>
                                    <th>Phone</th>
                                    <th>Persona</th>
                                    <th>Joined On</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map(client => (
                                    <tr key={client.user_id}>
                                        <td>{client.name}</td>
                                        <td>{client.phone_number}</td>
                                        <td>{client.persona || 'N/A'}</td>
                                        <td>{new Date(client.created_at).toLocaleDateString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            {isInviteModalOpen && <AdvisorInviteModal inviteLink={inviteLink} onClose={() => setIsInviteModalOpen(false)} />}
        </main>
    );
};

export default AdvisorDashboard;