import React, { useState, useRef } from 'react';
import './CitizenForm.css';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS } from '../api/config';

const CitizenForm = () => {
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

        const form = e.target;
        const formDataObj = new FormData(form);

        // Validate required fields
        const missingFields = [];
        if (!formDataObj.get('fullName')?.trim()) missingFields.push('Full Name (Applicant Details)');
        if (!formDataObj.get('fatherName')?.trim()) missingFields.push('Father/Guardian Name (Applicant Details)');
        if (!formDataObj.get('dateOfBirth')) missingFields.push('Date of Birth (Applicant Details)');
        if (!formDataObj.get('gender')) missingFields.push('Gender (Applicant Details)');
        if (!formDataObj.get('aadhaarNumber')?.trim()) missingFields.push('Aadhaar Number (Applicant Details)');
        if (!formDataObj.get('mobile')?.trim()) missingFields.push('Mobile Number (Applicant Details)');
        if (!formDataObj.get('email')?.trim()) missingFields.push('Email (Applicant Details)');
        if (!formDataObj.get('doorStreet')?.trim()) missingFields.push('Door No/Street (Address Details)');
        if (!formDataObj.get('mandalDistrict')?.trim()) missingFields.push('Mandal/District (Address Details)');
        if (!formDataObj.get('villageTown')?.trim()) missingFields.push('Village/Town (Address Details)');
        if (!formDataObj.get('pincode')?.trim()) missingFields.push('Pincode (Address Details)');
        if (!formDataObj.get('addressProofType')) missingFields.push('Address Proof Type (Documents)');

        if (missingFields.length > 0) {
            alert('Please fill the following required fields:\n\n' + missingFields.join('\n'));
            setIsSubmitting(false);
            return;
        }

        try {
            const payload = {
                applicationType: 'citizen',
                fullName: formDataObj.get('fullName'),
                fatherName: formDataObj.get('fatherName'),
                dateOfBirth: formDataObj.get('dateOfBirth') || null,
                gender: formDataObj.get('gender'),
                aadhaarNumber: formDataObj.get('aadhaarNumber'),
                mobile: formDataObj.get('mobile'),
                email: formDataObj.get('email'),
                doorStreet: formDataObj.get('doorStreet'),
                mandalDistrict: formDataObj.get('mandalDistrict'),
                villageTown: formDataObj.get('villageTown'),
                pincode: formDataObj.get('pincode'),
                addressProofType: formDataObj.get('addressProofType'),
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
                alert(`Application submitted successfully!\nApplication ID: ${data.applicationId}\nPlease save this ID for tracking.`);
                form.reset();
                setPhoto(null);
                setDocuments({ idCardDoc: null, addressProofDoc: null });
            } else {
                alert(data.message || 'Failed to submit application');
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('Failed to connect to server. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="citizen-page-container">
            <div className="citizen-form-wrapper">
                <h2>{t('citizen_pass_title')}</h2>
                <form onSubmit={handleSubmit}>
                    {/* PERSONAL DETAILS */}
                    <div className="form-section">
                        <h3>{t('applicant_details')}</h3>
                        <div className="form-grid">
                            <div className={`form-group ${showError('fullName') ? 'has-error' : ''}`}>
                                <label>{t('full_name')}</label>
                                <input type="text" name="fullName" required pattern="[A-Za-z\s]+" title="Only letters and spaces allowed" onBlur={handleBlur} placeholder={t('enter_name')} />
                                {showError('fullName') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please enter a valid name (letters only).</span>}
                            </div>
                            <div className={`form-group ${showError('fatherName') ? 'has-error' : ''}`}>
                                <label>{t('father_guardian_name')}</label>
                                <input type="text" name="fatherName" required pattern="[A-Za-z\s]+" title="Only letters and spaces allowed" onBlur={handleBlur} placeholder={t('father_guardian_name')} />
                                {showError('fatherName') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please enter a valid name (letters only).</span>}
                            </div>
                            <div className={`form-group ${showError('dateOfBirth') ? 'has-error' : ''}`}>
                                <label>{t('date_of_birth')}</label>
                                <input type="date" name="dateOfBirth" max={new Date().toISOString().split('T')[0]} onBlur={handleBlur} required />
                                {showError('dateOfBirth') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please select a valid date of birth.</span>}
                            </div>
                            <div className={`form-group ${showError('gender') ? 'has-error' : ''}`}>
                                <label>{t('gender')}</label>
                                <select name="gender" required defaultValue="" onBlur={handleBlur}>
                                    <option value="" disabled>{t('select_gender')}</option>
                                    <option value="Male">{t('male')}</option>
                                    <option value="Female">{t('female')}</option>
                                    <option value="Other">{t('other')}</option>
                                </select>
                                {showError('gender') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please select a gender.</span>}
                            </div>
                            <div className={`form-group ${showError('aadhaarNumber') ? 'has-error' : ''}`}>
                                <label>{t('aadhar_number')} <span className="required-star">*</span></label>
                                <input type="text" name="aadhaarNumber" pattern="\d{12}" title="12 digit Aadhaar number" maxLength="12" onBlur={handleBlur} required placeholder={t('enter_aadhar')} />
                                {showError('aadhaarNumber') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Aadhaar must be exactly 12 digits.</span>}
                            </div>
                            <div className={`form-group ${showError('mobile') ? 'has-error' : ''}`}>
                                <label>{t('mobile_no')} <span className="required-star">*</span></label>
                                <input type="tel" name="mobile" pattern="[6-9]\d{9}" title="10 digit mobile number starting with 6-9" maxLength="10" onBlur={handleBlur} required placeholder={t('enter_mobile')} />
                                {showError('mobile') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Mobile number must be 10 digits.</span>}
                            </div>
                            <div className={`form-group ${showError('email') ? 'has-error' : ''}`}>
                                <label>{t('email')} <span className="required-star">*</span></label>
                                <input type="email" name="email" required onBlur={handleBlur} placeholder={t('email')} />
                                {showError('email') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please enter a valid email address.</span>}
                            </div>
                        </div>
                    </div>

                    {/* ADDRESS */}
                    <div className="form-section">
                        <h3>{t('address_details')}</h3>
                        <div className={`form-group full-width ${showError('doorStreet') ? 'has-error' : ''}`}>
                            <label>{t('door_no_street')}</label>
                            <textarea name="doorStreet" required rows="3" onBlur={handleBlur} placeholder={t('door_no_street')}></textarea>
                            {showError('doorStreet') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Address is required.</span>}
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
                            <div className={`form-group ${showError('pincode') ? 'has-error' : ''}`}>
                                <label>{t('pincode')}</label>
                                <input type="text" name="pincode" pattern="\d{6}" title="6 digit pincode" maxLength="6" onBlur={handleBlur} required placeholder={t('pincode')} />
                                {showError('pincode') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Pincode must be 6 digits.</span>}
                            </div>
                        </div>
                    </div>

                    {/* DOCUMENT UPLOAD */}
                    <div className="form-section">
                        <h3>{t('documents_upload')}</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>{t('address_proof_type')}</label>
                                <select name="addressProofType" required defaultValue="">
                                    <option value="" disabled>{t('select_proof')}</option>
                                    <option value="Voter ID Card">{t('voter_id_card')}</option>
                                    <option value="Driving Licence">{t('driving_licence')}</option>
                                    <option value="Passport">{t('passport')}</option>
                                </select>
                            </div>
                            <div className="form-group file-upload">
                                <label>{t('upload_address_proof')} <span className="required-star">*</span></label>
                                <input type="file" accept="image/*,.pdf" required onChange={(e) => handleDocumentUpload(e, 'addressProofDoc')} />
                            </div>
                            <div className="form-group file-upload">
                                <label>{t('upload_aadhar_proof')} <span className="required-star">*</span></label>
                                <input type="file" accept="image/*,.pdf" required onChange={(e) => handleDocumentUpload(e, 'idCardDoc')} />
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
                                <select required defaultValue="">
                                    <option value="" disabled>{t('select_pass')}</option>
                                    <option value="Ordinary">{t('ordinary')}</option>
                                    <option value="Metro">{t('metro')}</option>
                                    <option value="City">{t('city')}</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{t('from_place')}</label>
                                <input type="text" required placeholder={t('starting_point')} />
                            </div>
                            <div className="form-group">
                                <label>{t('to_place')}</label>
                                <input type="text" required placeholder={t('to_place')} />
                            </div>
                            <div className="form-group">
                                <label>{t('validity')}</label>
                                <select required defaultValue="">
                                    <option value="" disabled>{t('select_validity')}</option>
                                    <option value="Monthly">{t('monthly')}</option>
                                    <option value="Quarterly">{t('quarterly')}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* DECLARATION */}
                    <div className="form-section declaration">
                        <h3>{t('declaration')}</h3>
                        <label className="checkbox-label">
                            <input type="checkbox" required />
                            <span>{t('citizen_declaration_text')}</span>
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

export default CitizenForm;
