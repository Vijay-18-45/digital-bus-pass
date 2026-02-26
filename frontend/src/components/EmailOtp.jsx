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

  // Admin login state
  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [depoName, setDepoName] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

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

  // Admin login handler
  const handleAdminLogin = async () => {
    if (!adminId || !adminPassword || !depoName) {
      alert("Please fill all admin login fields");
      return;
    }

    setAdminLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: adminId,
          admin_password: adminPassword,
          depo_name: depoName
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('adminDepo', data.admin.depo_name);
        localStorage.setItem('adminId', data.admin.admin_id);
        navigate('/admin-dashboard');
      } else {
        alert(data.message || "Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.error("Admin login error:", error);
      alert("Server error. Could not connect to the backend.");
    } finally {
      setAdminLoading(false);
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
                  className={`role-btn ${role === 'student' ? 'active' : ''}`}
                  onClick={() => !otpSent && setRole('student')}
                  disabled={otpSent}
                >
                  As Student
                </button>
                <button
                  className={`role-btn ${role === 'admin' ? 'active' : ''}`}
                  onClick={() => !otpSent && setRole('admin')}
                  disabled={otpSent}
                >
                  Administrator
                </button>
              </div>

              <div className="form-container">
                {role === 'student' ? (
                  // Student login form
                  <>
                    {!otpSent ? (
                      <div className="input-group">
                        <label>Email Address</label>
                        <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                          </svg>
                          <input
                            type="email"
                            placeholder="example@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="input-group">
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

                    <button className="submit-btn" onClick={!otpSent ? handleSendOtp : handleVerify}>
                      {!otpSent ? "Send OTP" : "Verify OTP"}
                    </button>
                  </>
                ) : (
                  // Admin login form
                  <>
                    <div className="input-group">
                      <label>Admin ID</label>
                      <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <input
                          type="text"
                          placeholder="Enter Admin ID"
                          value={adminId}
                          onChange={(e) => setAdminId(e.target.value)}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label>Password</label>
                      <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        <input
                          type="password"
                          placeholder="Enter Password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label>Depot Name</label>
                      <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <input
                          type="text"
                          placeholder="e.g. Vijayawada, Guntur, Vizag"
                          value={depoName}
                          onChange={(e) => setDepoName(e.target.value)}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>

                    <button 
                      className="submit-btn" 
                      onClick={handleAdminLogin}
                      disabled={adminLoading}
                      style={{ opacity: adminLoading ? 0.7 : 1 }}
                    >
                      {adminLoading ? "Logging in..." : "Login as Admin"}
                    </button>
                  </>
                )}

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
