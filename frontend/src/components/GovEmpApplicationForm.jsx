import React, { useState, useRef } from 'react';
import './GovEmpApplicationForm.css';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS } from '../api/config';

const GovEmpApplicationForm = () => {
    const { t } = useLanguage();
    const [photo, setPhoto] = useState(null);
    const [documents, setDocuments] = useState({
        idCardDoc: null,
        salaryCertificateDoc: null,
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
            const form = e.target;
            const formDataObj = new FormData(form);

            // Log ALL form fields to console for debugging
            console.log('=== FORM DATA ENTRIES ===');
            const entries = {};
            for (let [key, value] of formDataObj.entries()) {
                entries[key] = value;
                console.log(`${key}: "${value}"`);
            }
            console.log('Total fields found:', Object.keys(entries).length);
            console.log('=========================');

            // Required field validation with section info
            const requiredFields = [
                { name: 'fullName', label: 'Full Name', section: '1. Applicant Details' },
                { name: 'aadharNumber', label: 'Aadhaar Number', section: '1. Applicant Details' },
                { name: 'mobileNumber', label: 'Mobile Number', section: '1. Applicant Details' },
                { name: 'email', label: 'Email ID', section: '1. Applicant Details' },
                { name: 'gender', label: 'Gender', section: '1. Applicant Details' },
                { name: 'employmentType', label: 'Employment Type', section: '2. Employment Information' },
                { name: 'passType', label: 'Pass Type', section: '3. Route Details' },
                { name: 'fromPlace', label: 'From Place', section: '3. Route Details' },
                { name: 'toPlace', label: 'To Place', section: '3. Route Details' }
            ];

            const missingFields = [];
            for (const field of requiredFields) {
                const value = formDataObj.get(field.name);
                console.log(`Checking ${field.name}: "${value}"`);
                if (!value || value.trim() === '') {
                    missingFields.push(`${field.label} (${field.section})`);
                }
            }

            if (missingFields.length > 0) {
                alert(`Please fill in the following required fields:\n\n${missingFields.join('\n')}`);
                setIsSubmitting(false);
                return;
            }

            // DEBUG: Log what's being sent
            console.log('=== FORM DATA BEING SENT ===');
            console.log('fullName:', formDataObj.get('fullName'));
            console.log('mobileNumber:', formDataObj.get('mobileNumber'));
            console.log('gender:', formDataObj.get('gender'));
            for (let [key, value] of formDataObj.entries()) {
                console.log(`${key}: ${value}`);
            }
            console.log('===========================');

            const payload = {
                applicationType: 'gov_employee',
                fullName: formDataObj.get('fullName'),
                designation: formDataObj.get('designation'),
                govEmpIdPf: formDataObj.get('govEmpIdPf'),
                deptMinistry: formDataObj.get('deptMinistry'),
                officeName: formDataObj.get('officeName'),
                fatherName: formDataObj.get('fatherName'),
                aadharNumber: formDataObj.get('aadharNumber'),
                dateOfBirth: formDataObj.get('dateOfBirth'),
                mobileNumber: formDataObj.get('mobileNumber'),
                email: formDataObj.get('email'),
                gender: formDataObj.get('gender'),
                employmentType: formDataObj.get('employmentType'),
                appointmentDate: formDataObj.get('appointmentDate'),
                retirementDate: formDataObj.get('retirementDate'),
                payScale: formDataObj.get('payScale'),
                workingDistrict: formDataObj.get('workingDistrict'),
                passType: formDataObj.get('passType'),
                passDuration: formDataObj.get('passDuration'),
                fromPlace: formDataObj.get('fromPlace'),
                toPlace: formDataObj.get('toPlace'),
                boardingPoint: formDataObj.get('boardingPoint'),
                residentialAddress: formDataObj.get('residentialAddress'),
                officeAddress: formDataObj.get('officeAddress'),
                photo: photo,
                idCardDoc: documents.idCardDoc,
                salaryCertificateDoc: documents.salaryCertificateDoc,
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
                setDocuments({ idCardDoc: null, salaryCertificateDoc: null, addressProofDoc: null });
            } else {
                alert(`Submission failed: ${data.message || 'Unknown error'}\n\nPlease check all required fields are filled.`);
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Failed to submit application. Please check your internet connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="gov-emp-page-container">
            <div className="gov-emp-form-wrapper">
                <h2>{t('gov_emp_pass_title')}</h2>
                <h4>(RTC – GOV/EMP BUS PASS)</h4>

                <form ref={formRef} onSubmit={handleSubmit}>
                    {/* 1. EMPLOYEE DETAILS */}
                    <div className="form-section">
                        <h3>1. {t('applicant_details')}</h3>
                        <div className="form-grid">
                            <div className={`form-group full-width ${showError('fullName') ? 'has-error' : ''}`}>
                                <label>1. {t('full_name')} <span className="required-star">*</span></label>
                                <input type="text" name="fullName" required pattern="[A-Za-z\s]+" title="Only letters and spaces allowed" onBlur={handleBlur} placeholder={t('enter_name')} />
                                {showError('fullName') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please enter a valid name (letters only).</span>}
                            </div>
                            <div className="form-group">
                                <label>2a. {t('designation')}</label>
                                <input type="text" name="designation" required />
                            </div>
                            <div className="form-group">
                                <label>2b. {t('gov_emp_id_pf')}</label>
                                <input type="text" name="govEmpIdPf" required />
                            </div>
                            <div className="form-group">
                                <label>3a. {t('dept_ministry')}</label>
                                <input type="text" name="deptMinistry" required />
                            </div>
                            <div className="form-group">
                                <label>3b. {t('office_name')}</label>
                                <input type="text" name="officeName" required />
                            </div>
                            <div className={`form-group ${showError('fatherName') ? 'has-error' : ''}`}>
                                <label>4a. {t('father_guardian_name')} <span className="required-star">*</span></label>
                                <input type="text" name="fatherName" required pattern="[A-Za-z\s]+" title="Only letters and spaces allowed" onBlur={handleBlur} placeholder={t('father_guardian_name')} />
                                {showError('fatherName') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please enter a valid name (letters only).</span>}
                            </div>
                            <div className={`form-group ${showError('aadharNumber') ? 'has-error' : ''}`}>
                                <label>4b. {t('aadhar_number')} <span className="required-star">*</span></label>
                                <input type="text" name="aadharNumber" pattern="\d{12}" title="12 digit Aadhaar number" maxLength="12" onBlur={handleBlur} required placeholder={t('enter_aadhar')} />
                                {showError('aadharNumber') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Aadhaar must be exactly 12 digits.</span>}
                            </div>
                            <div className={`form-group ${showError('dateOfBirth') ? 'has-error' : ''}`}>
                                <label>5. {t('date_of_birth')} <span className="required-star">*</span></label>
                                <input type="date" name="dateOfBirth" max={new Date().toISOString().split('T')[0]} onBlur={handleBlur} required />
                                {showError('dateOfBirth') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please select a valid date of birth.</span>}
                            </div>
                            <div className={`form-group ${showError('mobileNumber') ? 'has-error' : ''}`}>
                                <label>6. {t('mobile_no')} <span className="required-star">*</span></label>
                                <input type="tel" name="mobileNumber" pattern="[6-9]\d{9}" title="10 digit mobile number starting with 6-9" maxLength="10" onBlur={handleBlur} required placeholder={t('enter_mobile')} />
                                {showError('mobileNumber') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Mobile number must be 10 digits.</span>}
                            </div>
                            <div className={`form-group ${showError('email') ? 'has-error' : ''}`}>
                                <label>7. {t('email_id')} <span className="required-star">*</span></label>
                                <input type="email" name="email" required onBlur={handleBlur} placeholder={t('email')} />
                                {showError('email') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please enter a valid email address.</span>}
                            </div>
                            <div className={`form-group ${showError('gender') ? 'has-error' : ''}`}>
                                <label>8. {t('gender')} <span className="required-star">*</span></label>
                                <select name="gender" required defaultValue="" onBlur={handleBlur}>
                                    <option value="" disabled>{t('select_gender')}</option>
                                    <option value="Male">{t('male')}</option>
                                    <option value="Female">{t('female')}</option>
                                    <option value="Other">{t('other')}</option>
                                </select>
                                {showError('gender') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please select a gender.</span>}
                            </div>
                        </div>
                    </div>

                    {/* 2. EMPLOYMENT INFORMATION */}
                    <div className="form-section">
                        <h3>2. {t('employment_info')}</h3>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>9. {t('employment_type')}</label>
                                <select name="employmentType" required defaultValue="">
                                    <option value="" disabled>{t('select_pass')} {t('employment_type')}</option>
                                    <option value="Permanent Government Employee">{t('perm_gov_emp')}</option>
                                    <option value="State Government">{t('state_gov')}</option>
                                    <option value="Central Government">{t('central_gov')}</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>10. {t('appointment_date')}</label>
                                <input type="date" name="appointmentDate" required />
                            </div>
                            <div className="form-group">
                                <label>11. {t('retirement_date')}</label>
                                <input type="date" name="retirementDate" required />
                            </div>
                            <div className="form-group">
                                <label>12. {t('pay_scale')}</label>
                                <input type="text" name="payScale" required />
                            </div>
                            <div className="form-group">
                                <label>13. {t('working_dist_city')}</label>
                                <input type="text" name="workingDistrict" required />
                            </div>
                        </div>
                    </div>

                    {/* 3. BUS PASS DETAILS */}
                    <div className="form-section">
                        <h3>3. {t('route_details')}</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>14. {t('pass_type_req')}</label>
                                <select name="passType" required defaultValue="">
                                    <option value="" disabled>{t('select_pass')}</option>
                                    <option value="Ordinary">{t('ordinary')}</option>
                                    <option value="Metro Express">{t('metro_express')}</option>
                                    <option value="City Special">{t('city_special')}</option>
                                    <option value="Inter-District Pass">{t('inter_district_pass')}</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>15. {t('pass_duration')}</label>
                                <select name="passDuration" required defaultValue="">
                                    <option value="" disabled>{t('select_validity')}</option>
                                    <option value="Monthly">{t('monthly')}</option>
                                    <option value="Quarterly">{t('quarterly')}</option>
                                    <option value="Annual">{t('annual')}</option>
                                </select>
                            </div>
                            <div className={`form-group ${showError('fromPlace') ? 'has-error' : ''}`}>
                                <label>16. {t('from_place')} <span className="required-star">*</span></label>
                                <input type="text" name="fromPlace" required onBlur={handleBlur} placeholder={t('starting_point')} />
                                {showError('fromPlace') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Starting point is required.</span>}
                            </div>
                            <div className={`form-group ${showError('toPlace') ? 'has-error' : ''}`}>
                                <label>{t('to_place')} <span className="required-star">*</span></label>
                                <input type="text" name="toPlace" required onBlur={handleBlur} placeholder={t('to_place')} />
                                {showError('toPlace') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Destination is required.</span>}
                            </div>
                            <div className="form-group full-width">
                                <label>17. {t('boarding_point')}</label>
                                <input type="text" name="boardingPoint" required />
                            </div>
                        </div>
                    </div>

                    {/* 4. ADDRESS DETAILS */}
                    <div className="form-section">
                        <h3>4. {t('address_details')}</h3>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>18. {t('res_address')}</label>
                                <textarea name="residentialAddress" required rows="3" placeholder={t('door_no_street')}></textarea>
                            </div>
                            <div className="form-group full-width">
                                <label>19. {t('office_name')} {t('address_details')}</label>
                                <textarea name="officeAddress" required rows="3" placeholder={t('office_name') + ' ' + t('address_details')}></textarea>
                            </div>
                        </div>
                    </div>

                    {/* 5. UPLOAD & VERIFICATION */}
                    <div className="form-section">
                        <h3>5. {t('upload_verification')}</h3>
                        <div className="form-grid">
                            <div className="form-group file-upload">
                                <label>{t('gov_emp_pass_title')} ID Card Upload <span className="required-star">*</span></label>
                                <input type="file" accept="image/*,.pdf" required onChange={(e) => handleDocumentUpload(e, 'idCardDoc')} />
                            </div>
                            <div className="form-group file-upload">
                                <label>{t('salary_cert_upload')} <span className="required-star">*</span></label>
                                <input type="file" accept="image/*,.pdf" required onChange={(e) => handleDocumentUpload(e, 'salaryCertificateDoc')} />
                            </div>
                            <div className="form-group file-upload" style={{ gridColumn: '1 / -1' }}>
                                <label>{t('address_proof_upload')} <span className="required-star">*</span></label>
                                <input type="file" accept="image/*,.pdf" required onChange={(e) => handleDocumentUpload(e, 'addressProofDoc')} />
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

                    {/* 6. DECLARATION */}
                    <div className="form-section declaration">
                        <h3>6. Declaration by Applicant</h3>
                        <label className="checkbox-label">
                            <input type="checkbox" required />
                            <span>I hereby declare that the information furnished above is true and correct. I request issuance of Government Employee Bus Pass subject to APSRTC rules and eligibility norms.</span>
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

export default GovEmpApplicationForm;
