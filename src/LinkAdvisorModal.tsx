import React, { useState } from 'react';
import { CloseIcon } from './icons';

interface LinkAdvisorModalProps {
    onClose: () => void;
    onLink: (code: string) => Promise<void>;
}

const LinkAdvisorModal: React.FC<LinkAdvisorModalProps> = ({ onClose, onLink }) => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;
        setIsLoading(true);
        await onLink(code);
        setIsLoading(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="modal-header">
                        <h2>Link to Financial Professional</h2>
                        <button type="button" className="modal-close-button" onClick={onClose}><CloseIcon /></button>
                    </div>
                    <div className="modal-body">
                        <p>Enter the unique code provided by your financial advisor to link your accounts.</p>
                        <div className="form-group">
                            <label htmlFor="advisor-code">Advisor Code</label>
                            <input
                                id="advisor-code"
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="e.g., ADVXXXXXX"
                                required
                            />
                        </div>
                    </div>
                    <div className="modal-footer" style={{paddingTop: '0.5rem'}}>
                         <button className="action-button-primary" style={{width: '100%'}} type="submit" disabled={isLoading}>
                            {isLoading ? 'Linking...' : 'Link Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LinkAdvisorModal;