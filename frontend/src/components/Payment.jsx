import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoBackButton from './LogoBackButton';
import BusPassCard from "./BusPassCard";
import "./Payment.css";
import Header from "./header";
import { useLanguage } from "../context/LanguageContext";

/* ── Plans ─────────────────────────────────── */
const PLANS = [
    { months: 1, label: "Month", labelKey: "month", amount: 1050, save: null },
    { months: 2, label: "Months", labelKey: "months", amount: 1900, save: "Save ₹200", saveKey: "save_200" },
    { months: 6, label: "Months", labelKey: "months", amount: 5200, save: "Save ₹1100", saveKey: "save_1100" },
];

/* ── Mock DB for new passes ─────────────────── */
const MOCK_DB = {
    APP123: {
        studentName: "Kumar",
        schoolCollegeName: "VNR VJIET",
        from: "Kukatpally",
        to: "Bachupally",
        photo: null,
    },
    APP456: {
        studentName: "Rahul Sharma",
        schoolCollegeName: "GVPCE",
        from: "Madhurawada",
        to: "RTC Complex",
        photo: null,
    },
};

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

    /* ── Step 0: Fetch Details ── */
    const handleFetch = () => {
        if (!inputId.trim()) {
            alert(t('enter_id_pass_alert') + (isRenewal ? t('pass_number') : t('application_id')));
            return;
        }
        setLoading(true);
        setTimeout(() => {
            let found = null;

            if (isRenewal) {
                // Look up existing passes in localStorage by pass number
                const saved = JSON.parse(localStorage.getItem("myPasses") || "[]");
                found = saved.find(
                    (p) => p.passNumber?.toUpperCase() === inputId.trim().toUpperCase()
                );
                if (!found) {
                    alert(t('pass_not_found_alert'));
                    setLoading(false);
                    return;
                }
            } else {
                // New pass — look up mock DB
                found = MOCK_DB[inputId.trim().toUpperCase()];
                if (!found) {
                    alert(t('app_id_not_found_alert'));
                    setLoading(false);
                    return;
                }
            }

            setStudentData(found);
            setStep(1);
            setLoading(false);
        }, 900);
    };

    /* ── Step 1 → 2: Select plan ── */
    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        setStep(2);
    };

    /* ── Step 2 → 3: Process payment ── */
    const handlePayment = () => {
        setLoading(true);
        setTimeout(() => {
            const passNumber = "APPTD-" + Math.floor(100000 + Math.random() * 900000);
            const ticketNumber = "TK" + Math.floor(10000000 + Math.random() * 90000000);
            const issueDate = new Date().toISOString();

            const newPass = {
                ...studentData,
                amount: selectedPlan.amount,
                planMonths: selectedPlan.months,
                passNumber,
                ticketNumber,
                issueDate,
                isRenewal,
            };

            // Persist to localStorage
            const existing = JSON.parse(localStorage.getItem("myPasses") || "[]");
            localStorage.setItem("myPasses", JSON.stringify([...existing, newPass]));

            setGeneratedPass(newPass);
            setStep(3);
            setLoading(false);
        }, 1500);
    };

    /* ── Reset ── */
    const handleReset = () => {
        setStep(0);
        setInputId("");
        setStudentData(null);
        setSelectedPlan(null);
        setGeneratedPass(null);
    };

    /* ── Titles ── */
    const pageTitle = isRenewal ? t('renew_your_pass') : t('pass_payment');
    const pageSubtitle = isRenewal
        ? t('enter_pass_to_renew')
        : t('enter_app_id_to_get_pass');
    const inputLabel = isRenewal ? t('existing_pass_number') : t('application_id_label');
    const inputPlaceholder = isRenewal ? "e.g. APPTD-123456" : "e.g. APP123";
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
                                💡 Go to <strong>My Pass</strong> to find your Pass Number (starts with APPTD-)
                            </div>
                        ) : (
                            <div className="renewal-hint">
                                💡 మీ పాస్ నంబర్ కోసం <strong>నా పాస్</strong>కి వెళ్ళండి (ఇది APPTD- తో మొదలవుతుంది)
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
                            <div className="info-row"><strong>{t('name')}</strong><span>{studentData.studentName}</span></div>
                            <div className="info-row"><strong>{t('college')}</strong><span>{studentData.schoolCollegeName}</span></div>
                            <div className="info-row"><strong>{t('route')}</strong><span>{studentData.from} → {studentData.to}</span></div>
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

                {/* ── STEP 2: Payment Confirmation ── */}
                {step === 2 && selectedPlan && (
                    <div className="payment-card">
                        <h2 className="payment-title">{t('complete_payment')}</h2>
                        <p className="payment-subtitle">{t('review_confirm_description')}</p>

                        <div className="student-preview-box">
                            <h4>{t('order_summary')}</h4>
                            <div className="info-row"><strong>{t('name')}</strong><span>{studentData.studentName}</span></div>
                            <div className="info-row"><strong>{t('route')}</strong><span>{studentData.from} → {studentData.to}</span></div>
                            <div className="info-row"><strong>{t('college')}</strong><span>{studentData.schoolCollegeName}</span></div>
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

                        {loading
                            ? <div className="loading-spinner" />
                            : <>
                                <button className="payment-btn" onClick={handlePayment}>
                                    💳 {t('pay')} ₹{selectedPlan.amount} {t('now')}
                                </button>
                                <button className="payment-btn secondary" onClick={() => setStep(1)}>← {t('change_plan')}</button>
                            </>
                        }
                    </div>
                )}

                {/* ── STEP 3: Generated Pass ── */}
                {step === 3 && generatedPass && (
                    <div className="pass-preview-container">
                        <div className="success-banner">
                            <h3>{isRenewal ? "🔄 " + t('pass_renewed_title') : "🎉 " + t('payment_successful')}</h3>
                            <p>
                                {t('pass_generated_desc')} <strong>{t('my_pass_link')}</strong>.
                            </p>
                        </div>

                        <BusPassCard data={generatedPass} />

                        <button
                            className="payment-btn"
                            style={{ marginTop: "16px" }}
                            onClick={() => navigate("/my-pass")}
                        >
                            🎫 {t('view_my_passes')}
                        </button>
                        <button
                            className="payment-btn secondary"
                            style={{ marginTop: "10px" }}
                            onClick={handleReset}
                        >
                            {isRenewal ? t('renew_another_pass') : t('pay_for_another_pass')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Payment;
