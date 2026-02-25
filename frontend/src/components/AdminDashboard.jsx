import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedApp, setSelectedApp] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const depoName = localStorage.getItem('adminDepo');
    const adminId = localStorage.getItem('adminId');
    const navigate = useNavigate();

    useEffect(() => {
        if (!depoName) {
            navigate('/admin');
            return;
        }

        const fetchApplications = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/admin/applications/${encodeURIComponent(depoName)}`);
                const data = await response.json();

                if (response.ok && data.success) {
                    setApplications(data.applications);
                } else {
                    setError(data.message || 'Failed to fetch applications');
                }
            } catch (err) {
                console.error('Fetch error:', err);
                setError('Server error while fetching applications');
            } finally {
                setIsLoading(false);
            }
        };

        fetchApplications();
    }, [depoName, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('adminDepo');
        localStorage.removeItem('adminId');
        navigate('/admin');
    };

    const handleUpdateStatus = async (appId, status) => {
        if (!window.confirm(`Are you sure you want to mark this application as ${status.toUpperCase()}? This will send an immediate email notification.`)) return;

        setActionLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/admin/applications/${appId}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                setApplications(prev => prev.map(a => a.application_id === appId ? { ...a, status } : a));
                setSelectedApp(null);
                alert(`Success! User has been notified that their application is ${status}.`);
            } else {
                alert(data.message || 'Failed to update status');
            }
        } catch (err) {
            alert('Server error while communicating with backend.');
        } finally {
            setActionLoading(false);
        }
    };

    const renderDocument = (title, src) => {
        if (!src) return null;

        const isImage = src.startsWith('data:image') || src.match(/\.(jpeg|jpg|gif|png)$/) != null;
        return (
            <div style={styles.imageBox}>
                <p><strong>{title}</strong></p>
                {isImage ? (
                    <img src={src} style={styles.thumbnail} alt={title} />
                ) : (
                    <a href={src} target="_blank" rel="noreferrer" style={styles.docLink}>View Document</a>
                )}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div style={styles.centerContainer}>
                <h2>Loading applications...</h2>
            </div>
        );
    }

    return (
        <div style={styles.dashboardContainer}>
            <header style={styles.header}>
                <div>
                    <h1 style={styles.heading}>Admin Dashboard - Depot: {depoName}</h1>
                    <p style={styles.subtitle}>Welcome back, {adminId}</p>
                </div>
                <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
            </header>

            {error && <div style={styles.errorBanner}>{error}</div>}

            <div style={styles.content}>
                <h2 style={{ marginBottom: '20px' }}>Recent Applications from {depoName} Depot</h2>

                {applications.length === 0 ? (
                    <div style={styles.emptyState}>No applications found for this depot.</div>
                ) : (
                    <div style={styles.tableResponsive}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>App ID</th>
                                    <th style={styles.th}>Name</th>
                                    <th style={styles.th}>Category</th>
                                    <th style={styles.th}>Mobile</th>
                                    <th style={styles.th}>From - To</th>
                                    <th style={styles.th}>Date</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((app) => (
                                    <tr key={app.application_id} style={styles.tr}>
                                        <td style={styles.td}><strong>{app.application_id}</strong></td>
                                        <td style={styles.td}>{app.full_name}</td>
                                        <td style={styles.td}>
                                            <span style={styles.badge}>{app.category}</span>
                                        </td>
                                        <td style={styles.td}>{app.mobile}</td>
                                        <td style={styles.td}>{app.from_place} - {app.to_place}</td>
                                        <td style={styles.td}>{new Date(app.created_at).toLocaleDateString()}</td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.statusBadge,
                                                ...(app.status === 'pending' ? styles.statusPending :
                                                    app.status === 'rejected' ? styles.statusRejected :
                                                        styles.statusCompleted)
                                            }}>
                                                {app.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <button
                                                style={styles.viewBtn}
                                                onClick={() => setSelectedApp(app)}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Application Details Modal Overlay */}
            {selectedApp && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h2>Application ID: {selectedApp.application_id}</h2>
                            <button style={styles.closeBtn} onClick={() => setSelectedApp(null)}>&times;</button>
                        </div>

                        <div style={styles.modalBody}>
                            <h3 style={styles.sectionTitle}>Applicant Details</h3>
                            <div style={styles.detailsGrid}>
                                <div><strong>Full Name:</strong> {selectedApp.full_name}</div>
                                <div><strong>Father's Name:</strong> {selectedApp.father_name || 'N/A'}</div>
                                <div><strong>Gender:</strong> {selectedApp.gender}</div>
                                <div><strong>Date of Birth:</strong> {selectedApp.date_of_birth ? new Date(selectedApp.date_of_birth).toLocaleDateString() : 'N/A'}</div>
                                <div><strong>Aadhar Number:</strong> {selectedApp.aadhar_number}</div>
                                <div><strong>Mobile:</strong> {selectedApp.mobile}</div>
                                <div><strong>Email:</strong> {selectedApp.email}</div>
                                <div><strong>Category:</strong> {selectedApp.category}</div>
                            </div>

                            <h3 style={styles.sectionTitle}>Route Details</h3>
                            <div style={styles.detailsGrid}>
                                <div><strong>From:</strong> {selectedApp.from_place}</div>
                                <div><strong>To:</strong> {selectedApp.to_place}</div>
                                <div><strong>Via:</strong> {selectedApp.via}</div>
                                <div><strong>Depot:</strong> {selectedApp.depot}</div>
                            </div>

                            <h3 style={styles.sectionTitle}>Academic/Specific Details</h3>
                            <div style={styles.detailsGrid}>
                                {selectedApp.institution_name && <div><strong>Institution:</strong> {selectedApp.institution_name}</div>}
                                {selectedApp.course_year && <div><strong>Course Year:</strong> {selectedApp.course_year}</div>}
                                {selectedApp.school_name && <div><strong>School Name:</strong> {selectedApp.school_name}</div>}
                                {selectedApp.class_studying && <div><strong>Class:</strong> {selectedApp.class_studying}</div>}
                                {selectedApp.ssc_board && <div><strong>SSC Board:</strong> {selectedApp.ssc_board}</div>}
                                {selectedApp.ssc_year && <div><strong>SSC Year:</strong> {selectedApp.ssc_year}</div>}
                                {selectedApp.ssc_htno && <div><strong>SSC Hall Ticket:</strong> {selectedApp.ssc_htno}</div>}
                                {selectedApp.door_street && <div><strong>Door/Street:</strong> {selectedApp.door_street}</div>}
                                {selectedApp.village_town && <div><strong>Village/Town:</strong> {selectedApp.village_town}</div>}
                                {selectedApp.mandal_district && <div><strong>Mandal/District:</strong> {selectedApp.mandal_district}</div>}
                                {selectedApp.pincode && <div><strong>Pincode:</strong> {selectedApp.pincode}</div>}
                            </div>

                            <h3 style={styles.sectionTitle}>Documents & Photos</h3>
                            <div style={styles.imageGrid}>
                                {renderDocument('Profile Photo', selectedApp.photo)}
                                {renderDocument('ID Card', selectedApp.id_card_doc)}
                                {renderDocument('Aadhar Proof', selectedApp.aadhar_proof_doc)}
                                {renderDocument('Address Proof', selectedApp.address_proof_doc)}
                                {renderDocument('Salary Certificate', selectedApp.salary_certificate_doc)}
                                {renderDocument('Other Document', selectedApp.other_doc)}

                                {(!selectedApp.photo && !selectedApp.id_card_doc && !selectedApp.aadhar_proof_doc) && (
                                    <p style={{ color: '#888' }}>No documents uploaded.</p>
                                )}
                            </div>
                        </div>

                        <div style={styles.modalFooter}>
                            {selectedApp.status === 'pending' ? (
                                <>
                                    <button
                                        style={{ ...styles.actionBtn, backgroundColor: '#27ae60' }}
                                        onClick={() => handleUpdateStatus(selectedApp.application_id, 'approved')}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Processing...' : '✔ Approve & Notify User'}
                                    </button>
                                    <button
                                        style={{ ...styles.actionBtn, backgroundColor: '#e74c3c' }}
                                        onClick={() => handleUpdateStatus(selectedApp.application_id, 'rejected')}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Processing...' : '✖ Reject & Notify User'}
                                    </button>
                                </>
                            ) : (
                                <div style={{ fontWeight: 'bold', color: selectedApp.status === 'approved' ? '#27ae60' : '#e74c3c' }}>
                                    This application has already been {selectedApp.status.toUpperCase()}.
                                </div>
                            )}
                            <button
                                style={{ ...styles.actionBtn, backgroundColor: '#7f8c8d' }}
                                onClick={() => setSelectedApp(null)}
                                disabled={actionLoading}
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    centerContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'sans-serif'
    },
    dashboardContainer: {
        minHeight: '100vh',
        backgroundColor: '#f5f7fb',
        fontFamily: 'Inter, sans-serif'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 40px',
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    },
    heading: {
        margin: 0,
        fontSize: '24px',
        color: '#333'
    },
    subtitle: {
        margin: '5px 0 0 0',
        color: '#666',
        fontSize: '14px'
    },
    logoutBtn: {
        padding: '10px 20px',
        borderRadius: '6px',
        border: '1px solid #dcdcdc',
        backgroundColor: '#fff',
        color: '#333',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    content: {
        padding: '40px',
        maxWidth: '1200px',
        margin: '0 auto'
    },
    errorBanner: {
        backgroundColor: '#fdecea',
        color: '#e74c3c',
        padding: '15px',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    emptyState: {
        backgroundColor: '#fff',
        padding: '40px',
        textAlign: 'center',
        borderRadius: '12px',
        color: '#888',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },
    tableResponsive: {
        overflowX: 'auto',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        padding: '1px'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        backgroundColor: '#f8fafc',
        padding: '16px',
        textAlign: 'left',
        fontSize: '14px',
        color: '#555',
        fontWeight: '600',
        borderBottom: '2px solid #edf2f7'
    },
    td: {
        padding: '16px',
        borderBottom: '1px solid #edf2f7',
        fontSize: '14px',
        color: '#333'
    },
    tr: {
        transition: 'background-color 0.1s',
        '&:hover': {
            backgroundColor: '#f8fafc'
        }
    },
    badge: {
        backgroundColor: '#e1e8fa',
        color: '#2b5ea8',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600'
    },
    statusBadge: {
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold'
    },
    statusPending: {
        backgroundColor: '#fff3cd',
        color: '#856404'
    },
    statusCompleted: {
        backgroundColor: '#d4edda',
        color: '#155724'
    },
    statusRejected: {
        backgroundColor: '#f8d7da',
        color: '#721c24'
    },
    viewBtn: {
        padding: '6px 12px',
        backgroundColor: '#e2e8f0',
        color: '#334155',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '600',
        transition: 'all 0.2s',
    },

    // Modal Styles
    modalOverlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '20px'
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        overflow: 'hidden'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 30px',
        borderBottom: '1px solid #eee',
        backgroundColor: '#f8fafc'
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: '28px',
        cursor: 'pointer',
        color: '#888',
        lineHeight: '1'
    },
    modalBody: {
        padding: '30px',
        overflowY: 'auto',
        flex: 1
    },
    sectionTitle: {
        fontSize: '18px',
        color: '#2c3e50',
        borderBottom: '2px solid #edf2f7',
        paddingBottom: '8px',
        marginBottom: '15px',
        marginTop: '25px'
    },
    detailsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '15px',
        marginBottom: '20px',
        fontSize: '15px'
    },
    imageGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px',
        marginTop: '15px'
    },
    imageBox: {
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '10px',
        textAlign: 'center',
        backgroundColor: '#f8fafc'
    },
    thumbnail: {
        maxWidth: '100%',
        maxHeight: '150px',
        objectFit: 'contain',
        borderRadius: '4px',
        marginTop: '10px'
    },
    docLink: {
        display: 'inline-block',
        marginTop: '10px',
        color: '#3498db',
        textDecoration: 'none',
        fontWeight: 'bold'
    },
    modalFooter: {
        padding: '20px 30px',
        borderTop: '1px solid #eee',
        backgroundColor: '#f8fafc',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        alignItems: 'center'
    },
    actionBtn: {
        padding: '10px 20px',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
        transition: 'opacity 0.2s',
    }
};

export default AdminDashboard;
