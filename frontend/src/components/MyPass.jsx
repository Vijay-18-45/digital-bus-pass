import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LogoBackButton from './LogoBackButton';
import Header from "./header";
import BusPassCard from "./BusPassCard";
import "./MyPass.css";
import { useLanguage } from "../context/LanguageContext";
import { API_ENDPOINTS } from "../api/config";

const MyPass = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();
    const [passes, setPasses] = useState([]);
    const recentPassNumber = location.state?.recentPassNumber || null;

    // Load passes from localStorage on mount
    useEffect(() => {
        const loadPasses = async () => {
            const stored = JSON.parse(localStorage.getItem("myPasses") || "[]");
            const userIdentifier = (localStorage.getItem("userIdentifier") || "").trim();
            const userEmail = (localStorage.getItem("userEmail") || "").trim().toLowerCase();
            const userPhone = (localStorage.getItem("userPhone") || "").trim();
            const phoneDigits = userPhone.replace(/\D/g, "").slice(-10);

            const scopedStored = stored.filter((p) => {
                const passEmail = (p.email || "").trim().toLowerCase();
                const passMobileDigits = (String(p.mobile || "").replace(/\D/g, "").slice(-10));

                if (userEmail && passEmail && passEmail === userEmail) return true;
                if (phoneDigits && passMobileDigits && passMobileDigits === phoneDigits) return true;
                return false;
            });

            if (!userIdentifier && !userEmail && !userPhone) {
                setPasses([]);
                return;
            }

            try {
                const identifierForApi = userIdentifier || userEmail || userPhone;
                const response = await fetch(API_ENDPOINTS.getUserPasses(encodeURIComponent(identifierForApi)));
                if (!response.ok) {
                    setPasses(scopedStored);
                    return;
                }

                const dbPasses = await response.json();

                const mappedDb = (dbPasses || []).map((p) => ({
                    pass_number: p.pass_number,
                    passNumber: p.pass_number,
                    ticket_number: p.ticket_number,
                    ticketNumber: p.ticket_number,
                    applicationId: p.application_id,
                    renewalId: p.renewal_id,
                    studentName: p.holder_name || p.full_name,
                    full_name: p.full_name || p.holder_name,
                    father_name: p.father_name,
                    from_place: p.from_place,
                    to_place: p.to_place,
                    mobile: p.mobile,
                    email: p.email,
                    photo: p.photo,
                    applicationType: p.application_type,
                    institution_name: p.institution_name,
                    institutionName: p.institution_name,
                    date_of_birth: p.date_of_birth,
                    gender: p.gender,
                    amount: p.amount,
                    plan_months: p.plan_months,
                    planMonths: p.plan_months,
                    issue_date: p.issue_date,
                    issueDate: p.issue_date,
                    expiry_date: p.expiry_date,
                    expiryDate: p.expiry_date,
                    isRenewal: Boolean(p.is_renewal),
                    paymentId: p.payment_id || null,
                    created_at: p.created_at
                }));

                const byPassNumber = new Map();
                [...mappedDb, ...scopedStored].forEach((pass) => {
                    const key = pass.pass_number || pass.passNumber || pass.renewalId || pass.renewal_id || `${pass.applicationId || "APP"}-${pass.issueDate || pass.issue_date || Date.now()}`;
                    if (!byPassNumber.has(key)) {
                        byPassNumber.set(key, pass);
                    }
                });

                const mergedPasses = Array.from(byPassNumber.values());

                mergedPasses.sort((a, b) => {
                    const getTime = (item) => {
                        const source = item.issueDate || item.issue_date || item.created_at || null;
                        const parsed = source ? new Date(source).getTime() : 0;
                        return Number.isNaN(parsed) ? 0 : parsed;
                    };

                    if (recentPassNumber) {
                        const aKey = a.pass_number || a.passNumber;
                        const bKey = b.pass_number || b.passNumber;
                        if (aKey === recentPassNumber) return -1;
                        if (bKey === recentPassNumber) return 1;
                    }

                    return getTime(b) - getTime(a);
                });

                setPasses(mergedPasses);
            } catch {
                setPasses(scopedStored);
            }
        };

        loadPasses();
    }, [recentPassNumber]);

    const handleDelete = (index) => {
        const updated = passes.filter((_, i) => i !== index);
        setPasses(updated);
        localStorage.setItem("myPasses", JSON.stringify(updated));
    };

    const handleClearAll = () => {
        if (window.confirm(t('confirm_delete_all_passes'))) {
            localStorage.removeItem("myPasses");
            setPasses([]);
        }
    };

    return (
        <div className="mypass-page">
            <LogoBackButton top="120px" />
            <Header />
            <div className="mypass-container">
                <div className="mypass-header">
                    <h2>🎫 {t('my_bus_passes')}</h2>
                    <p>{t('my_passes_description')}</p>
                </div>

                {passes.length === 0 ? (
                    <div className="mypass-empty">
                        <div className="empty-icon">🚌</div>
                        <h3>{t('no_passes_found')}</h3>
                        <p>{t('no_passes_description')}</p>
                        <button className="go-payment-btn" onClick={() => navigate("/payment")}>
                            {t('get_your_bus_pass')}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mypass-grid">
                            {passes.map((pass, index) => (
                                <div className="mypass-card-wrapper" key={index}>
                                    <p className="pass-meta">
                                        {pass.isRenewal && <span className="renewal-badge">🔄 {t('renewed')}</span>}
                                        {" "}{t('generated_on')}: {new Date(pass.issueDate || pass.issue_date || pass.created_at || Date.now()).toLocaleString("en-IN")}
                                    </p>
                                    <BusPassCard data={pass} />
                                    <div className="pass-action-btns">
                                        <button
                                            className="renew-btn"
                                            onClick={() => navigate("/renewal")}
                                        >
                                            🔄 {t('renew_this_pass')}
                                        </button>
                                        <button className="delete-btn" onClick={() => handleDelete(index)}>
                                            🗑 {t('remove')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="mypass-clear-btn" onClick={handleClearAll}>
                            {t('clear_all_passes')}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default MyPass;
