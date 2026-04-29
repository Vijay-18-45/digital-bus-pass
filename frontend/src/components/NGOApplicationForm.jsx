import React, { useState, useEffect, useRef } from 'react';
import './NGOApplicationForm.css';
import LogoBackButton from './LogoBackButton';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS } from '../api/config';

const NGOApplicationForm = () => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        fullName: '',
        fatherName: '',
        dateOfBirth: '',
        gender: '',
        aadharNumber: '',
        mobileNumber: '',
        
        ngoName: '',
        ngoRegistrationNumber: '',
        ngoType: '',
        ngoAddress: '',
        ngoDistrict: '',
        
        designation: '',
        employeeId: '',
        joiningDate: '',
        workLocation: '',
        
        houseAddress: '',
        villageTownCity: '',
        residentDistrict: '',
        pincode: '',
        
        boardingPoint: '',
        destination: '',
        busDepot: '',
        routeSelection: '',
        
        passType: '',
        passDuration: '',
        
        declaration: false
    });

    const [photo, setPhoto] = useState(null);
    const [isPhysicallyChallenged, setIsPhysicallyChallenged] = useState(false);
    const [documents, setDocuments] = useState({
        idCardDoc: null,
        authorizationDoc: null,
        registrationDoc: null,
        addressProofDoc: null,
        disabilityCertificateDoc: null
    });
    const [showCamera, setShowCamera] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState({});
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const identifier = localStorage.getItem('userIdentifier');
        if (identifier && /^\d+$/.test(identifier)) {
            setFormData(prev => ({ ...prev, mobileNumber: identifier }));
            // Add a slight delay to ensure UI reflects auto-fill
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        if (name) setTouched(prev => ({ ...prev, [name]: true }));
    };

    const showError = (name) => {
        const input = document.querySelector(`[name="${name}"]`);
        return touched[name] && input && !input.validity.valid;
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

        if (!formData.declaration) {
            alert('Please accept the declaration');
            return;
        }

        setIsSubmitting(true);

        try {
            const missingFields = [];
            // Personal Details
            if (!formData.fullName.trim()) missingFields.push('Full Name');
            if (!formData.dateOfBirth) missingFields.push('Date of Birth');
            if (!formData.gender) missingFields.push('Gender');
            if (!photo) missingFields.push('Passport Size Photo');
            
            // NGO Details
            if (!formData.ngoName.trim()) missingFields.push('NGO Name');
            if (!formData.ngoRegistrationNumber.trim()) missingFields.push('NGO Registration Number');
            if (!formData.ngoType) missingFields.push('NGO Type/Category');
            if (!formData.ngoAddress.trim()) missingFields.push('NGO Office Address');
            if (!formData.ngoDistrict.trim()) missingFields.push('NGO District');
            
            // Employment Details
            if (!formData.designation.trim()) missingFields.push('Applicant Designation');
            if (!formData.joiningDate) missingFields.push('Date of Joining NGO');
            if (!formData.workLocation.trim()) missingFields.push('Work Location');
            
            // Residential Details
            if (!formData.houseAddress.trim()) missingFields.push('House Address');
            if (!formData.villageTownCity.trim()) missingFields.push('Village/Town/City');
            if (!formData.residentDistrict.trim()) missingFields.push('Residential District');
            if (!formData.pincode.trim()) missingFields.push('PIN Code');
            
            // Travel Details
            if (!formData.boardingPoint.trim()) missingFields.push('Boarding Point');
            if (!formData.destination.trim()) missingFields.push('Destination');
            if (!formData.busDepot.trim()) missingFields.push('Nearest Bus Depot');
            
            // Pass Details
            if (!formData.passType) missingFields.push('Pass Type');
            if (!formData.passDuration) missingFields.push('Pass Duration');
            
            // Contact Details
            if (!formData.mobileNumber.trim()) missingFields.push('Mobile Number');
            
            // Documents
            if (!documents.idCardDoc) missingFields.push('NGO ID Card');
            if (!documents.authorizationDoc) missingFields.push('NGO Authorization Letter');
            if (!documents.registrationDoc) missingFields.push('NGO Registration Certificate');

            if (missingFields.length > 0) {
                alert(`Please fill in the following required fields:\n\n${missingFields.join('\n')}`);
                setIsSubmitting(false);
                return;
            }

            // Backend Mapping (No backend change allowed - reusing existing fields)
            const payload = {
                applicationType: 'ngo_worker',
                fullName: formData.fullName,
                fatherName: formData.fatherName,
                gender: formData.gender,
                dateOfBirth: formData.dateOfBirth,
                aadharNumber: formData.aadharNumber,
                mobile: formData.mobileNumber,
                email: formData.email,
                
                ngoName: formData.ngoName,
                ngoRegistrationNumber: formData.ngoRegistrationNumber,
                designation: formData.designation,
                dateOfAppointment: formData.joiningDate,
                
                // Combining address + district for existing ngoAddress field
                ngoAddress: `${formData.ngoAddress}, ${formData.ngoDistrict}`,
                
                // Combining residential fields for existing residentialAddress field
                residentialAddress: `${formData.houseAddress}, ${formData.villageTownCity}, ${formData.residentDistrict} - ${formData.pincode}`,
                
                fromPlace: formData.boardingPoint,
                toPlace: formData.destination,
                depotDetails: formData.busDepot,
                via: formData.routeSelection,
                
                passType: formData.passType,
                validity: formData.passDuration,
                
                // Document Mapping
                photo: photo,
                idCardDoc: documents.idCardDoc,
                salaryCertificateDoc: documents.authorizationDoc, // Reused for Authorization Letter
                otherDoc: documents.registrationDoc, // Reused for Registration Certificate
                addressProofDoc: documents.addressProofDoc,
                
                isPhysicallyChallenged: isPhysicallyChallenged,
                disabilityCertificateDoc: documents.disabilityCertificateDoc
            };

            const response = await fetch(API_ENDPOINTS.submitApplication, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {
                alert(`Application submitted successfully! Your Application ID: ${data.applicationId}`);
                setFormData({
                    fullName: '', fatherName: '', dateOfBirth: '', gender: '', aadharNumber: '', mobileNumber: '',
                    ngoName: '', ngoRegistrationNumber: '', ngoType: '', ngoAddress: '', ngoDistrict: '',
                    designation: '', employeeId: '', joiningDate: '', workLocation: '',
                    houseAddress: '', villageTownCity: '', residentDistrict: '', pincode: '',
                    boardingPoint: '', destination: '', busDepot: '', routeSelection: '',
                    passType: '', passDuration: '', declaration: false
                });
                setPhoto(null);
                setDocuments({ idCardDoc: null, authorizationDoc: null, registrationDoc: null, addressProofDoc: null, disabilityCertificateDoc: null });
            } else {
                alert(`Submission failed: ${data.message || 'Unknown error'}`);
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
            <LogoBackButton />
            <div className="ngo-form-wrapper">
                <div className="form-title-bar">
                    <h2 className="form-title">{t('ngo_pass_title')}</h2>
                </div>

                <form onSubmit={handleSubmit} className="registration-content">
                    {/* 1. PERSONAL DETAILS */}
                    <div className="form-section">
                        <h3 className="section-header">1. Personal Details (Mandatory)</h3>
                        <div className="form-grid">
                            <div className={`form-group ${showError('fullName') ? 'has-error' : ''}`}>
                                <label>Full Name of Applicant <span className="required-star">*</span></label>
                                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required pattern="[A-Za-z\s]+" onBlur={handleBlur} placeholder="Enter full name" />
                            </div>
                            <div className={`form-group ${showError('dateOfBirth') ? 'has-error' : ''}`}>
                                <label>Date of Birth <span className="required-star">*</span></label>
                                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} max={new Date().toISOString().split('T')[0]} onBlur={handleBlur} required />
                            </div>
                            <div className={`form-group ${showError('gender') ? 'has-error' : ''}`}>
                                <label>Gender <span className="required-star">*</span></label>
                                <select name="gender" value={formData.gender} onChange={handleChange} required onBlur={handleBlur}>
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div className="photo-upload-section" style={{ marginTop: '20px' }}>
                            <label>Recent Passport Size Photo <span className="required-star">*</span></label>
                            <div className="photo-box-wrapper">
                                <div className="photo-box">
                                    {photo ? <img src={photo} alt="Preview" /> : <img src="photo-spec.png" alt="No photo" style={{ opacity: 0.2 }} />}
                                </div>
                                <div className="photo-controls">
                                    <button type="button" className="photo-action-btn" onClick={() => fileInputRef.current.click()}>Upload Photo</button>
                                    <button type="button" className="camera-btn" onClick={startCamera}>Use Camera</button>
                                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. NGO ORGANIZATION DETAILS */}
                    <div className="form-section">
                        <h3 className="section-header">2. NGO Organization Details (Mandatory)</h3>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>NGO Name <span className="required-star">*</span></label>
                                <input type="text" name="ngoName" value={formData.ngoName} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>NGO Registration Number <span className="required-star">*</span></label>
                                <input type="text" name="ngoRegistrationNumber" value={formData.ngoRegistrationNumber} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>NGO Type / Category <span className="required-star">*</span></label>
                                <select name="ngoType" value={formData.ngoType} onChange={handleChange} required>
                                    <option value="">Select Category</option>
                                    <option value="Social Welfare">Social Welfare</option>
                                    <option value="Environmental">Environmental</option>
                                    <option value="Healthcare">Healthcare</option>
                                    <option value="Education">Education</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-group full-width">
                                <label>NGO Office Address <span className="required-star">*</span></label>
                                <input type="text" name="ngoAddress" value={formData.ngoAddress} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>District <span className="required-star">*</span></label>
                                <input type="text" name="ngoDistrict" value={formData.ngoDistrict} onChange={handleChange} required />
                            </div>
                        </div>
                    </div>

                    {/* 3. EMPLOYMENT DETAILS */}
                    <div className="form-section">
                        <h3 className="section-header">3. Employment Details (Mandatory)</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Applicant Designation in NGO <span className="required-star">*</span></label>
                                <input type="text" name="designation" value={formData.designation} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Employee / Volunteer ID (if available)</label>
                                <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Date of Joining NGO <span className="required-star">*</span></label>
                                <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Work Location <span className="required-star">*</span></label>
                                <input type="text" name="workLocation" value={formData.workLocation} onChange={handleChange} required />
                            </div>
                        </div>
                    </div>

                    {/* 4. RESIDENTIAL ADDRESS */}
                    <div className="form-section">
                        <h3 className="section-header">4. Residential Address (Mandatory)</h3>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>House Address <span className="required-star">*</span></label>
                                <input type="text" name="houseAddress" value={formData.houseAddress} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Village / Town / City <span className="required-star">*</span></label>
                                <input type="text" name="villageTownCity" value={formData.villageTownCity} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>District <span className="required-star">*</span></label>
                                <input type="text" name="residentDistrict" value={formData.residentDistrict} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>PIN Code <span className="required-star">*</span></label>
                                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} pattern="\d{6}" maxLength="6" required />
                            </div>
                        </div>
                    </div>

                    {/* 5. TRAVEL DETAILS */}
                    <div className="form-section">
                        <h3 className="section-header">5. Travel Details (Mandatory)</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Boarding Point <span className="required-star">*</span></label>
                                <input type="text" name="boardingPoint" value={formData.boardingPoint} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Destination (NGO Work Location) <span className="required-star">*</span></label>
                                <input type="text" name="destination" value={formData.destination} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Nearest Bus Depot <span className="required-star">*</span></label>
                                <input type="text" name="busDepot" value={formData.busDepot} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Route Selection</label>
                                <input type="text" name="routeSelection" value={formData.routeSelection} onChange={handleChange} placeholder="e.g. via School Road" />
                            </div>
                        </div>
                    </div>

                    {/* 6. PASS DETAILS */}
                    <div className="form-section">
                        <h3 className="section-header">6. Pass Details (Mandatory)</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Pass Type <span className="required-star">*</span></label>
                                <select name="passType" value={formData.passType} onChange={handleChange} required>
                                    <option value="">Select Pass</option>
                                    <option value="Ordinary">Ordinary</option>
                                    <option value="Metro">Metro</option>
                                    <option value="City">City</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Pass Duration <span className="required-star">*</span></label>
                                <select name="passDuration" value={formData.passDuration} onChange={handleChange} required>
                                    <option value="">Select Duration</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Quarterly">Quarterly</option>
                                    <option value="Annual">Annual</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 7. CONTACT DETAILS */}
                    <div className="form-section">
                        <h3 className="section-header">7. Contact Details (Mandatory)</h3>
                        <div className="form-grid">
                            <div className={`form-group full-width ${showError('mobileNumber') ? 'has-error' : ''}`}>
                                <label>Registered Mobile Number <span className="required-star">*</span></label>
                                <div className="mobile-prefix">
                                    <span>+91</span>
                                    <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} />
                                </div>
                                <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>Pre-filled from your login. You can edit if needed.</small>
                            </div>
                        </div>
                    </div>

                    {/* 8. NGO VERIFICATION DOCUMENTS */}
                    <div className="form-section">
                        <h3 className="section-header">8. NGO Verification Documents (Mandatory)</h3>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>NGO ID Card <span className="required-star">*</span></label>
                                <input type="file" accept="image/*,.pdf" required onChange={(e) => handleDocumentUpload(e, 'idCardDoc')} />
                                {documents.idCardDoc && <span className="upload-success">✓ File Selected</span>}
                            </div>
                            <div className="form-group full-width">
                                <label>NGO Authorization Letter / Employment Certificate <span className="required-star">*</span></label>
                                <input type="file" accept="image/*,.pdf" required onChange={(e) => handleDocumentUpload(e, 'authorizationDoc')} />
                                {documents.authorizationDoc && <span className="upload-success">✓ File Selected</span>}
                            </div>
                            <div className="form-group full-width">
                                <label>NGO Registration Certificate (organization proof) <span className="required-star">*</span></label>
                                <input type="file" accept="image/*,.pdf" required onChange={(e) => handleDocumentUpload(e, 'registrationDoc')} />
                                {documents.registrationDoc && <span className="upload-success">✓ File Selected</span>}
                            </div>
                            <div className="form-group full-width">
                                <label>Address Proof (Optional)</label>
                                <input type="file" accept="image/*,.pdf" onChange={(e) => handleDocumentUpload(e, 'addressProofDoc')} />
                            </div>
                        </div>
                    </div>

                    {/* 9. DECLARATION */}
                    <div className="form-section declaration-section">
                        <h3 className="section-header">9. Declaration (Mandatory)</h3>
                        <div className="checkbox-group">
                            <input type="checkbox" name="declaration" checked={formData.declaration} onChange={handleChange} required />
                            <label><strong>I hereby declare that all the information provided above is true and correct to the best of my knowledge.</strong> <span className="required-star">*</span></label>
                        </div>
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
                        <video ref={videoRef} autoPlay style={{ width: '100%', borderRadius: '16px', marginBottom: '25px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }} />
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
