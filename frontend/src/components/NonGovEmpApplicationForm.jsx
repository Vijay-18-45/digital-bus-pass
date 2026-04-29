import React, { useState, useEffect, useRef } from 'react';
import './NonGovEmpApplicationForm.css';
import LogoBackButton from './LogoBackButton';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS } from '../api/config';

const NonGovEmpApplicationForm = () => {
    const { t } = useLanguage();
    const [photo, setPhoto] = useState(null);
    const [isPhysicallyChallenged, setIsPhysicallyChallenged] = useState(false);
    const [documents, setDocuments] = useState({
        identityProofDoc: null,
        disabilityCertificateDoc: null
    });
    const [formData, setFormData] = useState({
        fullName: '',
        dateOfBirth: '',
        gender: '',
        occupationType: '',
        workplacePurpose: '',
        houseAddress: '',
        villageTownCity: '',
        residentDistrict: '',
        residentPincode: '',
        boardingPoint: '',
        destination: '',
        busDepot: '',
        routeSelection: '',
        passType: '',
        passDuration: '',
        mobileNumber: '',
        email: '',
        declaration: false
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
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

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

        if (!formData.declaration) {
            alert('Please accept the declaration');
            return;
        }

        setIsSubmitting(true);

        try {
            const missingFields = [];
            // Personal
            if (!formData.fullName.trim()) missingFields.push('Full Name');
            if (!formData.dateOfBirth) missingFields.push('Date of Birth');
            if (!formData.gender) missingFields.push('Gender');
            if (!photo) missingFields.push('Passport Size Photo');
            
            // Occupation
            if (!formData.occupationType) missingFields.push('Occupation Type');
            if (!formData.workplacePurpose.trim()) missingFields.push('Workplace/Purpose');
            
            // Residential Address
            if (!formData.houseAddress.trim()) missingFields.push('House Address');
            if (!formData.villageTownCity.trim()) missingFields.push('Village/Town/City');
            if (!formData.residentDistrict.trim()) missingFields.push('District');
            if (!formData.residentPincode.trim()) missingFields.push('PIN Code');
            
            // Travel
            if (!formData.boardingPoint.trim()) missingFields.push('Boarding Point');
            if (!formData.destination.trim()) missingFields.push('Destination');
            if (!formData.busDepot.trim()) missingFields.push('Nearest Bus Depot');
            
            // Pass
            if (!formData.passType) missingFields.push('Pass Type');
            if (!formData.passDuration) missingFields.push('Pass Duration');
            
            // Contact
            if (!formData.mobileNumber.trim()) missingFields.push('Mobile Number');
            
            // Document
            if (!documents.identityProofDoc) missingFields.push('Identity Proof Upload');

            if (missingFields.length > 0) {
                alert(`Please fill in the following required fields:\n\n${missingFields.join('\n')}`);
                setIsSubmitting(false);
                return;
            }

            const payload = {
                applicationType: 'non_gov_employee',
                fullName: formData.fullName,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
                
                employmentType: formData.occupationType, // Reusing field
                officeAddress: formData.workplacePurpose, // Reusing field for workplace
                
                residentialAddress: `${formData.houseAddress}, ${formData.villageTownCity}, ${formData.residentDistrict} - ${formData.residentPincode}`,
                
                fromPlace: formData.boardingPoint,
                toPlace: formData.destination,
                depotDetails: formData.busDepot,
                via: formData.routeSelection,
                
                passType: formData.passType,
                passDuration: formData.passDuration,
                
                mobile: formData.mobileNumber,
                email: formData.email,
                
                photo: photo,
                idCardDoc: documents.identityProofDoc, 
                
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
                alert(`Application submitted successfully! ID: ${data.applicationId}`);
                window.location.reload();
            } else {
                alert(`Submission failed: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            alert('Failed to submit application. Please check your connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="non-gov-emp-page-container">
            <LogoBackButton />
            <div className="non-gov-emp-form-wrapper">
                <div className="form-header-premium">
                    <h2>Citizen & Private Pass</h2>
                    <h4>General Public Registration</h4>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* 1. PERSONAL DETAILS */}
                    <div className="form-section">
                        <h3>1. Personal Details (Mandatory)</h3>
                        <div className="form-grid">
                            <div className={`form-group full-width ${showError('fullName') ? 'has-error' : ''}`}>
                                <label>Full Name of Applicant <span className="required-star">*</span></label>
                                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required onBlur={handleBlur} />
                            </div>
                            <div className="form-group">
                                <label>Date of Birth <span className="required-star">*</span></label>
                                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Gender <span className="required-star">*</span></label>
                                <select name="gender" value={formData.gender} onChange={handleChange} required>
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div className="photo-section-premium" style={{ marginTop: '20px' }}>
                            <label>Recent Passport Size Photo <span className="required-star">*</span></label>
                            <div className="photo-upload-layout">
                                <div className="photo-preview-box">
                                    {photo ? <img src={photo} alt="Preview" /> : <div className="photo-placeholder"></div>}
                                </div>
                                <div className="photo-btn-group">
                                    <button type="button" className="action-btn-p" onClick={() => fileInputRef.current.click()}>Upload Photo</button>
                                    <button type="button" className="action-btn-p camera" onClick={startCamera}>Use Camera</button>
                                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. OCCUPATION DETAILS */}
                    <div className="form-section">
                        <h3>2. Occupation Details (Mandatory)</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Occupation Type <span className="required-star">*</span></label>
                                <select name="occupationType" value={formData.occupationType} onChange={handleChange} required>
                                    <option value="">Select Occupation</option>
                                    <option value="Private Employee">Private Employee</option>
                                    <option value="Business">Business</option>
                                    <option value="Self-Employed">Self-Employed</option>
                                    <option value="Worker">Worker</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Workplace / Purpose of Travel <span className="required-star">*</span></label>
                                <input type="text" name="workplacePurpose" value={formData.workplacePurpose} onChange={handleChange} required placeholder="e.g. Kondapur Office / Market" />
                            </div>
                        </div>
                    </div>

                    {/* 3. RESIDENTIAL ADDRESS */}
                    <div className="form-section">
                        <h3>3. Residential Address (Mandatory)</h3>
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
                                <input type="text" name="residentPincode" value={formData.residentPincode} onChange={handleChange} maxLength="6" required />
                            </div>
                        </div>
                    </div>

                    {/* 4. TRAVEL DETAILS */}
                    <div className="form-section">
                        <h3>4. Travel Details (Mandatory)</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Boarding Point <span className="required-star">*</span></label>
                                <input type="text" name="boardingPoint" value={formData.boardingPoint} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Destination <span className="required-star">*</span></label>
                                <input type="text" name="destination" value={formData.destination} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Nearest Bus Depot <span className="required-star">*</span></label>
                                <input type="text" name="busDepot" value={formData.busDepot} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Route Selection</label>
                                <input type="text" name="routeSelection" value={formData.routeSelection} onChange={handleChange} placeholder="e.g. Via NH-44" />
                            </div>
                        </div>
                    </div>

                    {/* 5. PASS DETAILS */}
                    <div className="form-section">
                        <h3>5. Pass Details (Mandatory)</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Pass Type <span className="required-star">*</span></label>
                                <select name="passType" value={formData.passType} onChange={handleChange} required>
                                    <option value="">Select Pass</option>
                                    <option value="General Monthly">General Monthly</option>
                                    <option value="Metro Express">Metro Express</option>
                                    <option value="Airport Pass">Airport Pass</option>
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

                    {/* 6. CONTACT DETAILS */}
                    <div className="form-section">
                        <h3>6. Contact Details (Mandatory)</h3>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Registered Mobile Number <span className="required-star">*</span></label>
                                <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} />
                                <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>Pre-filled from your login. You can edit if needed.</small>
                            </div>
                            <div className="form-group full-width">
                                <label>Email Address (Optional)</label>
                                <input type="email" name="email" value={formData.email || ''} onChange={handleChange} placeholder="Enter your email address" />
                            </div>
                        </div>
                    </div>

                    {/* 7. IDENTITY PROOF */}
                    <div className="form-section">
                        <h3>7. Identity Proof Upload (Mandatory)</h3>
                        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '15px' }}>Upload Aadhaar / Voter ID / Driving License</p>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Upload Proof Image <span className="required-star">*</span></label>
                                <input type="file" accept="image/*,.pdf" onChange={(e) => handleDocumentUpload(e, 'identityProofDoc')} required />
                                {documents.identityProofDoc && <span className="success-tag">✓ Uploaded</span>}
                            </div>
                        </div>
                    </div>

                    {/* 8. DECLARATION */}
                    <div className="form-section declaration-premium">
                        <h3>8. Declaration (Mandatory)</h3>
                        <div className="checkbox-layout">
                            <input type="checkbox" name="declaration" checked={formData.declaration} onChange={handleChange} required />
                            <label>I declare that the information provided is valid. I will follow APSRTC rules for bus pass usage. <span className="required-star">*</span></label>
                        </div>
                    </div>

                    <div className="form-submit-container">
                        <button type="submit" className="submit-btn" disabled={isSubmitting}>
                            {isSubmitting ? 'Processing...' : 'Submit Application'}
                        </button>
                    </div>
                </form>
            </div>

            {showCamera && (
                <div className="camera-modal">
                    <div className="camera-content">
                        <video ref={videoRef} autoPlay />
                        <canvas ref={canvasRef} width="320" height="240" style={{ display: 'none' }} />
                        <div className="camera-actions">
                            <button type="button" onClick={capturePhoto} className="capture-btn">Capture</button>
                            <button type="button" onClick={stopCamera} className="cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NonGovEmpApplicationForm;
