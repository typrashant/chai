
import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { CloseIcon } from './icons.tsx';

interface InviteClientModalProps {
    advisorCode: string;
    onClose: () => void;
}

const InviteClientModal: React.FC<InviteClientModalProps> = ({ advisorCode, onClose }) => {
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);
    const inviteLink = `${window.location.origin}?advisor_code=${advisorCode}`;

    useEffect(() => {
        if (qrCanvasRef.current) {
            QRCode.toCanvas(qrCanvasRef.current, inviteLink, { width: 200, margin: 2 }, (error) => {
                if (error) console.error('Error generating QR code:', error);
            });
        }
    }, [inviteLink]);
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink).then(() => {
            alert('Invite link copied to clipboard!');
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '400px', textAlign: 'center'}}>
                <div className="modal-header">
                    <h2>Invite New Client</h2>
                    <button className="modal-close-button" onClick={onClose} aria-label="Close modal">
                        <CloseIcon />
                    </button>
                </div>
                <div className="modal-body">
                    <p>Share this QR code or link with your client to get them started on ChAi.</p>
                    <div className="invite-qr-code">
                        <canvas ref={qrCanvasRef} />
                    </div>
                    <div>
                        <input type="text" readOnly value={inviteLink} className="invite-link-input" onClick={copyToClipboard} />
                        <button className="done-button" style={{width: '100%', marginTop: '1rem'}} onClick={copyToClipboard}>Copy Link</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InviteClientModal;
