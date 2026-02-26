import React, { useState, useRef } from 'react';
import './aboveSSCForm.css';
import LogoBackButton from './LogoBackButton';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS } from '../api/config';

const AboveSSCForm = () => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '', fatherName: '', dob: '', aadhaar: '', gender: '',
        mobile: '', email: '', sscBoard: 'AP Board', sscYear: '', sscHtno: '',
        college: '', course: '', door: '', village: '', mandal: '', pincode: '',
        from: '', via: '', to: '', depot: '', isEmployeeChild: false
    });
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [documents, setDocuments] = useState({
        idCardDoc: null,
        addressProofDoc: null
    });

    const [photo, setPhoto] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched({ ...touched, [name]: true });
    };

    const showError = (name) => {
        return touched[name] && document.querySelector(`[name="${name}"]`) && !document.querySelector(`[name="${name}"]`).validity.valid;
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPhoto(reader.result);
            reader.readAsDataURL(file);
        }
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
            // Validate required fields
            const missingFields = [];
            if (!formData.name?.trim()) missingFields.push('Full Name (Personal Details)');
            if (!formData.aadhaar?.trim()) missingFields.push('Aadhaar Number (Proofs)');
            if (!formData.mobile?.trim()) missingFields.push('Mobile Number (Proofs)');
            if (!formData.email?.trim()) missingFields.push('Email (Proofs)');
            if (!formData.gender) missingFields.push('Gender (Personal Details)');
            if (!formData.from?.trim()) missingFields.push('From Place (Route Details)');
            if (!formData.to?.trim()) missingFields.push('To Place (Route Details)');

            if (missingFields.length > 0) {
                alert('Please fill in the following required fields:\\n\\n' + missingFields.join('\\n'));
                setIsSubmitting(false);
                return;
            }

            const payload = {
                applicationType: 'student_above_ssc',
                fullName: formData.name,
                fatherName: formData.fatherName,
                gender: formData.gender,
                dateOfBirth: formData.dob || null,
                aadhaarNumber: formData.aadhaar,
                mobile: formData.mobile,
                email: formData.email,
                doorStreet: formData.door,
                villageTown: formData.village,
                mandalDistrict: formData.mandal,
                pincode: formData.pincode,
                fromPlace: formData.from,
                toPlace: formData.to,
                via: formData.via,
                depot: formData.depot,
                institutionName: formData.college,
                courseYear: formData.course,
                sscBoard: formData.sscBoard,
                sscYear: formData.sscYear,
                sscHtno: formData.sscHtno,
                isEmployeeChild: formData.isEmployeeChild,
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
                // Reset form
                setFormData({
                    name: '', fatherName: '', dob: '', aadhaar: '', gender: '',
                    mobile: '', email: '', sscBoard: 'AP Board', sscYear: '', sscHtno: '',
                    college: '', course: '', door: '', village: '', mandal: '', pincode: '',
                    from: '', via: '', to: '', depot: '', isEmployeeChild: false
                });
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
        <div className="form-page-container">
            <LogoBackButton />
            <div className="form-card">
                <div className="form-title-bar">
                    <h2 className="form-title">{t('student_above_ssc_title')}</h2>
                </div>

                <form onSubmit={handleSubmit} className="registration-content">
                    <div className="top-section">
                        <div className="details-section">
                            <h3 className="section-header">{t('applicant_details')}</h3>
                            <div className="form-grid-2x2">
                                <div className={`form-group ${showError('name') ? 'has-error' : ''}`}>
                                    <label>{t('full_name')} <span className="required-star">*</span></label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} required pattern="[A-Za-z\s]+" title="Only letters and spaces allowed" placeholder={t('enter_name')} />
                                    {showError('name') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please enter a valid name (letters only).</span>}
                                </div>
                                <div className={`form-group ${showError('fatherName') ? 'has-error' : ''}`}>
                                    <label>{t('father_guardian_name')} <span className="required-star">*</span></label>
                                    <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} onBlur={handleBlur} required pattern="[A-Za-z\s]+" title="Only letters and spaces allowed" placeholder={t('father_guardian_name')} />
                                    {showError('fatherName') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please enter a valid name (letters only).</span>}
                                </div>
                                <div className={`form-group ${showError('gender') ? 'has-error' : ''}`}>
                                    <label>{t('gender')} <span className="required-star">*</span></label>
                                    <select name="gender" value={formData.gender} onChange={handleChange} onBlur={handleBlur} required>
                                        <option value="">{t('select_gender')}</option>
                                        <option value="Male">{t('male')}</option>
                                        <option value="Female">{t('female')}</option>
                                        <option value="Other">{t('other')}</option>
                                    </select>
                                    {showError('gender') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please select a gender.</span>}
                                </div>
                                <div className={`form-group ${showError('dob') ? 'has-error' : ''}`}>
                                    <label>{t('date_of_birth')} <span className="required-star">*</span></label>
                                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} onBlur={handleBlur} max={new Date().toISOString().split('T')[0]} required />
                                    {showError('dob') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please select a valid date of birth.</span>}
                                </div>
                            </div>
                            <div className="checkbox-group">
                                <input type="checkbox" name="isEmployeeChild" checked={formData.isEmployeeChild} onChange={handleChange} />
                                <label>{t('is_employee_child')}</label>
                            </div>
                        </div>

                        <div className="photo-upload-container">
                            <h3 className="section-header">{t('applicant_photo')}</h3>
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
                            <button type="button" style={{ marginTop: '5px', fontSize: '0.8rem', background: 'none', border: 'none', color: '#0076c0', cursor: 'pointer', textDecoration: 'underline' }} onClick={startCamera}>
                                {t('use_camera')}
                            </button>
                            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                            <p className="photo-help-text">
                                {t('photo_spec_text')}
                            </p>
                        </div>
                    </div>

                    <div className="proofs-section">
                        <h3 className="section-header">{t('proofs')}</h3>
                        <div className="form-grid-2x2">
                            <div className={`form-group ${showError('aadhaar') ? 'has-error' : ''}`}>
                                <label>{t('aadhar_number')} <span className="required-star">*</span></label>
                                <input type="text" name="aadhaar" value={formData.aadhaar} onChange={handleChange} onBlur={handleBlur} required pattern="\d{12}" title="12 digit Aadhaar number" maxLength="12" placeholder={t('enter_aadhar')} />
                                {showError('aadhaar') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Aadhaar must be exactly 12 digits.</span>}
                            </div>
                            <div className={`form-group ${showError('mobile') ? 'has-error' : ''}`}>
                                <label>{t('mobile_no')} <span className="required-star">*</span></label>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <span style={{ padding: '10px', border: '1px solid #ddd', background: '#eee', borderRadius: '4px' }}>+91</span>
                                    <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} onBlur={handleBlur} required pattern="[6-9]\d{9}" title="10 digit mobile number starting with 6-9" maxLength="10" placeholder={t('enter_mobile')} style={{ flex: 1 }} />
                                </div>
                                {showError('mobile') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Mobile number must be 10 digits.</span>}
                            </div>
                            <div className={`form-group ${showError('email') ? 'has-error' : ''}`}>
                                <label>{t('email')} <span className="required-star">*</span></label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} required placeholder={t('email')} />
                                {showError('email') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please enter a valid email address.</span>}
                            </div>
                        </div>
                    </div>

                    <div className="ssc-section">
                        <h3 className="section-header">{t('ssc_details')}</h3>
                        <div className="form-grid-2x2">
                            <div className="form-group">
                                <label>{t('ssc_board_type')}</label>
                                <select name="sscBoard" value={formData.sscBoard} onChange={handleChange}>
                                    <option>{t('ssc_ap_board')}</option>
                                    <option>{t('ssc_cbse')}</option>
                                    <option>{t('ssc_icse')}</option>
                                </select>
                            </div>
                            <div className={`form-group ${showError('sscYear') ? 'has-error' : ''}`}>
                                <label>{t('ssc_year_of_pass')}</label>
                                <input type="text" name="sscYear" value={formData.sscYear} onChange={handleChange} onBlur={handleBlur} pattern="\d{4}" title="4 digit year" maxLength="4" placeholder={t('year_of_passing')} />
                                {showError('sscYear') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Year must be exactly 4 digits.</span>}
                            </div>
                            <div className="form-group">
                                <label>{t('ssc_hall_ticket_no')}</label>
                                <input type="text" name="sscHtno" value={formData.sscHtno} onChange={handleChange} placeholder={t('hall_ticket_number')} />
                            </div>
                        </div>
                    </div>

                    <div className="college-section">
                        <h3 className="section-header">{t('institution_details')}</h3>
                        <div className="form-grid-2x2">
                            <div className="form-group">
                                <label>{t('institution_name')}</label>
                                <input type="text" name="college" value={formData.college} onChange={handleChange} placeholder={t('college_name')} />
                            </div>
                            <div className="form-group">
                                <label>{t('course_year')}</label>
                                <input type="text" name="course" value={formData.course} onChange={handleChange} placeholder={t('course_year_placeholder')} />
                            </div>
                        </div>
                    </div>

                    <div className="address-section">
                        <h3 className="section-header">{t('address_details')}</h3>
                        <div className="form-grid-2x2">
                            <div className="form-group">
                                <label>{t('door_no_street')}</label>
                                <input type="text" name="door" value={formData.door} onChange={handleChange} placeholder={t('door_no_street')} />
                            </div>
                            <div className="form-group">
                                <label>{t('village_town')}</label>
                                <input type="text" name="village" value={formData.village} onChange={handleChange} placeholder={t('village_town')} />
                            </div>
                            <div className="form-group">
                                <label>{t('mandal_district')}</label>
                                <input type="text" name="mandal" value={formData.mandal} onChange={handleChange} placeholder={t('mandal_district')} />
                            </div>
                            <div className={`form-group ${showError('pincode') ? 'has-error' : ''}`}>
                                <label>{t('pincode')}</label>
                                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} onBlur={handleBlur} pattern="\d{6}" title="6 digit pincode" maxLength="6" placeholder={t('pincode')} />
                                {showError('pincode') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Pincode must be 6 digits.</span>}
                            </div>
                        </div>
                    </div>

                    <div className="route-section">
                        <h3 className="section-header">{t('route_details')}</h3>
                        <div className="form-grid-2x2">
                            <div className={`form-group ${showError('from') ? 'has-error' : ''}`}>
                                <label>{t('from_place')} <span className="required-star">*</span></label>
                                <input type="text" name="from" value={formData.from} onChange={handleChange} onBlur={handleBlur} required placeholder={t('starting_point')} />
                                {showError('from') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Starting point is required.</span>}
                            </div>
                            <div className="form-group">
                                <label>{t('to_place')} <span className="required-star">*</span></label>
                                <input type="text" name="to" value={formData.to} onChange={handleChange} onBlur={handleBlur} required placeholder={t('to_place')} />
                                {showError('to') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Destination is required.</span>}
                            </div>
                            <div className="form-group">
                                <label>{t('depot')}</label>
                                <input type="text" name="depot" value={formData.depot} onChange={handleChange} placeholder={t('bus_depot')} />
                            </div>
                        </div>
                    </div>

                    <div className="form-footer">
                        <button type="submit" className="submit-btn" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : t('submit')}
                        </button>
                    </div>
                </form>
            </div>

            {showCamera && (
                <div className="camera-modal">
                    <div className="camera-content">
                        <video ref={videoRef} autoPlay style={{ width: '100%', borderRadius: '4px' }} />
                        <canvas ref={canvasRef} width="320" height="240" style={{ display: 'none' }} />
                        <div className="camera-actions">
                            <button onClick={capturePhoto} className="capture-btn">{t('capture')}</button>
                            <button onClick={stopCamera} className="cancel-btn">{t('cancel')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AboveSSCForm;
