import React, { useState, useEffect, useRef } from 'react';
import './aboveSSCForm.css';
import LogoBackButton from './LogoBackButton';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS } from '../api/config';

const AboveSSCForm = () => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '', fatherName: '', dob: '', aadhaar: '', gender: '',
        studentCategory: 'Intermediate', // Default for Above SSC
        mobile: '', email: '', sscBoard: 'AP Board', sscYear: '', sscHtno: '',
        college: '', institutionType: '', course: '', academicYear: '', registrationNumber: '', 
        door: '', village: '', mandal: '', pincode: '',
        from: '', via: '', to: '', depot: '', isGovtEmployeeChild: false,
        parentEmployeeName: '', parentPfNumber: '', isPhysicallyChallenged: false,
        passType: '', passDuration: '', declaration: false
    });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [documents, setDocuments] = useState({
        idCardDoc: null,
        addressProofDoc: null,
        studyCertificateDoc: null,
        disabilityCertificateDoc: null
    });

    const [photo, setPhoto] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const identifier = localStorage.getItem('userIdentifier');
        if (identifier && /^\d+$/.test(identifier)) {
            setFormData(prev => ({ ...prev, mobile: identifier }));
        }
    }, []);

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
        
        if (!formData.declaration) {
            alert('Please accept the declaration');
            return;
        }

        setIsSubmitting(true);

        try {
            // Validate required fields
            const missingFields = [];
            if (!formData.name?.trim()) missingFields.push('Full Name');
            if (!formData.dob) missingFields.push('Date of Birth');
            if (!formData.gender) missingFields.push('Gender');
            if (!formData.studentCategory) missingFields.push('Student Category');
            if (!photo) missingFields.push('Passport Size Photo');

            if (!formData.course?.trim()) missingFields.push('Education Level / Class / Course');
            if (!formData.institutionType) missingFields.push('Institution Type');
            if (!formData.college?.trim()) missingFields.push('Institution Name');
            if (!formData.registrationNumber?.trim()) missingFields.push('Registration/Roll Number');
            if (!formData.academicYear?.trim()) missingFields.push('Academic Year');

            if (!formData.door?.trim()) missingFields.push('Residential Address');
            if (!formData.village?.trim()) missingFields.push('Village / Town / City');
            if (!formData.mandal?.trim()) missingFields.push('District');
            if (!formData.pincode?.trim()) missingFields.push('PIN Code');

            if (!formData.from?.trim()) missingFields.push('Boarding Point');
            if (!formData.to?.trim()) missingFields.push('Destination');
            if (!formData.depot?.trim()) missingFields.push('Nearest Bus Depot');

            if (!formData.fatherName?.trim()) missingFields.push('Guardian Name');
            if (!formData.mobile?.trim()) missingFields.push('Mobile Number');

            if (!formData.passType) missingFields.push('Pass Type');
            if (!formData.passDuration) missingFields.push('Pass Duration');

            if (!documents.idCardDoc) missingFields.push('Institution ID Card');
            if (!documents.addressProofDoc) missingFields.push('Address Proof');

            if (missingFields.length > 0) {
                alert('Please fill in the following required fields:\n\n' + missingFields.join('\n'));
                setIsSubmitting(false);
                return;
            }

            const payload = {
                applicationType: 'student_above_ssc',
                fullName: formData.name,
                fatherName: formData.fatherName,
                gender: formData.gender,
                dateOfBirth: formData.dob || null,
                studentCategory: formData.studentCategory,
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
                institutionType: formData.institutionType,
                courseYear: formData.course,
                academicYear: formData.academicYear,
                registrationNumber: formData.registrationNumber,
                sscBoard: formData.sscBoard,
                sscYear: formData.sscYear,
                sscHtno: formData.sscHtno,
                passType: formData.passType,
                passDuration: formData.passDuration,
                isGovtEmployeeChild: formData.isGovtEmployeeChild,
                parentEmployeeName: formData.parentEmployeeName,
                parentPfNumber: formData.parentPfNumber,
                isPhysicallyChallenged: formData.isPhysicallyChallenged,
                disabilityCertificateDoc: documents.disabilityCertificateDoc,
                photo: photo,
                idCardDoc: documents.idCardDoc,
                addressProofDoc: documents.addressProofDoc,
                studyCertificateDoc: documents.studyCertificateDoc
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
                    studentCategory: 'Intermediate',
                    mobile: '', sscBoard: 'AP Board', sscYear: '', sscHtno: '',
                    college: '', institutionType: '', course: '', academicYear: '', registrationNumber: '', 
                    door: '', village: '', mandal: '', pincode: '',
                    from: '', via: '', to: '', depot: '', isGovtEmployeeChild: false,
                    parentEmployeeName: '', parentPfNumber: '', isPhysicallyChallenged: false,
                    passType: '', passDuration: '', declaration: false
                });
                setPhoto(null);
                setDocuments({ idCardDoc: null, addressProofDoc: null, studyCertificateDoc: null, disabilityCertificateDoc: null });
                setErrors({});
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
                            <h3 className="section-header">1. Student Personal Details (Mandatory)</h3>
                            <div className="form-grid-2x2">
                                <div className={`form-group ${showError('name') ? 'has-error' : ''}`}>
                                    <label>{t('full_name')} <span className="required-star">*</span></label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} required pattern="[A-Za-z\s]+" title="Only letters and spaces allowed" placeholder={t('enter_name')} />
                                    {showError('name') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please enter a valid name (letters only).</span>}
                                </div>
                                <div className={`form-group ${showError('dob') ? 'has-error' : ''}`}>
                                    <label>{t('date_of_birth')} <span className="required-star">*</span></label>
                                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} onBlur={handleBlur} max={new Date().toISOString().split('T')[0]} required />
                                    {showError('dob') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please select a valid date of birth.</span>}
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
                                <div className="form-group">
                                    <label>Student Category <span className="required-star">*</span></label>
                                    <select name="studentCategory" value={formData.studentCategory} onChange={handleChange} required>
                                        <option value="School">{t('school') || 'School'}</option>
                                        <option value="Intermediate">{t('intermediate') || 'Intermediate'}</option>
                                        <option value="Degree">{t('degree') || 'Degree'}</option>
                                        <option value="Others">{t('others') || 'Others'}</option>
                                    </select>
                                </div>
                            </div>
                            <div className="checkbox-group">
                                <input type="checkbox" name="isGovtEmployeeChild" checked={formData.isGovtEmployeeChild} onChange={handleChange} />
                                <label>{t('is_govt_employee_child') || 'Is Government Employee Child'}</label>
                            </div>
                            {formData.isGovtEmployeeChild && (
                                <div className="form-grid-2x2" style={{marginTop: '15px'}}>
                                    <div className="form-group">
                                        <label>Parent/Guardian Employee Name <span className="required-star">*</span></label>
                                        <input 
                                            type="text" 
                                            name="parentEmployeeName" 
                                            value={formData.parentEmployeeName} 
                                            onChange={handleChange} 
                                            placeholder="Enter employee name"
                                            required={formData.isGovtEmployeeChild}
                                        />
                                        {errors.parentEmployeeName && <span className="error-message">{errors.parentEmployeeName}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>PF Number <span className="required-star">*</span></label>
                                        <input 
                                            type="text" 
                                            name="parentPfNumber" 
                                            value={formData.parentPfNumber} 
                                            onChange={handleChange} 
                                            placeholder="Enter PF Number"
                                            required={formData.isGovtEmployeeChild}
                                        />
                                        {errors.parentPfNumber && <span className="error-message">{errors.parentPfNumber}</span>}
                                    </div>
                                </div>
                            )}
                            
                            <div className="checkbox-group" style={{marginTop: '15px'}}>
                                <input type="checkbox" name="isPhysicallyChallenged" checked={formData.isPhysicallyChallenged} onChange={handleChange} />
                                <label>Physically Challenged / Differently Abled</label>
                            </div>
                            {formData.isPhysicallyChallenged && (
                                <div className="form-group" style={{marginTop: '15px'}}>
                                    <label>Disability Certificate <span className="required-star">*</span></label>
                                    <input 
                                        type="file" 
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => handleDocumentUpload(e, 'disabilityCertificateDoc')}
                                        required={formData.isPhysicallyChallenged}
                                    />
                                    <small style={{color: '#666', fontSize: '0.8rem'}}>Upload disability certificate issued by competent authority (PDF/JPG/PNG)</small>
                                    {documents.disabilityCertificateDoc && <span style={{color: 'green', fontSize: '0.8rem', marginLeft: '10px'}}>✓ Uploaded</span>}
                                </div>
                            )}
                        </div>

                        <div className="photo-upload-container">
                            <h3 className="section-header">Photo (Mandatory)</h3>
                            <div className="photo-box-wrapper">
                                <span className="dim-label dim-width">{t('photo_width_label')}</span>
                                <div className="photo-box">
                                    {photo ? <img src={photo} alt="Preview" /> : <img src="photo-spec.png" alt="No photo" style={{ opacity: 0.2 }} />}
                                </div>
                                <span className="dim-label dim-height">{t('photo_height_label')}</span>
                            </div>
                            <button type="button" className="photo-action-btn" onClick={() => fileInputRef.current.click()}>
                                {t('upload_capture_photo')} <span className="required-star">*</span>
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

                    <div className="college-section">
                        <h3 className="section-header">2. Educational Details (Mandatory)</h3>
                        <div className="form-grid-2x2">
                            <div className="form-group">
                                <label>Institution Type <span className="required-star">*</span></label>
                                <select name="institutionType" value={formData.institutionType} onChange={handleChange} required>
                                    <option value="">Select Institution Type</option>
                                    <option value="School">School</option>
                                    <option value="Junior College">Junior College</option>
                                    <option value="College">College</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{t('institution_name')} <span className="required-star">*</span></label>
                                <input type="text" name="college" value={formData.college} onChange={handleChange} required placeholder={t('college_name')} />
                            </div>
                            <div className="form-group">
                                <label>Education Level / Class / Course <span className="required-star">*</span></label>
                                <input type="text" name="course" value={formData.course} onChange={handleChange} required placeholder={t('course_year_placeholder')} />
                            </div>
                            <div className="form-group">
                                <label>Academic Year <span className="required-star">*</span></label>
                                <input type="text" name="academicYear" value={formData.academicYear} onChange={handleChange} required placeholder="e.g., 2023-24" />
                            </div>
                            <div className="form-group">
                                <label>Registration / Roll / Hall Ticket Number <span className="required-star">*</span></label>
                                <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} required placeholder="Enter Registration Number" />
                            </div>
                        </div>
                    </div>

                    <div className="ssc-section">
                        <h3 className="section-header">{t('ssc_details')} (Optional if above SSC)</h3>
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

                    <div className="address-section">
                        <h3 className="section-header">3. Address Details (Mandatory)</h3>
                        <div className="form-grid-2x2">
                            <div className="form-group">
                                <label>Residential Address / Door No / Street <span className="required-star">*</span></label>
                                <input type="text" name="door" value={formData.door} onChange={handleChange} required placeholder={t('door_no_street')} />
                            </div>
                            <div className="form-group">
                                <label>Village / Town / City <span className="required-star">*</span></label>
                                <input type="text" name="village" value={formData.village} onChange={handleChange} required placeholder={t('village_town')} />
                            </div>
                            <div className="form-group">
                                <label>District <span className="required-star">*</span></label>
                                <input type="text" name="mandal" value={formData.mandal} onChange={handleChange} required placeholder={t('mandal_district')} />
                            </div>
                            <div className={`form-group ${showError('pincode') ? 'has-error' : ''}`}>
                                <label>{t('pincode')} <span className="required-star">*</span></label>
                                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} onBlur={handleBlur} required pattern="\d{6}" title="6 digit pincode" maxLength="6" placeholder={t('pincode')} />
                                {showError('pincode') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Pincode must be 6 digits.</span>}
                            </div>
                        </div>
                    </div>

                    <div className="route-section">
                        <h3 className="section-header">4. Travel Details (Mandatory)</h3>
                        <div className="form-grid-2x2">
                            <div className={`form-group ${showError('from') ? 'has-error' : ''}`}>
                                <label>Boarding Point / Stage <span className="required-star">*</span></label>
                                <input type="text" name="from" value={formData.from} onChange={handleChange} onBlur={handleBlur} required placeholder={t('starting_point')} />
                                {showError('from') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Starting point is required.</span>}
                            </div>
                            <div className="form-group">
                                <label>Destination / Institution Location <span className="required-star">*</span></label>
                                <input type="text" name="to" value={formData.to} onChange={handleChange} onBlur={handleBlur} required placeholder={t('to_place')} />
                                {showError('to') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Destination is required.</span>}
                            </div>
                            <div className="form-group">
                                <label>Nearest Bus Depot <span className="required-star">*</span></label>
                                <input type="text" name="depot" value={formData.depot} onChange={handleChange} required placeholder={t('bus_depot')} />
                            </div>
                            <div className="form-group">
                                <label>Route Selection / Via</label>
                                <input type="text" name="via" value={formData.via} onChange={handleChange} placeholder="e.g. via Main Road" />
                            </div>
                        </div>
                    </div>

                    <div className="details-section">
                        <h3 className="section-header">5. Guardian / Contact Details (Mandatory)</h3>
                        <div className="form-grid-2x2">
                            <div className={`form-group ${showError('fatherName') ? 'has-error' : ''}`}>
                                <label>Guardian Name <span className="required-star">*</span></label>
                                <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} onBlur={handleBlur} required pattern="[A-Za-z\s]+" title="Only letters and spaces allowed" placeholder={t('father_guardian_name')} />
                                {showError('fatherName') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Please enter a valid name (letters only).</span>}
                            </div>
                             <div className={`form-group ${showError('mobile') ? 'has-error' : ''}`} style={{ gridColumn: 'span 2' }}>
                                 <label>Registered Mobile Number <span className="required-star">*</span></label>
                                 <div style={{ display: 'flex', gap: '5px' }}>
                                     <span style={{ padding: '10px', border: '1px solid #ddd', background: '#eee', borderRadius: '4px' }}>+91</span>
                                     <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} onBlur={handleBlur} required pattern="[6-9]\d{9}" title="10 digit mobile number starting with 6-9" maxLength="10" placeholder={t('enter_mobile')} style={{ flex: 1 }} />
                                 </div>
                                 <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>Pre-filled from your login. You can edit if needed.</small>
                             </div>
                             <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                 <label>Email Address (Optional)</label>
                                 <input type="email" name="email" value={formData.email || ''} onChange={handleChange} placeholder="Enter your email address" />
                             </div>
                        </div>
                    </div>

                    <div className="details-section">
                        <h3 className="section-header">6. Pass Details (Mandatory)</h3>
                        <div className="form-grid-2x2">
                            <div className="form-group">
                                <label>Pass Type <span className="required-star">*</span></label>
                                <select name="passType" value={formData.passType} onChange={handleChange} required>
                                    <option value="">Select Pass Type</option>
                                    <option value="Student General">Student General</option>
                                    <option value="Student Greater">Student Greater</option>
                                    <option value="Student District">Student District</option>
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

                    <div className="proofs-section">
                        <h3 className="section-header">7. Document Uploads (Mandatory)</h3>
                        <div className="form-grid-2x2">
                            <div className={`form-group ${showError('aadhaar') ? 'has-error' : ''}`}>
                                <label>{t('aadhar_number')} <span className="required-star">*</span></label>
                                <input type="text" name="aadhaar" value={formData.aadhaar} onChange={handleChange} onBlur={handleBlur} required pattern="\d{12}" title="12 digit Aadhaar number" maxLength="12" placeholder={t('enter_aadhar')} />
                                {showError('aadhaar') && <span className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Aadhaar must be exactly 12 digits.</span>}
                            </div>
                            <div className="form-group">
                                <label>Institution ID Card / Bonafide Certificate <span className="required-star">*</span></label>
                                <input 
                                    type="file" 
                                    accept="image/*,.pdf" 
                                    required
                                    onChange={(e) => handleDocumentUpload(e, 'idCardDoc')}
                                />
                                {documents.idCardDoc && <span style={{color: 'green', fontSize: '0.85rem'}}>✓ File uploaded</span>}
                            </div>
                            <div className="form-group">
                                <label>Address Proof (e.g. Aadhaar/Voter ID) <span className="required-star">*</span></label>
                                <input 
                                    type="file" 
                                    accept="image/*,.pdf" 
                                    required
                                    onChange={(e) => handleDocumentUpload(e, 'addressProofDoc')}
                                />
                                {documents.addressProofDoc && <span style={{color: 'green', fontSize: '0.85rem'}}>✓ File uploaded</span>}
                            </div>
                            <div className="form-group">
                                <label>Study Certificate (if applicable)</label>
                                <input 
                                    type="file" 
                                    accept=".pdf,.jpg,.jpeg,.png" 
                                    onChange={(e) => handleDocumentUpload(e, 'studyCertificateDoc')}
                                />
                                {documents.studyCertificateDoc && <span style={{color: 'green', fontSize: '0.85rem'}}>✓ File uploaded</span>}
                            </div>
                        </div>
                    </div>

                    <div className="details-section">
                        <h3 className="section-header">8. Declaration (Mandatory)</h3>
                        <div className="checkbox-group">
                            <input 
                                type="checkbox" 
                                name="declaration" 
                                checked={formData.declaration} 
                                onChange={handleChange} 
                                required
                            />
                            <label><strong>I hereby declare that all the information provided above is true and correct to the best of my knowledge.</strong> <span className="required-star">*</span></label>
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
