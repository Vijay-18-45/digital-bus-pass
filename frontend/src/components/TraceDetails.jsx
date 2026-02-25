import React, { useState } from 'react';
import './TraceDetails.css';
import LogoBackButton from './LogoBackButton';
import Header from './header';
import { useLanguage } from '../context/LanguageContext';

const TraceDetails = () => {
    const { t } = useLanguage();
    const [identifier, setIdentifier] = useState('');
    const [dob, setDob] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        // Simulate backend fetch
        setTimeout(() => {
            setLoading(false);
            // Mock validation
            if (identifier.length >= 10 && dob) {
                setResult({
                    name: "Venkata Sai",
                    passType: "Student General",
                    status: t('active_status'),
                    source: "Vijayawada",
                    destination: "Guntur",
                    validUpto: "2026-12-31"
                });
            } else {
                setError(t('invalid_trace_details_alert'));
            }
        }, 1500);
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

                    {result && (
                        <div className="result-card">
                            <h3>{t('pass_information_title')}</h3>
                            <div className="result-grid">
                                <div className="result-row">
                                    <span className="result-label">{t('name')}:</span>
                                    <span className="result-value">{result.name}</span>
                                </div>
                                <div className="result-row">
                                    <span className="result-label">{t('pass_type_label')}:</span>
                                    <span className="result-value">{result.passType}</span>
                                </div>
                                <div className="result-row">
                                    <span className="result-label">{t('route')}:</span>
                                    <span className="result-value">{result.source} {t('to')} {result.destination}</span>
                                </div>
                                <div className="result-row">
                                    <span className="result-label">{t('valid_upto_label')}:</span>
                                    <span className="result-value font-bold">{result.validUpto}</span>
                                </div>
                                <div className="result-row">
                                    <span className="result-label">{t('status_label')}:</span>
                                    <span className="result-value status-active">{result.status}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TraceDetails;
