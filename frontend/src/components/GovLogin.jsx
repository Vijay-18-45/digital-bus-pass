import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../api/config';
import Header from './header';
import './EmailOtp.css';

const GovLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const govAdmin = localStorage.getItem('govAdminEmail');
        if (govAdmin) navigate('/gov-dashboard');
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(API_ENDPOINTS.govAdminLogin, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                localStorage.setItem('govAdminEmail', data.admin.email);
                navigate('/gov-dashboard');
            } else {
                setError(data.message || 'Invalid credentials');
            }
        } catch (err) {
            setError('Unable to connect to server. Please try again.');
        } finally {
            setIsLoading(false);
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
                                    <h3>APSRTC Government Portal</h3>
                                    <p>Analytics & monitoring dashboard</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Side (Login Form) */}
                        <div className="login-right-pane">
                            <h2 className="login-title">Government Admin Login</h2>

                            <div className="role-toggle-container">
                                <button className="role-btn" onClick={() => navigate('/')}>As User</button>
                                <button className="role-btn" onClick={() => navigate('/admin-login')}>Administrator</button>
                                <button className="role-btn active">Gov Admin</button>
                            </div>

                            <form onSubmit={handleLogin} className="form-container">
                                {error && (
                                    <div style={{ padding: '10px 15px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '14px', textAlign: 'center' }}>
                                        {error}
                                    </div>
                                )}

                                <div className="input-group">
                                    <label>Admin Email</label>
                                    <div className="input-wrapper">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px', flexShrink: 0 }}>
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                            <polyline points="22,6 12,13 2,6"></polyline>
                                        </svg>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter admin email"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Password</label>
                                    <div className="input-wrapper">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px', flexShrink: 0 }}>
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                        </svg>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter password"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="submit-btn"
                                    disabled={isLoading}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    {isLoading && <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }}></span>}
                                    {isLoading ? 'Signing in...' : 'Sign In'}
                                </button>

                                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>

                                <div style={{ textAlign: 'center', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#888', fontSize: '13px' }}>
                                    <span>🔒</span>
                                    <span>Authorized Personnel Only</span>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
};

export default GovLogin;
