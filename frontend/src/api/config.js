// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
    // OTP
    sendOtp: `${API_BASE_URL}/send-email`,
    verifyOtp: `${API_BASE_URL}/verify-otp`,
    
    // Applications
    submitApplication: `${API_BASE_URL}/api/applications`,
    getApplication: (id) => `${API_BASE_URL}/api/applications/${id}`,
    traceApplication: `${API_BASE_URL}/api/applications/trace`,
    updateApplication: (id) => `${API_BASE_URL}/api/applications/${id}`,
    
    // Passes
    createPass: `${API_BASE_URL}/api/passes`,
    getPass: (passNumber) => `${API_BASE_URL}/api/passes/${passNumber}`,
    getUserPasses: (email) => `${API_BASE_URL}/api/passes/user/${email}`,
    
    // Payments
    createPayment: `${API_BASE_URL}/api/payments`,
    completePayment: (paymentId) => `${API_BASE_URL}/api/payments/${paymentId}/complete`,
    
    // Health
    health: `${API_BASE_URL}/health`,
};

export default API_BASE_URL;
