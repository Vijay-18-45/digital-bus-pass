import React, { useState, useRef } from 'react';
import './NGOApplicationForm.css';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS } from '../api/config';

const NGOApplicationForm = () => {
    const { t } = useLanguage();
    const [photo, setPhoto] = useState(null);
    const [documents, setDocuments] = useState({
        idCardDoc: null,
        addressProofDoc: null
    });
    const [showCamera, setShowCamera] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState({});
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const formRef = useRef(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPhoto(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        if (name) setTouched(prev => ({ ...prev, [name]: true }));
    };

    const showError = (name) => {
        const input = document.querySelector(`[name="${name}"]`);
        return touched[name] && input && !input.validity.valid;
    };

    const handleDocumentUpload = (e, docType) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setDocuments(prev => ({ ...prev, [docType]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const startCamera = async () => {
        setShowCamera(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            alert("Could not access camera");
            setShowCamera(false);
        }
    };

    const capturePhoto = () => {
        const context = canvasRef.current.getContext('2d');
        context.drawImage(videoRef.current, 0, 0, 320, 240);
        setPhoto(canvasRef.current.toDataURL('image/png'));
        stopCamera();
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        setShowCamera(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const form = formRef.current;
            const formDataObj = new FormData(form);

            // Required field validation
            const requiredFields = [
                { name: 'fullName', label: 'Full Name', section: 'Personal Details' },
                { name: 'aadharNumber', label: 'Aadhaar Number', section: 'Personal Details' },
                { name: 'mobileNumber', label: 'Mobile Number', section: 'Personal Details' },
                { name: 'email', label: 'Email ID', section: 'Personal Details' },
                { name: 'gender', label: 'Gender', section: 'Personal Details' },
                { name: 'ngoName', label: 'NGO Name', section: 'NGO Details' },
                { name: 'passType', label: 'Pass Type', section: 'Route Details' },
                { name: 'fromPlace', label: 'From Place', section: 'Route Details' },
                { name: 'toPlace', label: 'To Place', section: 'Route Details' }
            ];

            const missingFields = [];
            for (const field of requiredFields) {
                const value = formDataObj.get(field.name);
                if (!value || value.trim() === '') {
                    missingFields.push(`${field.label} (${field.section})`);
                }
            }

            if (missingFields.length > 0) {
                alert(`Please fill in the following required fields:\n\n${missingFields.join('\n')}`);
                setIsSubmitting(false);
                return;
            }

            const payload = {
                applicationType: 'ngo_worker',
                fullName: formDataObj.get('fullName'),
                fatherName: formDataObj.get('fatherName'),
                aadharNumber: formDataObj.get('aadharNumber'),
                dateOfBirth: formDataObj.get('dateOfBirth'),
                mobileNumber: formDataObj.get('mobileNumber'),
                email: formDataObj.get('email'),
                gender: formDataObj.get('gender'),
                ngoName: formDataObj.get('ngoName'),
                ngoRegistrationNumber: formDataObj.get('ngoRegistrationNumber'),
                designation: formDataObj.get('designation'),
                appointmentDate: formDataObj.get('appointmentDate'),
                retirementDate: formDataObj.get('retirementDate'),
                payScale: formDataObj.get('payScale'),
                residentialAddress: formDataObj.get('residentialAddress'),
                ngoAddress: formDataObj.get('ngoAddress'),
                passType: formDataObj.get('passType'),
                fromPlace: formDataObj.get('fromPlace'),
                toPlace: formDataObj.get('toPlace'),
                depot: formDataObj.get('depot'),
                validity: formDataObj.get('validity'),
                photo: photo,
                idCardDoc: documents.idCardDoc,
                addressProofDoc: documents.addressProofDoc
            };

            const response = await fetch(API_ENDPOINTS.submitApplication, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {
                alert(`Application submitted successfully! Your Application ID: ${data.applicationId}`);
                form.reset();
                setPhoto(null);
                setDocuments({ idCardDoc: null, addressProofDoc: null });
            } else {
                alert(`Submission failed: ${data.message || 'Unknown error'}\n\nPlease check all required fields.`);
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Failed to submit application. Please check your internet connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="ngo-page-container">
            <div className="ngo-form-wrapper">
                <h2>{t('ngo_pass_title')}</h2>
                <form ref={formRef} onSubmit={handleSubmit}>
                    {/* PERSONAL DETAILS */}
                    <div className="form-section">
                        <h3>{t('applicant_details')}</h3>
                        <div className="form-grid">
                            <div className={`form-group ${showError('fullName') ? 'has-error' : ''}`}>
                                <label>{t('full_name')} <span className="required-star">*</span></label>
                                <input type="text" name="fullName" required pattern="[A-Za-z\s]+" title="Only letters and spaces allowed" onBlur={handleBlur} placeholder={t('enter_name')} />
                                {showError('fullName') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please enter a valid name (letters only).</span>}
                            </div>
                            <div className={`form-group ${showError('fatherName') ? 'has-error' : ''}`}>
                                <label>{t('father_guardian_name')} <span className="required-star">*</span></label>
                                <input type="text" name="fatherName" required pattern="[A-Za-z\s]+" title="Only letters and spaces allowed" onBlur={handleBlur} placeholder={t('father_guardian_name')} />
                                {showError('fatherName') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please enter a valid name (letters only).</span>}
                            </div>
                            <div className={`form-group ${showError('dateOfBirth') ? 'has-error' : ''}`}>
                                <label>{t('date_of_birth')} <span className="required-star">*</span></label>
                                <input type="date" name="dateOfBirth" max={new Date().toISOString().split('T')[0]} onBlur={handleBlur} required />
                                {showError('dateOfBirth') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please select a valid date of birth.</span>}
                            </div>
                            <div className={`form-group ${showError('gender') ? 'has-error' : ''}`}>
                                <label>{t('gender')} <span className="required-star">*</span></label>
                                <select name="gender" required defaultValue="" onBlur={handleBlur}>
                                    <option value="" disabled>{t('select_gender')}</option>
                                    <option value="Male">{t('male')}</option>
                                    <option value="Female">{t('female')}</option>
                                    <option value="Other">{t('other')}</option>
                                </select>
                                {showError('gender') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please select a gender.</span>}
                            </div>
                            <div className={`form-group ${showError('aadharNumber') ? 'has-error' : ''}`}>
                                <label>{t('aadhar_number')} <span className="required-star">*</span></label>
                                <input type="text" name="aadharNumber" pattern="\d{12}" title="12 digit Aadhaar number" maxLength="12" onBlur={handleBlur} required placeholder={t('enter_aadhar')} />
                                {showError('aadharNumber') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Aadhaar must be exactly 12 digits.</span>}
                            </div>
                            <div className={`form-group ${showError('mobileNumber') ? 'has-error' : ''}`}>
                                <label>{t('mobile_no')} <span className="required-star">*</span></label>
                                <input type="tel" name="mobileNumber" pattern="[6-9]\d{9}" title="10 digit mobile number starting with 6-9" maxLength="10" onBlur={handleBlur} required placeholder={t('enter_mobile')} />
                                {showError('mobileNumber') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Mobile number must be 10 digits.</span>}
                            </div>
                            <div className={`form-group ${showError('email') ? 'has-error' : ''}`}>
                                <label>{t('email')} <span className="required-star">*</span></label>
                                <input type="email" name="email" required onBlur={handleBlur} placeholder={t('email')} />
                                {showError('email') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please enter a valid email address.</span>}
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>{t('ngo_details')}</h3>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>{t('ngo_org_name')}</label>
                                <input type="text" name="ngoName" required />
                            </div>
                            <div className="form-group">
                                <label>{t('reg_no')}</label>
                                <input type="text" name="ngoRegistrationNumber" required />
                            </div>
                            <div className="form-group">
                                <label>{t('applicant_designation_ngo')}</label>
                                <input type="text" name="designation" required />
                            </div>
                            <div className="form-group">
                                <label>{t('appointment_date')}</label>
                                <input type="date" name="appointmentDate" required />
                            </div>
                            <div className="form-group">
                                <label>{t('retirement_date')}</label>
                                <input type="date" name="retirementDate" required />
                            </div>
                            <div className="form-group">
                                <label>{t('pay_scale')}</label>
                                <input type="text" name="payScale" required />
                            </div>
                        </div>
                    </div>

                    {/* ADDRESS */}
                    <div className="form-section">
                        <h3>{t('address_details')}</h3>
                        <div className="form-group full-width">
                            <label>{t('door_no_street')}</label>
                            <textarea name="residentialAddress" required rows="3" placeholder={t('door_no_street')}></textarea>
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>{t('mandal_district')}</label>
                                <input type="text" name="mandalDistrict" required placeholder={t('mandal_district')} />
                            </div>
                            <div className="form-group">
                                <label>{t('village_town')}</label>
                                <input type="text" name="villageTown" required placeholder={t('village_town')} />
                            </div>
                            <div className="form-group">
                                <label>{t('pincode')}</label>
                                <input type="text" name="pincode" pattern="\d{6}" title="6 digit pincode" maxLength="6" required placeholder={t('pincode')} />
                            </div>
                        </div>
                    </div>

                    {/* DOCUMENT UPLOAD */}
                    <div className="form-section">
                        <h3>{t('documents_upload')}</h3>
                        <div className="form-grid">
                            <div className="form-group file-upload" style={{ gridColumn: '1 / -1' }}>
                                <label>{t('upload_ngo_id_reg')} <span className="required-star">*</span></label>
                                <input type="file" accept="image/*,.pdf" required onChange={(e) => handleDocumentUpload(e, 'idCardDoc')} />
                            </div>
                            <div className="form-group file-upload">
                                <label>{t('upload_address_proof')} <span className="required-star">*</span></label>
                                <input type="file" accept="image/*,.pdf" required onChange={(e) => handleDocumentUpload(e, 'addressProofDoc')} />
                            </div>
                            <div className="form-group file-upload">
                                <label>{t('upload_aadhar_proof')} <span className="required-star">*</span></label>
                                <input type="file" accept="image/*,.pdf" required />
                            </div>
                            <div className="form-group photo-upload-container" style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                                <label style={{ marginBottom: '15px' }}>{t('applicant_photo')}</label>
                                <div className="photo-box-wrapper">
                                    <span className="dim-label dim-width">{t('photo_width_label')}</span>
                                    <div className="photo-box">
                                        {photo ? <img src={photo} alt="Preview" /> : <img src="photo-spec.png" alt="No photo" style={{ opacity: 0.2 }} />}
                                    </div>
                                    <span className="dim-label dim-height">{t('photo_height_label')}</span>
                                </div>
                                <button type="button" className="photo-action-btn" onClick={() => fileInputRef.current.click()}>
                                    {t('upload_capture_photo')} *
                                </button>
                                <button type="button" style={{ marginTop: '5px', fontSize: '0.8rem', background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', textDecoration: 'underline' }} onClick={startCamera}>
                                    {t('use_camera')}
                                </button>
                                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                                <p className="photo-help-text">
                                    {t('photo_spec_text')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* PASS DETAILS */}
                    <div className="form-section">
                        <h3>{t('pass_requirement')}</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>{t('pass_type')}</label>
                                <select name="passType" required defaultValue="">
                                    <option value="" disabled>{t('select_pass')}</option>
                                    <option value="Ordinary">{t('ordinary')}</option>
                                    <option value="Metro">{t('metro')}</option>
                                    <option value="City">{t('city')}</option>
                                </select>
                            </div>
                            <div className={`form-group ${showError('fromPlace') ? 'has-error' : ''}`}>
                                <label>{t('from_place')} <span className="required-star">*</span></label>
                                <input type="text" name="fromPlace" required onBlur={handleBlur} placeholder={t('starting_point')} />
                                {showError('fromPlace') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Starting point is required.</span>}
                            </div>
                            <div className={`form-group ${showError('toPlace') ? 'has-error' : ''}`}>
                                <label>{t('to_place')} <span className="required-star">*</span></label>
                                <input type="text" name="toPlace" required onBlur={handleBlur} placeholder={t('to_place')} />
                                {showError('toPlace') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Destination is required.</span>}
                            </div>
                            <div className="form-group">
                                <label>{t('validity')}</label>
                                <select name="validity" required defaultValue="">
                                    <option value="" disabled>{t('select_validity')}</option>
                                    <option value="Monthly">{t('monthly')}</option>
                                    <option value="Quarterly">{t('quarterly')}</option>
                                    <option value="Half-Yearly">{t('half_yearly')}</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{t('depot')} <span className="required-star">*</span></label>
                                <input type="text" name="depot" required placeholder={t('depot')} />
                            </div>
                        </div>
                    </div>

                    {/* DECLARATION */}
                    <div className="form-section declaration">
                        <h3>{t('declaration')}</h3>
                        <label className="checkbox-label">
                            <input type="checkbox" required />
                            <span>{t('ngo_declaration_text')}</span>
                        </label>
                    </div>

                    <div className="form-submit-container">
                        <button type="submit" className="submit-btn" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : t('submit')}
                        </button>
                    </div>
                </form>
            </div>

            {showCamera && (
                <div className="camera-modal">
                    <div className="camera-content">
                        <video ref={videoRef} autoPlay style={{ width: '100%', borderRadius: '8px' }} />
                        <canvas ref={canvasRef} width="320" height="240" style={{ display: 'none' }} />
                        <div className="camera-actions">
                            <button type="button" onClick={capturePhoto} className="capture-btn">{t('capture')}</button>
                            <button type="button" onClick={stopCamera} className="cancel-btn">{t('cancel')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NGOApplicationForm;
