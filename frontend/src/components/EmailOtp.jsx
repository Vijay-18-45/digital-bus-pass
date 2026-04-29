import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./EmailOtp.css";
import { useLanguage } from "../context/LanguageContext";
import Header from "./header";
import { useLocation } from "react-router-dom";

function EmailOtp() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const location = useLocation();
  const [role, setRole] = useState("user");
  const [isSignup, setIsSignup] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [loginMethod, setLoginMethod] = useState("mobile"); // 'mobile' or 'email'

  // Set initial role from query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const initialRole = params.get("role");
    if (initialRole && ["user", "admin", "gov"].includes(initialRole)) {
      setRole(initialRole);
    }
  }, [location]);
  const [otpTimer, setOtpTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Admin login state
  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [depoName, setDepoName] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  // Timer countdown effect
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setOtpSent(false);
            setOtp("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Resend cooldown timer
  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Format timer display
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendOtp = async () => {
    if (loginMethod === 'email') {
      if (!email) {
        alert("Please enter your email address");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert("Please enter a valid email address");
        return;
      }
    } else {
      if (!phone) {
        alert("Please enter your mobile number");
        return;
      }
      if (!/^\d{10}$/.test(phone)) {
        alert("Please enter a valid 10-digit mobile number");
        return;
      }
    }

    setIsSendingOtp(true);

    try {
      const body = { 
        phone: loginMethod === 'mobile' ? phone : undefined,
        email: loginMethod === 'email' ? email : undefined,
        action: isSignup ? 'signup' : 'login',
        role: role,
        loginMethod
      };

      const response = await fetch("http://localhost:5000/send-sms-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setOtpTimer(300); // 5 minutes = 300 seconds
        setResendCooldown(30); // 30 seconds cooldown before resend
        alert(t('otp_sent_alert') || `OTP sent successfully to ${loginMethod === 'mobile' ? phone : email}`);
      } else {
        alert(data.message || t('otp_send_failed_alert'));
      }

    } catch (error) {
      console.error("Error:", error);
      alert(t('server_error_alert') || "Server error. Please try again later.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0) {
      return;
    }

    setIsResending(true);

    try {
      const body = loginMethod === 'mobile' ? { phone, loginMethod: 'mobile' } : { email, loginMethod: 'email' };
      const response = await fetch("http://localhost:5000/send-sms-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        setOtp("");
        setOtpTimer(300); // Reset 5 minute timer
        setResendCooldown(30); // 30 seconds cooldown
        alert(`New OTP sent successfully to ${loginMethod === 'mobile' ? phone : email}`);
      } else if (response.status === 429) {
        setResendCooldown(data.retryAfter || 30);
        alert(data.message || "Please wait before requesting a new OTP");
      } else {
        alert(data.message || "Failed to resend OTP");
      }
    } catch (error) {
      console.error("Resend OTP Error:", error);
      alert("Server error. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    if (!otp) {
      alert(t('enter_otp_alert') || "Please enter OTP");
      return;
    }

    const body = { 
      phone: loginMethod === 'mobile' ? phone : undefined,
      email: loginMethod === 'email' ? email : undefined,
      otp, 
      action: isSignup ? 'signup' : 'login',
      role: role,
      loginMethod
    };

    const res = await fetch("http://localhost:5000/verify-sms-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (res.ok) {
      // Store identifier for session
      localStorage.setItem('userIdentifier', loginMethod === 'mobile' ? phone : email);
      if (email) localStorage.setItem('userEmail', email);
      if (phone) localStorage.setItem('userPhone', phone);
      
      // Use role from backend or fallback to selected role
      const verifiedRole = data.role || 'user';
      
      // Security Check: If user selected a privileged role but backend says 'user'
      if ((role === 'admin' || role === 'gov') && verifiedRole === 'user') {
        alert("Your mobile number is not registered as an administrator. Logging you in as a regular user.");
      }
      
      // Redirect based on role
      if (verifiedRole === 'admin') {
        localStorage.setItem('adminId', data.adminData?.admin_id || phone);
        localStorage.setItem('adminDepo', data.adminData?.depo_name || 'Main Depot');
        navigate('/admin-dashboard');
      } else if (verifiedRole === 'gov') {
        localStorage.setItem('govAdminEmail', phone + "@gov.in"); // Keep legacy key format
        navigate('/gov-dashboard');
      } else {
        navigate("/home");
      }
    } else {
      alert(data.message || t('otp_verify_failed_alert'));
    }
  };

  const handleLogin = async () => {
    if (loginMethod === 'mobile') {
      if (!phone) {
        alert("Please enter your mobile number");
        return;
      }
      if (!/^\d{10}$/.test(phone)) {
        alert("Please enter a valid 10-digit mobile number");
        return;
      }
    } else {
      if (!email) {
        alert("Please enter your email address");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert("Please enter a valid email address");
        return;
      }
    }

    try {
      const body = loginMethod === 'mobile' ? { phone } : { email };
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        // user exists, now send OTP for security
        handleSendOtp();
      } else if (response.status === 404) {
        alert(loginMethod === 'mobile' 
          ? "Mobile number not registered. Please click 'Don't have an account? Sign up' at the bottom to register."
          : "Email not registered. Please click 'Don't have an account? Sign up' at the bottom to register.");
      } else {
        alert(data.message || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert(t('server_error_alert') || "Server error. Please try again later.");
    }
  };

  const handleVerifyWithValidation = () => {
    if (!otp || otp.length < 6) {
      alert("Please enter a valid 6-digit OTP");
      return;
    }
    handleVerify();
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
              <h2 className="login-title">{isSignup ? "Sign Up" : "Log in"}</h2>

              <div className="role-toggle-container">
                <button
                  className={`role-btn ${role === 'user' ? 'active' : ''}`}
                  onClick={() => { setRole('user'); setIsSignup(false); }}
                >
                  As User
                </button>
                <button
                  className={`role-btn ${role === 'admin' ? 'active' : ''}`}
                  onClick={() => navigate('/admin-login')}
                >
                  Administrator
                </button>
                <button
                  className={`role-btn ${role === 'gov' ? 'active' : ''}`}
                  onClick={() => navigate('/gov-login')}
                >
                  Gov Admin
                </button>
              </div>

              <div className="form-container">
                {role === 'user' ? (
                  <>
                    {/* Login Method Toggle */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                      <button
                        type="button"
                        onClick={() => { setLoginMethod('mobile'); setOtpSent(false); setOtp(''); setOtpTimer(0); }}
                        disabled={otpSent}
                        style={{
                          flex: 1, padding: '10px', border: loginMethod === 'mobile' ? '2px solid #e31e24' : '1px solid #ddd',
                          borderRadius: '8px', background: loginMethod === 'mobile' ? '#fef2f2' : '#fff',
                          color: loginMethod === 'mobile' ? '#e31e24' : '#555', fontWeight: loginMethod === 'mobile' ? '600' : '400',
                          cursor: otpSent ? 'not-allowed' : 'pointer', fontSize: '13px', transition: 'all 0.2s'
                        }}
                      >
                        📱 Mobile Number
                      </button>
                      <button
                        type="button"
                        onClick={() => { setLoginMethod('email'); setOtpSent(false); setOtp(''); setOtpTimer(0); }}
                        disabled={otpSent}
                        style={{
                          flex: 1, padding: '10px', border: loginMethod === 'email' ? '2px solid #e31e24' : '1px solid #ddd',
                          borderRadius: '8px', background: loginMethod === 'email' ? '#fef2f2' : '#fff',
                          color: loginMethod === 'email' ? '#e31e24' : '#555', fontWeight: loginMethod === 'email' ? '600' : '400',
                          cursor: otpSent ? 'not-allowed' : 'pointer', fontSize: '13px', transition: 'all 0.2s'
                        }}
                      >
                        ✉️ Email Address
                      </button>
                    </div>

                    {loginMethod === 'email' ? (
                      <div className="input-group">
                        <label>Email Address</label>
                        <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center', opacity: otpSent ? 0.6 : 1, backgroundColor: otpSent ? '#eee' : 'white' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                          </svg>
                          <input
                            type="email"
                            placeholder="your.email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={otpSent}
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: otpSent ? '#888' : 'inherit' }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="input-group">
                        <label>Mobile Number</label>
                        <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center', opacity: otpSent ? 0.6 : 1, backgroundColor: otpSent ? '#eee' : 'white' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                          <input
                            type="tel"
                            placeholder="10-digit mobile number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            disabled={otpSent}
                            maxLength={10}
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: otpSent ? '#888' : 'inherit' }}
                          />
                        </div>
                      </div>
                    )}

                    {otpSent && (
                      <div className="input-group" style={{ marginTop: '15px' }}>
                        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Enter OTP</span>
                          {otpTimer > 0 && (
                            <span style={{ fontSize: '14px', color: otpTimer < 60 ? '#e74c3c' : '#27ae60', fontWeight: 'bold' }}>
                              ⏱ {formatTimer(otpTimer)}
                            </span>
                          )}
                        </label>
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
                        {otpTimer === 0 && (
                          <p style={{ color: '#e74c3c', fontSize: '13px', marginTop: '8px' }}>
                            ⚠️ OTP expired. Please request a new one.
                          </p>
                        )}
                        <div style={{ marginTop: '10px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={isResending || resendCooldown > 0}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: resendCooldown > 0 ? '#999' : '#e31e24',
                              cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                              fontSize: '14px',
                              textDecoration: 'underline',
                              padding: '5px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            {isResending && (
                              <span style={{ 
                                border: '2px solid #e31e24', 
                                borderTop: '2px solid transparent', 
                                borderRadius: '50%', 
                                width: '12px', 
                                height: '12px', 
                                animation: 'spin 0.6s linear infinite',
                                display: 'inline-block'
                              }}></span>
                            )}
                            {isResending 
                              ? "Resending..." 
                              : resendCooldown > 0 
                                ? `Resend OTP in ${resendCooldown}s`
                                : "Resend OTP"
                            }
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}

                <button 
                  className="submit-btn" 
                  onClick={!otpSent ? handleSendOtp : handleVerifyWithValidation} 
                  disabled={isSendingOtp || adminLoading}
                  style={{ 
                    marginTop: '20px', 
                    opacity: (isSendingOtp || adminLoading) ? 0.7 : 1,
                    cursor: (isSendingOtp || adminLoading) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {(isSendingOtp || adminLoading) && (
                    <span className="spinner"></span>
                  )}
                  {(isSendingOtp || adminLoading)
                    ? "Processing..." 
                    : !otpSent ? "Send OTP" : "Verify & Login"
                  }
                </button>

                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>

                <div className="login-problems-link" style={{ textAlign: "center", marginTop: "15px" }}>
                  <a href="#" onClick={(e) => { 
                    e.preventDefault(); 
                    setIsSignup(!isSignup); 
                    setOtpSent(false); 
                    setOtp(""); 
                    setOtpTimer(0);
                    setIsSendingOtp(false);
                  }}>
                    {isSignup ? "Already have an account? Log in" : "Don't have an account? Sign up"}
                  </a>
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
