import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoBackButton from './LogoBackButton';
import BusPassCard from "./BusPassCard";
import "./Payment.css";
import Header from "./header";
import { useLanguage } from "../context/LanguageContext";
import { API_ENDPOINTS } from "../api/config";

const PAYMENT_FLOW = {
    PENDING: "PAYMENT_PENDING",
    PROCESSING: "PROCESSING",
    SUCCESS: "SUCCESS"
};

const SIMULATED_VERIFY_DELAY_MS = 700;
const MAX_PROCESSING_MS = 3000;
const MAX_STORED_PASSES = 20;

/* ── Plans ─────────────────────────────────── */
const PLANS = [
    { months: 1, label: "Month", labelKey: "month", amount: 20, save: null },
    { months: 2, label: "Months", labelKey: "months", amount: 30, save: null },
    { months: 3, label: "Months", labelKey: "months", amount: 40, save: null },
];

/* ── Step Indicator ─────────────────────────── */
const StepIndicator = ({ current, t }) => {
    const steps = [t('id_step'), t('plan_step'), t('pay_step'), t('pass_step')];
    return (
        <div className="step-indicator">
            {steps.map((label, i) => (
                <React.Fragment key={i}>
                    <div className={`step-dot ${i < current ? "done" : i === current ? "active" : ""}`}>
                        {i < current ? "✓" : i + 1}
                    </div>
                    <div className={`step-label-text ${i === current ? "active" : ""}`}>{label}</div>
                    {i < steps.length - 1 && (
                        <div className={`step-line ${i < current ? "done" : ""}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

/* ── Main Component ─────────────────────────── */
/* mode: "new" | "renewal"                       */
const Payment = ({ mode = "new" }) => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const isRenewal = mode === "renewal";

    const [step, setStep] = useState(0);
    const [inputId, setInputId] = useState("");     // App ID or Pass No
    const [loading, setLoading] = useState(false);
    const [studentData, setStudentData] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [generatedPass, setGeneratedPass] = useState(null);
    const [paymentFlowState, setPaymentFlowState] = useState(PAYMENT_FLOW.PENDING);
    const [paymentMeta, setPaymentMeta] = useState(null);

    // PhonePe QR payment state
    const [paymentId, setPaymentId] = useState(null);
    const [showQR, setShowQR] = useState(false);
    const [paymentFailed, setPaymentFailed] = useState(false);
    const [failMessage, setFailMessage] = useState("");

    const normalizePassFromBackend = (pass, fallbackData) => ({
        applicationId: pass?.applicationId || fallbackData?.applicationId || "SIMULATED_APP",
        renewalId: pass?.renewalId || fallbackData?.renewalId || null,
        passNumber: pass?.passNumber || null,
        studentName: pass?.holderName || fallbackData?.studentName || fallbackData?.fullName || "N/A",
        full_name: pass?.holderName || fallbackData?.fullName || fallbackData?.studentName || "N/A",
        name: pass?.holderName || fallbackData?.studentName || fallbackData?.fullName || "N/A",
        fatherName: pass?.fatherName || fallbackData?.fatherName || "N/A",
        father_name: pass?.fatherName || fallbackData?.fatherName || "N/A",
        from_place: pass?.from || fallbackData?.from || "N/A",
        from: pass?.from || fallbackData?.from || "N/A",
        to_place: pass?.to || fallbackData?.to || "N/A",
        to: pass?.to || fallbackData?.to || "N/A",
        mobile: pass?.mobile || fallbackData?.mobile || "",
        email: pass?.email || fallbackData?.email || "",
        photo: pass?.photo || fallbackData?.photo || null,
        applicationType: pass?.applicationType || fallbackData?.applicationType || "student_above_ssc",
        schoolCollegeName: pass?.institutionName || fallbackData?.schoolCollegeName || fallbackData?.institutionName || "N/A",
        institutionName: pass?.institutionName || fallbackData?.institutionName || fallbackData?.schoolCollegeName || "N/A",
        date_of_birth: pass?.date_of_birth || fallbackData?.date_of_birth || null,
        gender: pass?.gender || fallbackData?.gender || "N/A",
        amount: pass?.amount || selectedPlan?.amount || 20,
        amountPaid: pass?.amount || selectedPlan?.amount || 20,
        planMonths: pass?.planMonths || selectedPlan?.months || 1,
        issueDate: pass?.issueDate || new Date().toISOString(),
        expiryDate: pass?.expiryDate || new Date().toISOString(),
        isRenewal: Boolean(pass?.isRenewal ?? isRenewal),
        paymentId: paymentMeta?.paymentId || null,
        ticketNumber: pass?.ticketNumber || null
    });

    const getRandom6Digits = () => Math.floor(100000 + Math.random() * 900000).toString();

    const toLightweightPass = (pass) => {
        const safePhoto = typeof pass.photo === "string" && pass.photo.startsWith("data:")
            ? null
            : (pass.photo || null);

        return {
            ...pass,
            // Base64 images are large and quickly exhaust localStorage quota.
            photo: safePhoto
        };
    };

    const persistPassSafely = (pass) => {
        const existing = JSON.parse(localStorage.getItem("myPasses") || "[]");
        const compactNewPass = toLightweightPass(pass);
        const compactExisting = existing.map((p) => toLightweightPass(p));
        // Keep the new pass with photo intact, but sanitize old ones if needed
        const next = [compactNewPass, ...compactExisting].slice(0, MAX_STORED_PASSES);

        try {
            localStorage.setItem("myPasses", JSON.stringify(next));
            return;
        } catch {
            // Fallback: only when quota exceeded, strip photos from existing passes
            // but try to keep the new pass photo if possible
            const sanitized = next.map((p, idx) => {
                // Keep photo for the newest pass (index 0) to show user their just-generated pass
                if (idx === 0) return p;
                // For older passes, strip photo to recover space
                return { ...p, photo: null };
            });
            
            try {
                localStorage.setItem("myPasses", JSON.stringify(sanitized));
            } catch {
                // If still over quota, strip all photos
                const forceReduced = sanitized.map((p) => ({
                    ...p,
                    photo: null
                }));
                localStorage.setItem("myPasses", JSON.stringify(forceReduced));
            }
        }
    };

    /* ── Step 0: Fetch Details ── */
    const handleFetch = async () => {
        if (!inputId.trim()) {
            alert(t('enter_id_pass_alert') + (isRenewal ? t('pass_number') : t('renewal_id_label')));
            return;
        }
        setLoading(true);

        try {
            if (isRenewal) {
                // 1) First, fetch from backend by renewal_id (source of truth)
                const renewalRes = await fetch(API_ENDPOINTS.getByRenewalId(inputId.trim()));
                const renewalData = await renewalRes.json();

                if (renewalRes.ok && renewalData.success && renewalData.application) {
                    const app = renewalData.application;
                    setStudentData({
                        applicationId: app.application_id,
                        renewalId: app.renewal_id,
                        studentName: app.full_name,
                        fullName: app.full_name,
                        fatherName: app.father_name,
                        from: app.from_place,
                        to: app.to_place,
                        mobile: app.mobile,
                        email: app.email,
                        photo: app.photo,
                        applicationType: app.application_type,
                        status: app.status,
                        institutionName: app.institution_name,
                        schoolCollegeName: app.institution_name,
                        date_of_birth: app.date_of_birth,
                        gender: app.gender,
                    });
                    setStep(1);
                } else {
                    // 2) Fallback: localStorage pass lookup for older locally saved passes
                    const saved = JSON.parse(localStorage.getItem("myPasses") || "[]");
                    const found = saved.find(
                        (p) => (p.renewal_id || p.renewalId)?.toUpperCase() === inputId.trim().toUpperCase()
                    );

                    if (!found) {
                        alert("Renewal ID not found. Please check and try again.");
                        setLoading(false);
                        return;
                    }

                    setStudentData(found);
                    setStep(1);
                }
            } else {
                // Fetch from backend using renewal_id
                const res = await fetch(API_ENDPOINTS.getByRenewalId(inputId.trim()));
                const data = await res.json();

                if (!res.ok || !data.success) {
                    alert(data.message || t('app_id_not_found_alert'));
                    setLoading(false);
                    return;
                }

                // Map DB fields for display
                const app = data.application;
                setStudentData({
                    applicationId: app.application_id,
                    renewalId: app.renewal_id,
                    studentName: app.full_name,
                    fullName: app.full_name,
                    fatherName: app.father_name,
                    from: app.from_place,
                    to: app.to_place,
                    mobile: app.mobile,
                    email: app.email,
                    photo: app.photo,
                    applicationType: app.application_type,
                    status: app.status,
                    institutionName: app.institution_name,
                    schoolCollegeName: app.institution_name,
                    date_of_birth: app.date_of_birth,
                    gender: app.gender,
                });
                setStep(1);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            alert('Failed to fetch details. Please check your Renewal ID and try again.');
        } finally {
            setLoading(false);
        }
    };

    /* ── Step 1 → 2: Select plan ── */
    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        setPaymentFlowState(PAYMENT_FLOW.PENDING);
        setStep(2);
    };

    /* ── Step 2: Simulated Payment (No real verification) ───────── */
    const handlePayNow = async () => {
        if (paymentFlowState !== PAYMENT_FLOW.PENDING) return;

        try {
            if (!selectedPlan) {
                throw new Error("Please select a plan before payment.");
            }

            setPaymentFlowState(PAYMENT_FLOW.PROCESSING);

            await Promise.race([
                new Promise((resolve) => setTimeout(resolve, SIMULATED_VERIFY_DELAY_MS)),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Payment verification timeout. Please retry.")), MAX_PROCESSING_MS)
                )
            ]);

            const createPaymentRes = await fetch(API_ENDPOINTS.createPayment, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicationId: studentData?.applicationId,
                    amount: selectedPlan?.amount,
                    paymentMethod: "phonepay_qr",
                    planMonths: selectedPlan?.months,
                    isRenewal
                })
            });

            const createPaymentData = await createPaymentRes.json();
            if (!createPaymentRes.ok || !createPaymentData?.success || !createPaymentData?.paymentId) {
                throw new Error(createPaymentData?.message || "Failed to initiate payment.");
            }

            const completedRes = await fetch(API_ENDPOINTS.completePayment(createPaymentData.paymentId), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paymentStatus: "SUCCESS",
                    transactionId: "DEMO_TXN_" + getRandom6Digits()
                })
            });

            const completedData = await completedRes.json();
            if (!completedRes.ok || !completedData?.success || !completedData?.pass) {
                throw new Error(completedData?.message || "Payment completed but pass generation failed.");
            }

            const now = new Date();
            const newPass = normalizePassFromBackend(completedData.pass, studentData);

            persistPassSafely(newPass);

            setPaymentId(createPaymentData.paymentId);
            setPaymentMeta({
                paymentId: createPaymentData.paymentId,
                passId: completedData.pass.passNumber,
                timestamp: now.toLocaleString(),
                amount: completedData.pass.amount || selectedPlan?.amount || 20
            });
            setGeneratedPass(newPass);
            setShowQR(false);
            setPaymentFlowState(PAYMENT_FLOW.SUCCESS);
            setStep(3);
        } catch (error) {
            console.error("Payment simulation error:", error);
            setPaymentFlowState(PAYMENT_FLOW.PENDING);
            setPaymentFailed(true);
            setFailMessage(error.message || "Payment verification failed. Please try again.");
        }
    };

    /* ── Close failure popup & retry ── */
    const handleRetryPayment = () => {
        setPaymentFailed(false);
        setFailMessage("");
        setPaymentId(null);
        setShowQR(false);
    };

    /* ── Reset ── */
    const handleReset = () => {
        setStep(0);
        setInputId("");
        setStudentData(null);
        setSelectedPlan(null);
        setGeneratedPass(null);
        setPaymentFlowState(PAYMENT_FLOW.PENDING);
        setPaymentMeta(null);
        setPaymentId(null);
        setShowQR(false);
        setPaymentFailed(false);
        setFailMessage("");
    };

    const handleDownloadPass = () => {
        alert("Downloading...");
    };

    /* ── Titles ── */
    const pageTitle = isRenewal ? t('renew_your_pass') : t('pass_payment');
    const pageSubtitle = isRenewal
        ? t('enter_pass_to_renew')
        : t('enter_app_id_to_get_pass');
    const inputLabel = isRenewal ? t('existing_pass_number') : t('renewal_id_label');
    const inputPlaceholder = "e.g. A1B2C3D4E5F6";
    const renewalNote = isRenewal
        ? t('renewal_note')
        : null;

    return (
        <div className="payment-page">
            <LogoBackButton top="120px" />
            <Header />
            <div className="payment-wrapper">

                {/* Mode Badge */}
                <div style={{ textAlign: "center", marginBottom: "10px" }}>
                    <span className={`mode-badge ${isRenewal ? "renewal" : "new"}`}>
                        {isRenewal ? "🔄 " + t('renewal_pass_badge') : "🆕 " + t('new_pass_badge')}
                    </span>
                </div>

                <StepIndicator current={step} t={t} />

                {/* ── STEP 0: Enter ID / Pass Number ── */}
                {step === 0 && (
                    <div className="payment-card">
                        <h2 className="payment-title">{pageTitle}</h2>
                        <p className="payment-subtitle">{pageSubtitle}</p>

                        {isRenewal && (language === 'en' ? (
                            <div className="renewal-hint">
                                💡 Go to <strong>My Pass</strong> to find your Renewal ID (starts with BP)
                            </div>
                        ) : (
                            <div className="renewal-hint">
                                💡 మీ రినూవల్ ఐడీ కోసం <strong>నా పాస్</strong>కి వెళ్ళండి (ఇది BP తో మొదలవుతుంది)
                            </div>
                        ))}

                        <div className="payment-input-group">
                            <label>{inputLabel}</label>
                            <input
                                type="text"
                                placeholder={inputPlaceholder}
                                value={inputId}
                                onChange={(e) => setInputId(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                            />
                        </div>

                        {loading
                            ? <div className="loading-spinner" />
                            : <button className="payment-btn" onClick={handleFetch}>
                                {t('fetch_details')} →
                            </button>
                        }
                    </div>
                )}

                {/* ── STEP 1: Choose Plan ── */}
                {step === 1 && studentData && (
                    <div className="payment-card">
                        <h2 className="payment-title">{t('choose_your_plan')}</h2>
                        <p className="payment-subtitle">{t('select_validity_description') + (isRenewal ? t('renewed') : "")}</p>

                        <div className="student-preview-box">
                            <h4>{isRenewal ? t('renewing_pass_for') : t('application_details')}</h4>
                            <div className="info-row"><strong>{t('name')}</strong><span>{studentData.studentName || studentData.fullName || studentData.full_name}</span></div>
                            <div className="info-row"><strong>{t('route')}</strong><span>{studentData.from || studentData.from_place} → {studentData.to || studentData.to_place}</span></div>
                            {studentData.renewalId && (
                                <div className="info-row"><strong>Renewal ID</strong><span style={{color:'#28a745', fontWeight:700}}>{studentData.renewalId}</span></div>
                            )}
                            {isRenewal && studentData.passNumber && (
                                <div className="info-row"><strong>{t('old_pass')}</strong><span>{studentData.passNumber}</span></div>
                            )}
                        </div>

                        <div className="plan-cards">
                            {PLANS.map((plan) => (
                                <div
                                    key={plan.months}
                                    className={`plan-card ${selectedPlan?.months === plan.months ? "selected" : ""}`}
                                    onClick={() => setSelectedPlan(plan)}
                                >
                                    {selectedPlan?.months === plan.months && <div className="selected-badge">✓</div>}
                                    <div className="plan-months">{plan.months}</div>
                                    <div className="plan-label">{t(plan.labelKey)}</div>
                                    <div className="plan-amount">₹{plan.amount}</div>
                                    {plan.saveKey && <div className="plan-save">{t(plan.saveKey)}</div>}
                                </div>
                            ))}
                        </div>

                        <button
                            className="payment-btn"
                            disabled={!selectedPlan}
                            style={{ opacity: selectedPlan ? 1 : 0.5 }}
                            onClick={() => selectedPlan && handlePlanSelect(selectedPlan)}
                        >
                            {t('continue_to_payment')} →
                        </button>
                        <button className="payment-btn secondary" onClick={() => setStep(0)}>← {t('back')}</button>
                    </div>
                )}

                {/* ── STEP 2: PhonePe Payment (Demo) ── */}
                {step === 2 && selectedPlan && (
                    <div className="payment-card">
                        <h2 className="payment-title">{t('complete_payment')}</h2>
                        <p className="payment-subtitle">{t('review_confirm_description')}</p>

                        <div className="student-preview-box">
                            <h4>{t('order_summary')}</h4>
                            <div className="info-row"><strong>{t('name')}</strong><span>{studentData.studentName || studentData.fullName || studentData.full_name}</span></div>
                            <div className="info-row"><strong>{t('route')}</strong><span>{studentData.from || studentData.from_place} → {studentData.to || studentData.to_place}</span></div>
                            <div className="info-row"><strong>{t('plan')}</strong><span>{selectedPlan.months} {t(selectedPlan.labelKey)}</span></div>
                            {isRenewal && (
                                <div className="info-row"><strong>{t('type')}</strong><span style={{ color: "#c46b00", fontWeight: 700 }}>🔄 {t('renewal_pass_badge')}</span></div>
                            )}
                        </div>

                        <div className="payment-summary">
                            <div className="summary-label">{isRenewal ? t('renewal_amount') : t('total_amount')}</div>
                            <div className="summary-amount">₹{selectedPlan.amount}</div>
                            <div className="summary-plan">
                                {t('valid_for')} {selectedPlan.months} {t(selectedPlan.labelKey)} {t('from_today')}
                            </div>
                            {renewalNote && <div className="summary-note">{renewalNote}</div>}
                        </div>

                        {/* PhonePe QR Code Display */}
                        <div className="qr-payment-section">
                            <div className="qr-header">
                                <img src="/phonepay%20QR.jpeg" alt="PhonePe QR" className="phonepe-logo-small" style={{width: '36px', height: '36px', borderRadius: '8px'}} />
                                <h3 className="qr-title">
                                    {language === 'te' ? 'PhonePe తో చెల్లించండి' : 'Pay with PhonePe'}
                                </h3>
                            </div>

                            <div className="qr-amount-badge">₹{selectedPlan.amount}</div>

                            <div className="qr-image-container">
                                <img
                                    src="/phonepay%20QR.jpeg"
                                    alt="PhonePe QR Code"
                                    className="qr-code-image"
                                />
                            </div>

                            <p className="qr-instructions">
                                {language === 'te'
                                    ? '📱 ఈ QR కోడ్‌ను PhonePe/GPay/Paytm తో స్కాన్ చేయండి మరియు ₹' + selectedPlan.amount + ' చెల్లించండి'
                                    : '📱 Scan this QR code using PhonePe / GPay / Paytm and pay ₹' + selectedPlan.amount
                                }
                            </p>

                            <div className="demo-notice" style={{
                                background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px',
                                padding: '10px 14px', margin: '10px 0', fontSize: '13px', color: '#856404', textAlign: 'center'
                            }}>
                                ⚠️ {language === 'te'
                                    ? 'డెమో మోడ్: విజయవంతమైన చెల్లింపు నిర్ధారణ తర్వాత మాత్రమే పాస్ రూపొందించబడుతుంది.'
                                    : 'Demo Mode: Pass is generated only after successful payment confirmation.'}
                            </div>
                        </div>

                        <button
                            className="payment-btn qr-confirm-btn"
                            onClick={handlePayNow}
                            disabled={paymentFlowState === PAYMENT_FLOW.PROCESSING || paymentFlowState === PAYMENT_FLOW.SUCCESS}
                            style={{
                                opacity: paymentFlowState === PAYMENT_FLOW.PROCESSING ? 0.8 : 1,
                                cursor: paymentFlowState === PAYMENT_FLOW.PROCESSING ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {paymentFlowState === PAYMENT_FLOW.PROCESSING ? (
                                <span className="btn-inline-loading">
                                    <span className="btn-spinner" />
                                    Verifying Payment...
                                </span>
                            ) : (
                                <>✅ {language === 'te' ? 'చెల్లింపు పూర్తయింది — పాస్ రూపొందించండి' : "I've Paid — Generate My Pass"}</>
                            )}
                        </button>
                        <button
                            className="payment-btn secondary"
                            onClick={() => setStep(1)}
                            disabled={paymentFlowState === PAYMENT_FLOW.PROCESSING}
                        >
                            ← {t('change_plan')}
                        </button>
                    </div>
                )}

                {/* ── Payment Failed Popup ── */}
                {paymentFailed && (
                    <div className="payment-fail-overlay">
                        <div className="payment-fail-popup">
                            <div className="fail-icon">❌</div>
                            <h3 className="fail-title">
                                {language === 'te' ? 'చెల్లింపు విఫలమైంది' : 'Payment Failed'}
                            </h3>
                            <p className="fail-message">{failMessage}</p>
                            <div className="fail-actions">
                                <button className="payment-btn" onClick={handleRetryPayment}>
                                    🔄 {language === 'te' ? 'మళ్ళీ ప్రయత్నించు' : 'Try Again'}
                                </button>
                                <button className="payment-btn secondary" onClick={() => { handleRetryPayment(); setStep(1); }}>
                                    ← {language === 'te' ? 'ప్లాన్ మార్చు' : 'Change Plan'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: Generated Pass ── */}
                {step === 3 && generatedPass && (
                    <div className="pass-preview-container transition-success">
                        <div className="success-banner">
                            <h3>Payment Successful ✅</h3>
                            <p>Your bus pass has been generated</p>
                            <p style={{ marginTop: "8px", fontWeight: 600 }}>Your pass is ready. You can stay here or open My Pass manually.</p>
                        </div>

                        {paymentMeta && (
                            <div className="payment-meta-box">
                                <div className="info-row"><strong>Payment ID</strong><span>{paymentMeta.paymentId}</span></div>
                                <div className="info-row"><strong>Pass ID</strong><span>{paymentMeta.passId}</span></div>
                                <div className="info-row"><strong>Date & Time</strong><span>{paymentMeta.timestamp}</span></div>
                                <div className="info-row"><strong>Amount</strong><span>₹{paymentMeta.amount}</span></div>
                            </div>
                        )}

                        <div className="sim-pass-meta">
                            <h4>Bus Pass Details</h4>
                            <p>
                                Name: <strong>{generatedPass.studentName || generatedPass.full_name || "N/A"}</strong> | Route: <strong>{generatedPass.from || generatedPass.from_place || "N/A"} → {generatedPass.to || generatedPass.to_place || "N/A"}</strong> | Plan: <strong>{generatedPass.planMonths || 1} Month</strong> | Validity: <strong>{new Date(generatedPass.issueDate).toLocaleDateString("en-IN")} - {new Date(generatedPass.expiryDate).toLocaleDateString("en-IN")}</strong>
                            </p>
                        </div>

                        <BusPassCard data={generatedPass} />

                        <button className="payment-btn" style={{ marginTop: "16px" }} onClick={handleDownloadPass}>
                            Download Pass
                        </button>
                        <button className="payment-btn" style={{ marginTop: "10px" }} onClick={() => navigate("/my-pass")}> 
                            Open My Pass
                        </button>
                        <button className="payment-btn secondary" style={{ marginTop: "10px" }} onClick={() => navigate("/home")}>
                            Go to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Payment;
