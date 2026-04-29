import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './header';
import './EmailOtp.css';

const AdminLogin = () => {
    const [adminId, setAdminId] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [depoName, setDepoName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    admin_id: adminId,
                    admin_password: adminPassword,
                    depo_name: depoName,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                localStorage.setItem('adminDepo', data.admin.depo_name);
                localStorage.setItem('adminId', data.admin.admin_id);
                navigate('/admin-dashboard');
            } else {
                setError(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Server error. Could not connect to the backend.');
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
                                    <h3>APSRTC Admin Management</h3>
                                    <p>Manage depot applications efficiently</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Side (Login Form) */}
                        <div className="login-right-pane">
                            <h2 className="login-title">Administrator Login</h2>

                            <div className="role-toggle-container">
                                <button className="role-btn" onClick={() => navigate('/')}>As User</button>
                                <button className="role-btn active">Administrator</button>
                                <button className="role-btn" onClick={() => navigate('/gov-login')}>Gov Admin</button>
                            </div>

                            <form onSubmit={handleLogin} className="form-container">
                                {error && (
                                    <div style={{ padding: '10px 15px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '14px', textAlign: 'center' }}>
                                        {error}
                                    </div>
                                )}

                                <div className="input-group">
                                    <label>Admin ID</label>
                                    <div className="input-wrapper">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px', flexShrink: 0 }}>
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        <input
                                            type="text"
                                            value={adminId}
                                            onChange={(e) => setAdminId(e.target.value)}
                                            placeholder="Enter Admin ID"
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
                                            value={adminPassword}
                                            onChange={(e) => setAdminPassword(e.target.value)}
                                            placeholder="Enter Password"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Depot Name <span style={{ fontSize: '12px', color: '#888', fontWeight: 'normal' }}>(Optional)</span></label>
                                    <div className="input-wrapper">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px', flexShrink: 0 }}>
                                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                        </svg>
                                        <input
                                            type="text"
                                            value={depoName}
                                            onChange={(e) => setDepoName(e.target.value)}
                                            placeholder="e.g. Vijayawada, Guntur"
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
                                    {isLoading ? 'Logging in...' : 'Login'}
                                </button>

                                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminLogin;
