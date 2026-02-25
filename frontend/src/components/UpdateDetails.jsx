import React, { useState } from 'react';
import './UpdateDetails.css';
import LogoBackButton from './LogoBackButton';
import { useLanguage } from '../context/LanguageContext';

const UpdateDetails = () => {
    const { t } = useLanguage();
    const [identifier, setIdentifier] = useState('');
    const [dob, setDob] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [updateSuccess, setUpdateSuccess] = useState(false);

    // Form inputs for update
    const [editData, setEditData] = useState({
        name: '',
        passType: '',
        source: '',
        destination: '',
        mobileNumber: '',
        email: ''
    });

    const handleSearch = (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);
        setUpdateSuccess(false);

        // Simulate backend fetch
        setTimeout(() => {
            setLoading(false);
            // Mock validation
            if (identifier.length >= 10 && dob) {
                const fetchedData = {
                    name: "Venkata Sai",
                    passType: "Student General",
                    source: "Vijayawada",
                    destination: "Guntur",
                    mobileNumber: "9876543210",
                    email: "venkata.sai@example.com"
                };
                setResult(fetchedData);
                setEditData(fetchedData);
            } else {
                setError(t('no_records_found_alert'));
            }
        }, 1200);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditData({ ...editData, [name]: value });
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setUpdateSuccess(false);

        // Simulate update to backend
        setTimeout(() => {
            setLoading(false);
            setUpdateSuccess(true);
            setResult(editData);
        }, 1500);
    };

    return (
        <div className="update-page-container">
            <LogoBackButton />
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
                        <h3>{t('edit_info_title')}</h3>
                        {updateSuccess && (
                            <div className="success-message">
                                {t('details_updated_success')}
                            </div>
                        )}
                        <form onSubmit={handleUpdate} className="update-form edit-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>{t('full_name')}</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={editData.name}
                                        onChange={handleEditChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('pass_type_label')}</label>
                                    <select
                                        name="passType"
                                        value={editData.passType}
                                        onChange={handleEditChange}
                                        required
                                    >
                                        <option value="Student General">{t('student_general')}</option>
                                        <option value="Student Special">{t('student_special')}</option>
                                        <option value="Employee">{t('employee')}</option>
                                        <option value="Citizen Ordinary">{t('citizen_ordinary')}</option>
                                        <option value="Citizen Metro">{t('citizen_metro')}</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{t('source_stop')}</label>
                                    <input
                                        type="text"
                                        name="source"
                                        value={editData.source}
                                        onChange={handleEditChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('destination_stop')}</label>
                                    <input
                                        type="text"
                                        name="destination"
                                        value={editData.destination}
                                        onChange={handleEditChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('mobile_number_label')}</label>
                                    <input
                                        type="tel"
                                        name="mobileNumber"
                                        value={editData.mobileNumber}
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
                            </div>
                            <div className="submit-container form-actions">
                                <button type="button" className="cancel-btn" onClick={() => setResult(null)}>{t('back_to_search')}</button>
                                <button type="submit" className="update-submit-btn" disabled={loading}>
                                    {loading ? t('updating_btn') : t('update_details_btn')}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpdateDetails;
