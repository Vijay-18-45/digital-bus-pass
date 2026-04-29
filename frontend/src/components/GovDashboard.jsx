import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../api/config';
import Header from './header';
import './GovDashboard.css';

const CATEGORY_LABELS = {
    student_above_ssc: 'Student (Above SSC)',
    student_below_ssc: 'Student (Below SSC)',
    citizen: 'Citizen',
    gov_employee: 'Govt. Employee',
    non_gov_employee: 'Non-Govt. Employee',
    journalist: 'Journalist',
    ngo_worker: 'NGO Worker',
};

const CATEGORY_COLORS = {
    student_above_ssc: '#6366f1',
    student_below_ssc: '#a78bfa',
    citizen: '#ec4899',
    gov_employee: '#10b981',
    non_gov_employee: '#f59e0b',
    journalist: '#3b82f6',
    ngo_worker: '#ef4444',
};

/* ── SVG Pie Chart ─────────────────────────── */
const PieChart = ({ data, size = 280 }) => {
    const filtered = data.filter(d => d.value > 0);
    const total = filtered.reduce((sum, d) => sum + d.value, 0);

    if (total === 0) {
        return (
            <div className="gd-pie-empty">
                <svg viewBox="0 0 100 100" width={size} height={size}>
                    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="1.5" strokeDasharray="4 3" />
                    <text x="50" y="46" textAnchor="middle" fill="#64748b" fontSize="7" fontWeight="600">No Data</text>
                    <text x="50" y="56" textAnchor="middle" fill="#475569" fontSize="4.5">Available Yet</text>
                </svg>
            </div>
        );
    }

    let cumAngle = 0;
    const slices = filtered.map((d, i) => {
        const angle = (d.value / total) * 360;
        const start = cumAngle;
        cumAngle += angle;

        if (angle >= 359.9) return <circle key={i} cx="50" cy="50" r="44" fill={d.color} />;

        const sr = ((start - 90) * Math.PI) / 180;
        const er = ((start + angle - 90) * Math.PI) / 180;
        const x1 = 50 + 44 * Math.cos(sr);
        const y1 = 50 + 44 * Math.sin(sr);
        const x2 = 50 + 44 * Math.cos(er);
        const y2 = 50 + 44 * Math.sin(er);
        const large = angle > 180 ? 1 : 0;

        return (
            <path key={i} d={`M50 50 L${x1} ${y1} A44 44 0 ${large} 1 ${x2} ${y2}Z`}
                fill={d.color} stroke="rgba(15,23,42,0.9)" strokeWidth="0.6" className="gd-pie-slice" />
        );
    });

    return (
        <svg viewBox="0 0 100 100" width={size} height={size} className="gd-pie-svg">
            <defs>
                <filter id="pieShadow"><feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.25" /></filter>
            </defs>
            <g filter="url(#pieShadow)">{slices}</g>
        </svg>
    );
};

/* ── Main Dashboard ─────────────────────────── */
const GovDashboard = () => {
    const [view, setView] = useState('menu');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!localStorage.getItem('govAdminEmail')) {
            navigate('/gov-login');
            return;
        }
        fetchStats();
    }, [navigate]);

    const fetchStats = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.govAdminStats);
            const json = await res.json();
            if (json.success) setStats(json.data);
            else setError('Failed to load statistics');
        } catch {
            setError('Unable to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('govAdminEmail');
            navigate('/');
        }
    };

    /* ── Prepare chart data ── */
    const getPassesData = () => {
        if (!stats?.categoryStats) return [];
        return stats.categoryStats.map(c => ({
            label: CATEGORY_LABELS[c.application_type] || c.application_type,
            value: parseInt(c.passes_issued) || 0,
            color: CATEGORY_COLORS[c.application_type] || '#64748b',
            total: parseInt(c.total_applications) || 0,
            pending: parseInt(c.pending) || 0,
            rejected: parseInt(c.rejected) || 0,
        }));
    };

    const getRevenueData = () => {
        if (!stats?.revenueByCategory || stats.revenueByCategory.length === 0) {
            if (!stats?.categoryStats) return [];
            return stats.categoryStats.map(c => ({
                label: CATEGORY_LABELS[c.application_type] || c.application_type,
                value: 0,
                color: CATEGORY_COLORS[c.application_type] || '#64748b',
            }));
        }
        return stats.revenueByCategory.map(r => ({
            label: CATEGORY_LABELS[r.application_type] || r.application_type,
            value: parseFloat(r.revenue) || 0,
            color: CATEGORY_COLORS[r.application_type] || '#64748b',
        }));
    };

    const totalPasses = getPassesData().reduce((s, d) => s + d.value, 0);
    const totalRevenue = stats?.totalRevenue || 0;

    /* ── Render ── */
    if (loading) {
        return (
            <div className="gd-page">
                <div className="gd-loading">
                    <div className="gd-loading-spinner"></div>
                    <p>Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="gd-page">
            {/* ── APSRTC Header ── */}
            <Header />

            {/* ── Sub Header ── */}
            <header className="gd-header">
                <div className="gd-header-left">
                    <span className="gd-header-icon">🏛️</span>
                    <div>
                        <h1>APSRTC Government Portal</h1>
                        <p>Analytics & Monitoring Dashboard</p>
                    </div>
                </div>
                <button className="gd-logout-btn" onClick={handleLogout}>
                    Logout
                </button>
            </header>

            {error && <div className="gd-error-banner">{error}</div>}

            {/* ── MENU VIEW ── */}
            {view === 'menu' && (
                <div className="gd-menu-container">
                    <h2 className="gd-menu-title">Government Dashboard</h2>
                    <p className="gd-menu-subtitle">Select an analysis to view</p>

                    <div className="gd-menu-cards">
                        <button 
                            type="button"
                            className="gd-menu-card gd-menu-card-money" 
                            onClick={() => {
                                console.log('GovDashboard: Switching to money view');
                                setView('money');
                            }}
                        >
                            <div className="gd-menu-card-icon">💰</div>
                            <h3>View Money Analysis</h3>
                            <p>Revenue breakdown by category with detailed financial insights</p>
                            <div className="gd-menu-card-stat">
                                <span>Total Revenue</span>
                                <strong>₹{totalRevenue.toLocaleString('en-IN')}</strong>
                            </div>
                            <div className="gd-menu-card-arrow">→</div>
                        </button>

                        <button 
                            type="button"
                            className="gd-menu-card gd-menu-card-passes" 
                            onClick={() => {
                                console.log('GovDashboard: Switching to passes view');
                                setView('passes');
                            }}
                        >
                            <div className="gd-menu-card-icon">🎫</div>
                            <h3>View Number of Passes Issued</h3>
                            <p>Category-wise pass distribution and application statistics</p>
                            <div className="gd-menu-card-stat">
                                <span>Total Passes</span>
                                <strong>{totalPasses}</strong>
                            </div>
                            <div className="gd-menu-card-arrow">→</div>
                        </button>
                    </div>
                </div>
            )}

            {/* ── MONEY ANALYSIS VIEW ── */}
            {view === 'money' && (
                <div className="gd-analysis-container">
                    <button className="gd-back-btn" onClick={() => setView('menu')}>← Back to Menu</button>
                    <h2 className="gd-analysis-title">💰 Revenue Analysis</h2>

                    <div className="gd-total-banner gd-total-money">
                        <span>Total Revenue Generated</span>
                        <strong>₹{totalRevenue.toLocaleString('en-IN')}</strong>
                    </div>

                    <div className="gd-chart-section">
                        <div className="gd-chart-wrapper">
                            <PieChart data={getRevenueData()} size={300} />
                        </div>
                        <div className="gd-legend">
                            {getRevenueData().map((d, i) => (
                                <div key={i} className="gd-legend-item">
                                    <span className="gd-legend-dot" style={{ background: d.color }}></span>
                                    <span className="gd-legend-label">{d.label}</span>
                                    <span className="gd-legend-value">₹{d.value.toLocaleString('en-IN')}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {getRevenueData().some(d => d.value > 0) && (
                        <table className="gd-table">
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Revenue (₹)</th>
                                    <th>Share (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getRevenueData().filter(d => d.value > 0).map((d, i) => {
                                    const share = totalRevenue > 0 ? ((d.value / totalRevenue) * 100).toFixed(1) : 0;
                                    return (
                                        <tr key={i}>
                                            <td><span className="gd-table-dot" style={{ background: d.color }}></span>{d.label}</td>
                                            <td className="gd-table-num">₹{d.value.toLocaleString('en-IN')}</td>
                                            <td className="gd-table-num">{share}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ── PASSES ISSUED VIEW ── */}
            {view === 'passes' && (
                <div className="gd-analysis-container">
                    <button className="gd-back-btn" onClick={() => setView('menu')}>← Back to Menu</button>
                    <h2 className="gd-analysis-title">🎫 Passes Issued by Category</h2>

                    <div className="gd-total-banner gd-total-passes">
                        <span>Total Passes Issued</span>
                        <strong>{totalPasses}</strong>
                    </div>

                    <div className="gd-chart-section">
                        <div className="gd-chart-wrapper">
                            <PieChart data={getPassesData()} size={300} />
                        </div>
                        <div className="gd-legend">
                            {getPassesData().map((d, i) => (
                                <div key={i} className="gd-legend-item">
                                    <span className="gd-legend-dot" style={{ background: d.color }}></span>
                                    <span className="gd-legend-label">{d.label}</span>
                                    <span className="gd-legend-value">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <table className="gd-table">
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Passes Issued</th>
                                <th>Total Applications</th>
                                <th>Pending</th>
                                <th>Rejected</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getPassesData().map((d, i) => (
                                <tr key={i}>
                                    <td><span className="gd-table-dot" style={{ background: d.color }}></span>{d.label}</td>
                                    <td className="gd-table-num">{d.value}</td>
                                    <td className="gd-table-num">{d.total}</td>
                                    <td className="gd-table-num gd-pending">{d.pending}</td>
                                    <td className="gd-table-num gd-rejected">{d.rejected}</td>
                                </tr>
                            ))}
                            <tr className="gd-table-total">
                                <td><strong>Total</strong></td>
                                <td className="gd-table-num"><strong>{totalPasses}</strong></td>
                                <td className="gd-table-num"><strong>{getPassesData().reduce((s, d) => s + d.total, 0)}</strong></td>
                                <td className="gd-table-num"><strong>{getPassesData().reduce((s, d) => s + d.pending, 0)}</strong></td>
                                <td className="gd-table-num"><strong>{getPassesData().reduce((s, d) => s + d.rejected, 0)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default GovDashboard;
