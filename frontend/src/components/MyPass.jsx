import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LogoBackButton from './LogoBackButton';
import Header from "./header";
import BusPassCard from "./BusPassCard";
import "./MyPass.css";
import { useLanguage } from "../context/LanguageContext";

const MyPass = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [passes, setPasses] = useState([]);

    // Load passes from localStorage on mount
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("myPasses") || "[]");
        setPasses(stored);
    }, []);

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
                                        {" "}{t('generated_on')}: {new Date(pass.issueDate).toLocaleString("en-IN")}
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
