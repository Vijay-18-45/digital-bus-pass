import React from 'react';
import { useNavigate } from 'react-router-dom';

const LogoBackButton = ({ top = '20px' }) => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate('/home')}
            style={{
                position: 'absolute',
                top: top,
                left: '20px',
                padding: '8px 16px',
                cursor: 'pointer',
                zIndex: 1000,
                backgroundColor: '#ffffff',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontWeight: '600',
                color: '#333',
                boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px'
            }}
            title="Back to Home"
        >
            <span>&larr;</span> Back
        </button>
    );
};

export default LogoBackButton;
