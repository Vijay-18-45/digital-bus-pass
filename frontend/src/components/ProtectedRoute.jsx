import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute component to handle role-based redirection.
 */
const ProtectedRoute = ({ children, role }) => {
    const isAdmin = localStorage.getItem('adminId');
    const isGovAdmin = localStorage.getItem('govAdminEmail');

    if (role === 'admin') {
        if (!isAdmin) {
            return <Navigate to="/?role=admin" replace />;
        }
    }

    if (role === 'gov') {
        if (!isGovAdmin) {
            return <Navigate to="/?role=gov" replace />;
        }
    }

    // Role-based authorization could be stricter here if tokens were available.
    // For now, we rely on the presence of role-specific localStorage keys.

    return children;
};

export default ProtectedRoute;
