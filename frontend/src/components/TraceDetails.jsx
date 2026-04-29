import React, { useState } from 'react';
import './TraceDetails.css';
import LogoBackButton from './LogoBackButton';
import Header from './header';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS } from '../api/config';

const TraceDetails = () => {
    const { t } = useLanguage();
    const [identifier, setIdentifier] = useState('');
    const [dob, setDob] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResults([]);

        try {
            const response = await fetch(API_ENDPOINTS.traceApplication, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, dateOfBirth: dob })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || t('invalid_trace_details_alert'));
                return;
            }

            setResults(data);
        } catch (err) {
            setError('Failed to fetch details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="trace-page-container">
            <LogoBackButton top="120px" />
            <Header />
            <div className="trace-content-wrapper">
                <div className="trace-card">
                    <h2>{t('trace_details_title')}</h2>
                    <p className="trace-subtitle">{t('trace_details_subtitle')}</p>

                    <form onSubmit={handleSubmit} className="trace-form">
                        <div className="form-group">
                            <label>{t('mobile_aadhaar_label')}</label>
                            <input
                                type="text"
                                placeholder={t('enter_mobile_aadhaar_placeholder')}
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('date_of_birth')}</label>
                            <input
                                type="date"
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                required
                            />
                        </div>

                        <div className="submit-container">
                            <button type="submit" className="trace-submit-btn" disabled={loading}>
                                {loading ? t('fetching_details_btn') : t('get_details_btn')}
                            </button>
                        </div>
                    </form>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    {results.length > 0 && results.map((result, index) => (
                        <div className="result-card" key={index}>
                            <h3>{t('pass_information_title')}</h3>
                            
                            {/* Photo Section */}
                            {result.photo && (
                                <div className="photo-section">
                                    <img 
                                        src={result.photo} 
                                        alt={result.full_name} 
                                        className="result-photo"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}

                            {/* Personal Info Section */}
                            <div className="result-section">
                                <h4 className="section-title">📋 Personal Information</h4>
                                <div className="result-grid">
                                    <div className="result-row">
                                        <span className="result-label">{t('name')}:</span>
                                        <span className="result-value font-bold">{result.full_name || 'N/A'}</span>
                                    </div>
                                    <div className="result-row">
                                        <span className="result-label">Father's Name:</span>
                                        <span className="result-value">{result.father_name || 'N/A'}</span>
                                    </div>
                                    <div className="result-row">
                                        <span className="result-label">{t('date_of_birth')}:</span>
                                        <span className="result-value">{formatDate(result.date_of_birth)}</span>
                                    </div>
                                    <div className="result-row">
                                        <span className="result-label">Gender:</span>
                                        <span className="result-value">{result.gender || 'N/A'}</span>
                                    </div>
                                    <div className="result-row">
                                        <span className="result-label">{t('mobile_number_label')}:</span>
                                        <span className="result-value">{result.mobile || 'N/A'}</span>
                                    </div>
                                    <div className="result-row">
                                        <span className="result-label">{t('email_id_label')}:</span>
                                        <span className="result-value">{result.email || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Application & Pass Status */}
                            <div className="result-section">
                                <h4 className="section-title">🎫 Application & Pass Status</h4>
                                <div className="result-grid">
                                    <div className="result-row">
                                        <span className="result-label">Application ID:</span>
                                        <span className="result-value font-bold">{result.application_id}</span>
                                    </div>
                                    <div className="result-row">
                                        <span className="result-label">Application Type:</span>
                                        <span className="result-value">{result.application_type?.replace(/_/g, ' ').toUpperCase() || 'N/A'}</span>
                                    </div>
                                    <div className="result-row">
                                        <span className="result-label">Renewal ID:</span>
                                        <span className="result-value font-bold" style={{ color: '#28a745' }}>
                                            {result.renewal_id || '⏳ Pending Approval'}
                                        </span>
                                    </div>
                                    <div className="result-row">
                                        <span className="result-label">Application Status:</span>
                                        <span className={`result-value status-${result.status}`}>
                                            {result.status === 'approved' ? '✅ Approved' :
                                             result.status === 'pending' ? '⏳ Pending' :
                                             result.status === 'rejected' ? '❌ Rejected' :
                                             result.status === 'processing' ? '🔄 Processing' : result.status}
                                        </span>
                                    </div>
                                    <div className="result-row">
                                        <span className="result-label">Institution/Organization:</span>
                                        <span className="result-value">{result.institution_name || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Route Information */}
                            <div className="result-section">
                                <h4 className="section-title">🚌 Route Information</h4>
                                <div className="result-grid">
                                    <div className="result-row route-highlight">
                                        <span className="result-label">{t('route')}:</span>
                                        <span className="result-value font-bold">{result.from_place || 'N/A'} → {result.to_place || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Pass Details */}
                            {result.pass ? (
                                <div className="result-section">
                                    <h4 className="section-title">🎫 Active Pass Details</h4>
                                    <div className="result-grid">
                                        <div className="result-row">
                                            <span className="result-label">Pass ID:</span>
                                            <span className="result-value font-bold">{result.pass.passId}</span>
                                        </div>
                                        <div className="result-row">
                                            <span className="result-label">Valid From:</span>
                                            <span className="result-value">{formatDate(result.pass.validFrom)}</span>
                                        </div>
                                        <div className="result-row">
                                            <span className="result-label">Valid Until:</span>
                                            <span className="result-value font-bold">{formatDate(result.pass.validUntil)}</span>
                                        </div>
                                        <div className="result-row">
                                            <span className="result-label">Days Remaining:</span>
                                            <span className={`result-value font-bold ${result.pass.daysRemaining > 10 ? 'text-success' : result.pass.daysRemaining > 0 ? 'text-warning' : 'text-danger'}`}>
                                                {result.pass.daysRemaining} days
                                            </span>
                                        </div>
                                        <div className="result-row">
                                            <span className="result-label">Pass Status:</span>
                                            <span className={`result-value status-${result.pass.status}`}>
                                                {result.pass.status === 'active' ? '✅ Active' :
                                                 result.pass.status === 'expired' ? '❌ Expired' :
                                                 result.pass.status === 'cancelled' ? '❌ Cancelled' : result.pass.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="result-section">
                                    <div className="info-message">ℹ️ No active pass issued yet. Payment status may be pending.</div>
                                </div>
                            )}

                            {/* Payment Information */}
                            {result.payment ? (
                                <div className="result-section">
                                    <h4 className="section-title">💳 Latest Payment Information</h4>
                                    <div className="result-grid">
                                        <div className="result-row">
                                            <span className="result-label">Payment ID:</span>
                                            <span className="result-value font-bold">{result.payment.paymentId}</span>
                                        </div>
                                        <div className="result-row">
                                            <span className="result-label">Amount Paid:</span>
                                            <span className="result-value font-bold">₹{result.payment.amount}</span>
                                        </div>
                                        <div className="result-row">
                                            <span className="result-label">Payment Status:</span>
                                            <span className={`result-value font-bold ${result.payment.status === 'SUCCESS' ? 'text-success' : result.payment.status === 'PENDING' ? 'text-warning' : 'text-danger'}`}>
                                                {result.payment.status === 'SUCCESS' ? '✅ Completed' :
                                                 result.payment.status === 'PENDING' ? '⏳ Pending' : result.payment.status}
                                            </span>
                                        </div>
                                        <div className="result-row">
                                            <span className="result-label">Paid Date:</span>
                                            <span className="result-value">{result.payment.paidAt ? new Date(result.payment.paidAt).toLocaleString('en-IN') : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="result-section">
                                    <div className="info-message">ℹ️ No payment made yet.</div>
                                </div>
                            )}

                            {/* Application Date */}
                            <div className="result-section">
                                <h4 className="section-title">📅 Timeline</h4>
                                <div className="result-grid">
                                    <div className="result-row">
                                        <span className="result-label">Applied On:</span>
                                        <span className="result-value">{result.created_at ? new Date(result.created_at).toLocaleString('en-IN') : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TraceDetails;
