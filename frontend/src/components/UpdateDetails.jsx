import React, { useState } from 'react';
import './UpdateDetails.css';
import LogoBackButton from './LogoBackButton';
import Header from './header';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS } from '../api/config';

const UpdateDetails = () => {
    const { t } = useLanguage();
    const [identifier, setIdentifier] = useState('');
    const [dob, setDob] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Form inputs for update
    const [editData, setEditData] = useState({
        full_name: '',
        mobile: '',
        email: '',
        from_place: '',
        to_place: ''
    });

    const loadExactApplicationDetails = async (applicationId, fallbackData = null) => {
        try {
            const detailsRes = await fetch(API_ENDPOINTS.getApplicationDetails(applicationId));
            const detailsData = await detailsRes.json();

            if (detailsRes.ok && detailsData?.success && detailsData?.application) {
                return { ...fallbackData, ...detailsData.application };
            }
        } catch (err) {
            console.error('Details fetch fallback error:', err);
        }

        return fallbackData;
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);
        setUpdateSuccess(false);

        try {
            const cleanIdentifier = identifier.trim();
            const response = await fetch(API_ENDPOINTS.traceApplication, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: cleanIdentifier, dateOfBirth: dob })
            });

            const data = await response.json();

            if (!response.ok || !data || data.length === 0) {
                setError(data?.message || t('no_records_found_alert'));
                setLoading(false);
                return;
            }

            const traced = data[0];
            const appData = await loadExactApplicationDetails(traced.application_id, traced);

            setResult(appData);
            setEditData({
                full_name: appData.full_name || '',
                mobile: appData.mobile || '',
                email: appData.email || '',
                from_place: appData.from_place || '',
                to_place: appData.to_place || ''
            });
        } catch (err) {
            console.error('Search error:', err);
            setError('Failed to fetch details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditData({ ...editData, [name]: value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError('');
        setUpdateSuccess(false);

        try {
            const response = await fetch(API_ENDPOINTS.updateApplication(result.application_id), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData)
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Failed to update details');
                setUpdating(false);
                return;
            }

            setUpdateSuccess(true);

            const refreshed = await loadExactApplicationDetails(result.application_id, {
                ...result,
                ...editData
            });
            setResult(refreshed);

            setTimeout(() => {
                setResult(null);
                setIdentifier('');
                setDob('');
                setUpdateSuccess(false);
            }, 2000);
        } catch (err) {
            console.error('Update error:', err);
            setError('Failed to update details. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return 0;
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    return (
        <div className="update-page-container">
            <LogoBackButton top="120px" />
            <Header />
            <div className="update-content-wrapper">
                <div className="update-card">
                    <h2>{t('update_details_title')}</h2>
                    <p className="update-subtitle">{t('update_details_subtitle')}</p>

                    {!result ? (
                        <form onSubmit={handleSearch} className="update-form">
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
                                <button type="submit" className="update-submit-btn" disabled={loading}>
                                    {loading ? t('fetching_details_btn') : t('fetch_details_btn_search')}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="edit-form-container">
                            {result.photo && (
                                <div className="user-photo-display">
                                    <img 
                                        src={result.photo} 
                                        alt={result.full_name}
                                        className="user-photo-img"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}

                            <div className="application-info">
                                <h3>📋 {t('application_details')}</h3>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="info-label">Application ID:</span>
                                        <span className="info-value">{result.application_id}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Status:</span>
                                        <span className={`info-value status-badge status-${result.status}`}>
                                            {result.status === 'approved' ? '✅ Approved' :
                                             result.status === 'pending' ? '⏳ Pending' :
                                             result.status === 'rejected' ? '❌ Rejected' : result.status}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Renewal ID:</span>
                                        <span className="info-value" style={{ color: '#28a745', fontWeight: 700 }}>
                                            {result.renewal_id || '⏳ Pending'}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Age:</span>
                                        <span className="info-value">{calculateAge(result.date_of_birth)} years</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Father Name:</span>
                                        <span className="info-value">{result.father_name || 'N/A'}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Date of Birth:</span>
                                        <span className="info-value">{result.date_of_birth ? new Date(result.date_of_birth).toLocaleDateString('en-IN') : 'N/A'}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Gender:</span>
                                        <span className="info-value">{result.gender || 'N/A'}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Institution:</span>
                                        <span className="info-value">{result.institution_name || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {updateSuccess && (
                                <div className="success-message">
                                    ✅ {t('details_updated_success')}
                                </div>
                            )}

                            {error && (
                                <div className="error-message">
                                    {error}
                                </div>
                            )}

                            <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>{t('edit_info_title')}</h3>
                            <form onSubmit={handleUpdate} className="update-form edit-form">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>{t('full_name')}</label>
                                        <input
                                            type="text"
                                            name="full_name"
                                            value={editData.full_name}
                                            onChange={handleEditChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('mobile_number_label')}</label>
                                        <input
                                            type="tel"
                                            name="mobile"
                                            value={editData.mobile}
                                            onChange={handleEditChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('email_id_label')}</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={editData.email}
                                            onChange={handleEditChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>📍 {t('source_stop')}</label>
                                        <input
                                            type="text"
                                            name="from_place"
                                            value={editData.from_place}
                                            onChange={handleEditChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>📍 {t('destination_stop')}</label>
                                        <input
                                            type="text"
                                            name="to_place"
                                            value={editData.to_place}
                                            onChange={handleEditChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="submit-container form-actions">
                                    <button type="button" className="cancel-btn" onClick={() => setResult(null)}>
                                        {t('back_to_search')}
                                    </button>
                                    <button type="submit" className="update-submit-btn" disabled={updating}>
                                        {updating ? t('updating_btn') : t('update_details_btn')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {error && !result && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UpdateDetails;
