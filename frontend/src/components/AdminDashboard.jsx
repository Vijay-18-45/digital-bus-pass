import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './header';

const AdminDashboard = () => {
    const [applications, setApplications] = useState([]);
    const [filteredApplications, setFilteredApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedApp, setSelectedApp] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });

    const depoName = localStorage.getItem('adminDepo');
    const adminId = localStorage.getItem('adminId');
    const navigate = useNavigate();

    useEffect(() => {
        if (!depoName) {
            navigate('/admin-login');
            return;
        }

        const fetchApplications = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/admin/applications/${encodeURIComponent(depoName)}`);
                const data = await response.json();

                if (response.ok && data.success) {
                    setApplications(data.applications);
                    setFilteredApplications(data.applications);
                    
                    // Calculate stats from fetched applications
                    const pending = data.applications.filter(a => a.status === 'pending').length;
                    const approved = data.applications.filter(a => a.status === 'approved').length;
                    const rejected = data.applications.filter(a => a.status === 'rejected').length;
                    setStats({ pending, approved, rejected, total: data.applications.length });
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

    // Filter applications when status filter changes
    useEffect(() => {
        if (statusFilter === 'all') {
            setFilteredApplications(applications);
        } else {
            setFilteredApplications(applications.filter(app => app.status === statusFilter));
        }
    }, [statusFilter, applications]);

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('adminDepo');
            localStorage.removeItem('adminId');
            navigate('/');
        }
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
                // Update applications list with renewal_id if approved
                const updatedApps = applications.map(a => 
                    a.application_id === appId 
                        ? { ...a, status, ...(data.renewal_id ? { renewal_id: data.renewal_id } : {}) } 
                        : a
                );
                setApplications(updatedApps);
                
                // Update stats
                const pending = updatedApps.filter(a => a.status === 'pending').length;
                const approved = updatedApps.filter(a => a.status === 'approved').length;
                const rejected = updatedApps.filter(a => a.status === 'rejected').length;
                setStats({ pending, approved, rejected, total: updatedApps.length });
                
                setSelectedApp(null);

                if (status === 'approved' && data.renewal_id) {
                    alert(
                        `✅ Application APPROVED!\n\n` +
                        `📋 Application ID: ${data.application_id}\n` +
                        `🔑 Renewal ID: ${data.renewal_id}\n\n` +
                        `⚠️ Please note down this Renewal ID and share it with the applicant.\n` +
                        `The applicant has also been notified via email with these details.`
                    );
                } else if (status === 'rejected') {
                    alert(`❌ Application REJECTED.\nThe applicant has been notified via email.`);
                } else {
                    alert(`Application status updated to ${status}.`);
                }
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

        const value = String(src).trim();
        const isImage = value.startsWith('data:image') || /\.(jpeg|jpg|gif|png)(\?|#|$)/i.test(value);
        const isPdf = value.startsWith('data:application/pdf') || /\.pdf(\?|#|$)/i.test(value);

        return (
            <div style={styles.imageBox}>
                <p><strong>{title}</strong></p>
                {isImage && (
                    <img src={value} style={styles.thumbnail} alt={title} />
                )}
                {isPdf && (
                    <object data={value} type="application/pdf" style={styles.pdfPreview}>
                        <p style={{ margin: '8px 0', color: '#666' }}>PDF preview unavailable in this browser.</p>
                    </object>
                )}
                {!isImage && !isPdf && (
                    <p style={styles.docMeta}>Document uploaded</p>
                )}
                <a href={value} target="_blank" rel="noreferrer" style={styles.docLink}>Open Document</a>
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
            <Header />
            <div style={styles.subHeader}>
                <div>
                    <h1 style={styles.heading}>Admin Dashboard - Depot: {depoName}</h1>
                    <p style={styles.subtitle}>Welcome back, {adminId}</p>
                </div>
                <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
            </div>

            {error && <div style={styles.errorBanner}>{error}</div>}

            <div style={styles.content}>
                {/* Stats Cards */}
                <div style={styles.statsContainer}>
                    <div style={{...styles.statCard, borderLeft: '4px solid #f39c12'}} onClick={() => setStatusFilter('pending')}>
                        <div style={styles.statNumber}>{stats.pending}</div>
                        <div style={styles.statLabel}>Pending</div>
                    </div>
                    <div style={{...styles.statCard, borderLeft: '4px solid #27ae60'}} onClick={() => setStatusFilter('approved')}>
                        <div style={styles.statNumber}>{stats.approved}</div>
                        <div style={styles.statLabel}>Approved</div>
                    </div>
                    <div style={{...styles.statCard, borderLeft: '4px solid #e74c3c'}} onClick={() => setStatusFilter('rejected')}>
                        <div style={styles.statNumber}>{stats.rejected}</div>
                        <div style={styles.statLabel}>Rejected</div>
                    </div>
                    <div style={{...styles.statCard, borderLeft: '4px solid #3498db'}} onClick={() => setStatusFilter('all')}>
                        <div style={styles.statNumber}>{stats.total}</div>
                        <div style={styles.statLabel}>Total</div>
                    </div>
                </div>

                {/* Filter Section */}
                <div style={styles.filterSection}>
                    <h2 style={{ margin: 0 }}>Applications {statusFilter !== 'all' ? `(${statusFilter.toUpperCase()})` : ''}</h2>
                    <div style={styles.filterButtons}>
                        <button 
                            style={statusFilter === 'all' ? styles.filterBtnActive : styles.filterBtn} 
                            onClick={() => setStatusFilter('all')}
                        >All</button>
                        <button 
                            style={statusFilter === 'pending' ? styles.filterBtnActive : styles.filterBtn} 
                            onClick={() => setStatusFilter('pending')}
                        >Pending</button>
                        <button 
                            style={statusFilter === 'approved' ? styles.filterBtnActive : styles.filterBtn} 
                            onClick={() => setStatusFilter('approved')}
                        >Approved</button>
                        <button 
                            style={statusFilter === 'rejected' ? styles.filterBtnActive : styles.filterBtn} 
                            onClick={() => setStatusFilter('rejected')}
                        >Rejected</button>
                    </div>
                </div>

                {filteredApplications.length === 0 ? (
                    <div style={styles.emptyState}>No {statusFilter !== 'all' ? statusFilter : ''} applications found.</div>
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
                                {filteredApplications.map((app) => (
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
                                {/* Student fields */}
                                {selectedApp.institution_name && <div><strong>Institution:</strong> {selectedApp.institution_name}</div>}
                                {selectedApp.course_year && <div><strong>Course Year:</strong> {selectedApp.course_year}</div>}
                                {selectedApp.school_name && <div><strong>School Name:</strong> {selectedApp.school_name}</div>}
                                {selectedApp.class_studying && <div><strong>Class:</strong> {selectedApp.class_studying}</div>}
                                {selectedApp.ssc_board && <div><strong>SSC Board:</strong> {selectedApp.ssc_board}</div>}
                                {selectedApp.ssc_year && <div><strong>SSC Year:</strong> {selectedApp.ssc_year}</div>}
                                {selectedApp.ssc_htno && <div><strong>SSC Hall Ticket:</strong> {selectedApp.ssc_htno}</div>}
                                
                                {/* Address fields */}
                                {selectedApp.door_street && <div><strong>Door/Street:</strong> {selectedApp.door_street}</div>}
                                {selectedApp.village_town && <div><strong>Village/Town:</strong> {selectedApp.village_town}</div>}
                                {selectedApp.mandal_district && <div><strong>Mandal/District:</strong> {selectedApp.mandal_district}</div>}
                                {selectedApp.pincode && <div><strong>Pincode:</strong> {selectedApp.pincode}</div>}
                                {selectedApp.residential_address && <div><strong>Residential Address:</strong> {selectedApp.residential_address}</div>}
                                
                                {/* Citizen fields */}
                                {selectedApp.occupation && <div><strong>Occupation:</strong> {selectedApp.occupation}</div>}
                                {selectedApp.depot_details && <div><strong>Depot Details:</strong> {selectedApp.depot_details}</div>}
                                
                                {/* Student Employee Child fields */}
                                {selectedApp.is_govt_employee_child && <div><strong>Is Govt Employee Child:</strong> Yes</div>}
                                {selectedApp.parent_employee_name && <div><strong>Parent Employee Name:</strong> {selectedApp.parent_employee_name}</div>}
                                {selectedApp.parent_pf_number && <div><strong>Parent PF Number:</strong> {selectedApp.parent_pf_number}</div>}
                                
                                {/* Employee fields */}
                                {selectedApp.designation && <div><strong>Designation:</strong> {selectedApp.designation}</div>}
                                {selectedApp.office_address && <div><strong>Office Address:</strong> {selectedApp.office_address}</div>}
                                {selectedApp.company_name && <div><strong>Company Name:</strong> {selectedApp.company_name}</div>}
                                {selectedApp.sector_type && <div><strong>Sector Type:</strong> {selectedApp.sector_type}</div>}
                                {selectedApp.employment_type && <div><strong>Employment Type:</strong> {selectedApp.employment_type}</div>}
                                {selectedApp.employee_id && <div><strong>Employee ID:</strong> {selectedApp.employee_id}</div>}
                                {selectedApp.gov_emp_id_pf && <div><strong>Govt Emp ID/PF:</strong> {selectedApp.gov_emp_id_pf}</div>}
                                {selectedApp.dept_ministry && <div><strong>Department/Ministry:</strong> {selectedApp.dept_ministry}</div>}
                                {selectedApp.office_name && <div><strong>Office Name:</strong> {selectedApp.office_name}</div>}
                                {selectedApp.working_district && <div><strong>Working District:</strong> {selectedApp.working_district}</div>}
                                {selectedApp.office_district && <div><strong>Office District:</strong> {selectedApp.office_district}</div>}
                                
                                {/* Journalist fields */}
                                {selectedApp.media_organization && <div><strong>Media Organization:</strong> {selectedApp.media_organization}</div>}
                                {selectedApp.press_id_number && <div><strong>Press ID Number:</strong> {selectedApp.press_id_number}</div>}
                                {selectedApp.experience_years && <div><strong>Experience (Years):</strong> {selectedApp.experience_years}</div>}
                                
                                {/* NGO fields */}
                                {selectedApp.ngo_name && <div><strong>NGO Name:</strong> {selectedApp.ngo_name}</div>}
                                {selectedApp.ngo_registration_number && <div><strong>NGO Registration No:</strong> {selectedApp.ngo_registration_number}</div>}
                                {selectedApp.ngo_address && <div><strong>NGO Address:</strong> {selectedApp.ngo_address}</div>}
                                
                                {/* Validity */}
                                {selectedApp.validity && <div><strong>Validity Requested:</strong> {selectedApp.validity}</div>}
                            </div>

                            <h3 style={styles.sectionTitle}>Documents & Photos</h3>
                            <div style={styles.imageGrid}>
                                {renderDocument('Profile Photo', selectedApp.photo)}
                                {renderDocument('ID Card', selectedApp.id_card_doc)}
                                {renderDocument('Aadhar Proof', selectedApp.aadhar_proof_doc)}
                                {renderDocument('Address Proof', selectedApp.address_proof_doc)}
                                {renderDocument('Salary Certificate', selectedApp.salary_certificate_doc)}
                                {renderDocument('Study Certificate', selectedApp.study_certificate_doc)}
                                {renderDocument('Other Document', selectedApp.other_doc)}

                                {(!selectedApp.photo && !selectedApp.id_card_doc && !selectedApp.aadhar_proof_doc && !selectedApp.address_proof_doc && !selectedApp.salary_certificate_doc && !selectedApp.study_certificate_doc && !selectedApp.other_doc) && (
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
                                <div>
                                    <div style={{ fontWeight: 'bold', color: selectedApp.status === 'approved' ? '#27ae60' : '#e74c3c' }}>
                                        This application has already been {selectedApp.status.toUpperCase()}.
                                    </div>
                                    {selectedApp.status === 'approved' && selectedApp.renewal_id && (
                                        <div style={{ marginTop: '10px', padding: '10px 15px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '14px' }}>
                                            <strong>🔑 Renewal ID:</strong> <span style={{ color: '#e31e24', fontWeight: 'bold', fontSize: '16px' }}>{selectedApp.renewal_id}</span>
                                        </div>
                                    )}
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
    subHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 40px',
        backgroundColor: '#ffffff',
        borderBottom: '2px solid #d01c24',
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
        border: 'none',
        backgroundColor: '#d01c24',
        color: '#fff',
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
    pdfPreview: {
        width: '100%',
        height: '180px',
        marginTop: '10px',
        border: '1px solid #dbe5ef',
        borderRadius: '4px',
        backgroundColor: '#fff'
    },
    docMeta: {
        marginTop: '10px',
        fontSize: '13px',
        color: '#64748b'
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
    },
    statsContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
    },
    statCard: {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s'
    },
    statNumber: {
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#333'
    },
    statLabel: {
        fontSize: '14px',
        color: '#666',
        marginTop: '5px'
    },
    filterSection: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '15px'
    },
    filterButtons: {
        display: 'flex',
        gap: '10px'
    },
    filterBtn: {
        padding: '8px 16px',
        border: '1px solid #dcdcdc',
        borderRadius: '6px',
        backgroundColor: '#fff',
        color: '#666',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'all 0.2s'
    },
    filterBtnActive: {
        padding: '8px 16px',
        border: '1px solid #d01c24',
        borderRadius: '6px',
        backgroundColor: '#d01c24',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold'
    }
};

export default AdminDashboard;
