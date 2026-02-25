import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
                // Save admin details to display in the dashboard
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
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <h2>Admin Login</h2>
                    <p>Sign in to view depot applications</p>
                </div>

                <form onSubmit={handleLogin} style={styles.form}>
                    {error && <div style={styles.errorMessage}>{error}</div>}

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Admin ID</label>
                        <input
                            type="text"
                            value={adminId}
                            onChange={(e) => setAdminId(e.target.value)}
                            style={styles.input}
                            placeholder="Enter Admin ID"
                            required
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            style={styles.input}
                            placeholder="Enter Password"
                            required
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Depot Name</label>
                        <input
                            type="text"
                            value={depoName}
                            onChange={(e) => setDepoName(e.target.value)}
                            style={styles.input}
                            placeholder="e.g. Vijayawada, Guntur"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        style={isLoading ? { ...styles.button, opacity: 0.7 } : styles.button}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f7fb',
        padding: '20px'
    },
    card: {
        backgroundColor: '#ffffff',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
    },
    header: {
        textAlign: 'center',
        marginBottom: '30px'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#333'
    },
    input: {
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #ccc',
        fontSize: '16px',
        outline: 'none',
        transition: 'border-color 0.2s'
    },
    button: {
        padding: '12px 16px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: '#0056b3',
        color: '#fff',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '10px'
    },
    errorMessage: {
        padding: '10px',
        backgroundColor: '#fdecea',
        color: '#e74c3c',
        borderRadius: '8px',
        fontSize: '14px',
        textAlign: 'center'
    }
};

export default AdminLogin;
