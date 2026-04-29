// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
    // OTP
    sendOtp: `${API_BASE_URL}/send-sms-otp`,
    verifyOtp: `${API_BASE_URL}/verify-sms-otp`,
    
    // Applications
    submitApplication: `${API_BASE_URL}/api/applications`,
    getApplication: (id) => `${API_BASE_URL}/api/applications/${id}`,
    getApplicationDetails: (id) => `${API_BASE_URL}/api/applications/details/${id}`,
    traceApplication: `${API_BASE_URL}/api/applications/trace`,
    updateApplication: (id) => `${API_BASE_URL}/api/applications/${id}`,
    
    // Renewal ID Lookup
    getByRenewalId: (renewalId) => `${API_BASE_URL}/api/applications/renewal/${renewalId}`,
    
    // Passes
    createPass: `${API_BASE_URL}/api/passes`,
    getPass: (passNumber) => `${API_BASE_URL}/api/passes/${passNumber}`,
    getUserPasses: (identifier) => `${API_BASE_URL}/api/passes/user/${identifier}`,
    
    // Payments
    createPayment: `${API_BASE_URL}/api/payments`,
    completePayment: (paymentId) => `${API_BASE_URL}/api/payments/${paymentId}/complete`,
    failPayment: (paymentId) => `${API_BASE_URL}/api/payments/${paymentId}/fail`,
    getPaymentStatus: (paymentId) => `${API_BASE_URL}/api/payments/${paymentId}/status`,
    
    // Health
    health: `${API_BASE_URL}/health`,

    // Gov Admin
    govAdminLogin: `${API_BASE_URL}/api/gov-admin/login`,
    govAdminStats: `${API_BASE_URL}/api/gov-admin/stats`,
};

export default API_BASE_URL;
