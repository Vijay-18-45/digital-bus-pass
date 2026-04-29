import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send SMS notification to the applicant
 * @param {Object} params
 * @param {string} params.to - Recipient phone number (with country code)
 * @param {string} params.message - SMS message content
 */
export const sendSMS = async ({ to, message }) => {
    try {
        // Ensure phone number has country code (default to India +91)
        let formattedNumber = to;
        if (!to.startsWith('+')) {
            formattedNumber = '+91' + to.replace(/^0/, '');
        }

        const result = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedNumber
        });

        console.log(`✅ SMS sent to ${formattedNumber} (SID: ${result.sid})`);
        return { success: true, sid: result.sid };
    } catch (error) {
        console.error('⚠️ SMS send failed:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send approval SMS to applicant
 */
export const sendApprovalSMS = async ({ to, fullName, applicationId, renewalId }) => {
    const message = `Dear ${fullName}, your APSRTC Bus Pass application (${applicationId}) has been APPROVED! Your Renewal ID: ${renewalId}. Please proceed to payment on the portal. Save this ID for future reference.`;
    return sendSMS({ to, message });
};

/**
 * Send rejection SMS to applicant
 */
export const sendRejectionSMS = async ({ to, fullName, applicationId }) => {
    const message = `Dear ${fullName}, your APSRTC Bus Pass application (${applicationId}) has been REJECTED. Please check your email for details or apply again with correct documents.`;
    return sendSMS({ to, message });
};

/**
 * Send submission confirmation SMS to applicant
 */
export const sendSubmissionSMS = async ({ to, fullName, applicationId }) => {
    const message = `Dear ${fullName}, your APSRTC Bus Pass application has been submitted successfully! Application ID: ${applicationId}. You will be notified once reviewed. - APSRTC`;
    return sendSMS({ to, message });
};
