
import React from 'react';
import { CloseIcon } from './icons.tsx';

interface NudgeModalProps {
    type: 'netWorth' | 'monthlyFinances';
    onClose: () => void;
    onAction: () => void;
}

const NudgeModal: React.FC<NudgeModalProps> = ({ type, onClose, onAction }) => {
    const content = type === 'netWorth' 
        ? {
            title: "Unlock Your Potential",
            emoji: "🚀",
            text: "You haven't calculated your Net Worth yet. Knowing where you stand is the first step to becoming a Crorepati.",
            cta: "Calculate Net Worth"
        } 
        : {
            title: "Where is your money going?",
            emoji: "💸",
            text: "You've checked your Net Worth, but to grow it, you need to master your Cashflow. Track your income and expenses now.",
            cta: "Track Cashflow"
        };

    return (
        <div className="modal-overlay nudge-overlay">
            <div className="modal-content nudge-content">
                <button className="nudge-close-button" onClick={onClose} aria-label="Close nudge">
                    <CloseIcon />
                </button>
                <div className="nudge-emoji">{content.emoji}</div>
                <h2>{content.title}</h2>
                <p>{content.text}</p>
                <button className="nudge-cta-button" onClick={onAction}>
                    {content.cta}
                </button>
            </div>
        </div>
    );
};

export default NudgeModal;
