import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EmailOtp.css";
import { useLanguage } from "../context/LanguageContext";
import Header from "./header";

function EmailOtp() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [role, setRole] = useState("student");
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSendOtp = async () => {
    if (!email) {
      alert(t('please_enter_email_alert') || "Please enter valid email address");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        alert(t('otp_sent_alert') || "OTP sent successfully to your email");
      } else {
        alert(data.message || t('otp_send_failed_alert'));
      }

    } catch (error) {
      console.error("Error:", error);
      alert(t('server_error_alert') || "Server error. Please try again later.");
    }
  };

  const handleVerify = async () => {
    if (!otp) {
      alert(t('enter_otp_alert') || "Please enter OTP");
      return;
    }

    const res = await fetch("http://localhost:5000/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });

    const data = await res.json();
    if (res.ok) {
      navigate("/home");
    } else {
      alert(data.message || t('otp_verify_failed_alert'));
    }
  };

  return (
    <>
      <Header />
      <div className="login-page-wrapper">
        <div className="login-main-container">
          <div className="login-split-card">

            {/* Left Side (Red Branding) */}
            <div className="login-left-pane">
              <div className="left-branding">
                <img src="/logo.png" alt="APSRTC Logo" className="branding-logo" />
                <div className="branding-text">
                  <h2>Andhra Pradesh Digital Bus</h2>
                  <h2>Pass Portal</h2>
                  <p>State Transport Services</p>
                </div>
              </div>

              <div className="left-illustration-card">
                <div className="illustration-image-placeholder">
                  <img src="/login-illustration.png" alt="Bus Pass Illustration" className="illustration-img" onError={(e) => e.target.style.display = 'none'} />
                </div>
                <div className="illustration-text">
                  <h3>APSRTC Digital Bus Pass Generation</h3>
                  <p>Generating the maximum passes efficiently</p>
                </div>
              </div>
            </div>

            {/* Right Side (Login Form) */}
            <div className="login-right-pane">
              <h2 className="login-title">Log in</h2>

              <div className="role-toggle-container">
                <button
                  className="role-btn active"
                >
                  As Student
                </button>
                <button
                  className="role-btn"
                  onClick={() => navigate('/admin')}
                >
                  Administrator
                </button>
              </div>

              <div className="form-container">
                <div className="input-group">
                  <label>Email Address</label>
                  <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center', opacity: otpSent ? 0.6 : 1, backgroundColor: otpSent ? '#eee' : 'white' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <input
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={otpSent}
                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: otpSent ? '#888' : 'inherit' }}
                    />
                  </div>
                </div>

                {otpSent && (
                  <div className="input-group" style={{ marginTop: '15px' }}>
                    <label>Enter OTP</label>
                    <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      <input
                        type="text"
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                      />
                    </div>
                  </div>
                )}

                <button className="submit-btn" onClick={!otpSent ? handleSendOtp : handleVerify} style={{ marginTop: '20px' }}>
                  {!otpSent ? "Send OTP" : "Verify OTP"}
                </button>

                <div className="login-problems-link">
                  <a href="#">Problems logging in?</a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default EmailOtp;
