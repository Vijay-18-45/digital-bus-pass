import React, { useState, useEffect, useRef } from 'react';
import './GovEmpApplicationForm.css';
import LogoBackButton from './LogoBackButton';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS } from '../api/config';

const GovEmpApplicationForm = () => {
    const { t } = useLanguage();
    const [photo, setPhoto] = useState(null);
    const [isPhysicallyChallenged, setIsPhysicallyChallenged] = useState(false);
    const [documents, setDocuments] = useState({
        idCardDoc: null,
        employmentDoc: null,
        addressProofDoc: null,
        disabilityCertificateDoc: null
    });
    const [formData, setFormData] = useState({
        fullName: '',
        dateOfBirth: '',
        gender: '',
        employmentType: '',
        organizationName: '',
        officeName: '',
        designation: '',
        employeeId: '',
        pfId: '',
        officeAddress: '',
        officeCity: '',
        officeDistrict: '',
        officePincode: '',
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
            
            // Employment
            if (!formData.employmentType) missingFields.push('Employee Type');
            if (!formData.organizationName.trim()) missingFields.push('Organization/Department Name');
            if (!formData.officeName.trim()) missingFields.push('Office/Organization Name');
            if (!formData.designation.trim()) missingFields.push('Designation');
            if (!formData.employeeId.trim()) missingFields.push('Employee ID Number');
            
            // Office Address
            if (!formData.officeAddress.trim()) missingFields.push('Office Address');
            if (!formData.officeCity.trim()) missingFields.push('Office City/Town');
            if (!formData.officeDistrict.trim()) missingFields.push('Office District');
            if (!formData.officePincode.trim()) missingFields.push('Office PIN Code');
            
            // Residential Address
            if (!formData.houseAddress.trim()) missingFields.push('House Address');
            if (!formData.villageTownCity.trim()) missingFields.push('Residential Village/Town/City');
            if (!formData.residentDistrict.trim()) missingFields.push('Residential District');
            if (!formData.residentPincode.trim()) missingFields.push('Residential PIN Code');
            
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
            if (!documents.idCardDoc && !documents.employmentDoc) {
                missingFields.push('Employment Verification Document');
            }

            if (missingFields.length > 0) {
                alert(`Please fill in the following required fields:\n\n${missingFields.join('\n')}`);
                setIsSubmitting(false);
                return;
            }

            const payload = {
                applicationType: 'gov_employee',
                fullName: formData.fullName,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
                
                employmentType: formData.employmentType,
                deptMinistry: formData.organizationName,
                officeName: formData.officeName,
                designation: formData.designation,
                govEmpIdPf: formData.employeeId,
                payScale: formData.pfId, // Optional PF field mapped to payScale or similar

                officeAddress: `${formData.officeAddress}, ${formData.officeCity}, ${formData.officeDistrict} - ${formData.officePincode}`,
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
                idCardDoc: documents.idCardDoc || documents.employmentDoc,
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
        <div className="gov-emp-page-container">
            <LogoBackButton />
            <div className="gov-emp-form-wrapper">
                <div className="form-header-premium">
                    <h2>APSRTC Employee Pass</h2>
                    <h4>Government & Professional Employee Registration</h4>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* 1. PERSONAL DETAILS */}
                    <div className="form-section">
                        <h3>1. Personal Details (Mandatory)</h3>
                        <div className="form-grid">
                            <div className={`form-group full-width ${showError('fullName') ? 'has-error' : ''}`}>
                                <label>Full Name of Employee <span className="required-star">*</span></label>
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
                                    <button type="button" className="action-btn-p" onClick={() => fileInputRef.current.click()}>Upload File</button>
                                    <button type="button" className="action-btn-p camera" onClick={startCamera}>Capture Live</button>
                                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. EMPLOYMENT DETAILS */}
                    <div className="form-section">
                        <h3>2. Employment Details (Mandatory)</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Employee Type <span className="required-star">*</span></label>
                                <select name="employmentType" value={formData.employmentType} onChange={handleChange} required>
                                    <option value="">Select Type</option>
                                    <option value="Government">Government</option>
                                    <option value="Private">Private</option>
                                    <option value="Contract">Contract</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Organization / Department Name <span className="required-star">*</span></label>
                                <input type="text" name="organizationName" value={formData.organizationName} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Office / Organization Name <span className="required-star">*</span></label>
                                <input type="text" name="officeName" value={formData.officeName} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Designation <span className="required-star">*</span></label>
                                <input type="text" name="designation" value={formData.designation} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Employee ID Number <span className="required-star">*</span></label>
                                <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>PF / GPF / EPF ID (Optional)</label>
                                <input type="text" name="pfId" value={formData.pfId} onChange={handleChange} placeholder="If available" />
                            </div>
                        </div>
                    </div>

                    {/* 3. OFFICE ADDRESS */}
                    <div className="form-section">
                        <h3>3. Office Address (Mandatory)</h3>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Office Address <span className="required-star">*</span></label>
                                <input type="text" name="officeAddress" value={formData.officeAddress} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>City / Town <span className="required-star">*</span></label>
                                <input type="text" name="officeCity" value={formData.officeCity} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>District <span className="required-star">*</span></label>
                                <input type="text" name="officeDistrict" value={formData.officeDistrict} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>PIN Code <span className="required-star">*</span></label>
                                <input type="text" name="officePincode" value={formData.officePincode} onChange={handleChange} maxLength="6" required />
                            </div>
                        </div>
                    </div>

                    {/* 4. RESIDENTIAL ADDRESS */}
                    <div className="form-section">
                        <h3>4. Residential Address (Mandatory)</h3>
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

                    {/* 5. TRAVEL DETAILS */}
                    <div className="form-section">
                        <h3>5. Travel Details (Mandatory)</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Boarding Point <span className="required-star">*</span></label>
                                <input type="text" name="boardingPoint" value={formData.boardingPoint} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Destination (Office Location) <span className="required-star">*</span></label>
                                <input type="text" name="destination" value={formData.destination} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Nearest Bus Depot <span className="required-star">*</span></label>
                                <input type="text" name="busDepot" value={formData.busDepot} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Route Selection</label>
                                <input type="text" name="routeSelection" value={formData.routeSelection} onChange={handleChange} placeholder="e.g. Via Hospital Road" />
                            </div>
                        </div>
                    </div>

                    {/* 6. PASS DETAILS */}
                    <div className="form-section">
                        <h3>6. Pass Details (Mandatory)</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Pass Type <span className="required-star">*</span></label>
                                <select name="passType" value={formData.passType} onChange={handleChange} required>
                                    <option value="">Select Pass</option>
                                    <option value="Ordinary">Ordinary</option>
                                    <option value="Metro Express">Metro Express</option>
                                    <option value="Metro Deluxe">Metro Deluxe</option>
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
                        <h3>7. Contact Details (Mandatory)</h3>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Registered Mobile Number <span className="required-star">*</span></label>
                                <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} />
                                <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>Pre-filled from your login. You can edit if needed.</small>
                            </div>
                        </div>
                    </div>

                    {/* 8. VERIFICATION DOCUMENT */}
                    <div className="form-section">
                        <h3>8. Employment Verification Document (Mandatory)</h3>
                        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '15px' }}>Upload any one: ID Card / Auth Letter / Employment Cert</p>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Upload Document <span className="required-star">*</span></label>
                                <input type="file" accept="image/*,.pdf" onChange={(e) => handleDocumentUpload(e, 'employmentDoc')} required />
                                {documents.employmentDoc && <span className="success-tag">✓ Document Ready</span>}
                            </div>
                        </div>
                    </div>

                    {/* 9. DECLARATION */}
                    <div className="form-section declaration-premium">
                        <h3>9. Declaration (Mandatory)</h3>
                        <div className="checkbox-layout">
                            <input type="checkbox" name="declaration" checked={formData.declaration} onChange={handleChange} required />
                            <label>I hereby declare that all information submitted is correct. I understand that false data leads to pass cancellation. <span className="required-star">*</span></label>
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

export default GovEmpApplicationForm;
