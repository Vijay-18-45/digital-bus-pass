import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Generate a unique 12-character uppercase alphanumeric Renewal ID
 * @returns {string} e.g. "RNW8A3K7X2M4"
 */
export const generateRenewalId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 12; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
};

/**
 * Send application submission confirmation email
 */
export const sendSubmissionMail = async ({ to, fullName, applicationId, applicationType, fromPlace, toPlace }) => {
    const categoryMap = {
        'student_above_ssc': 'Student (Above SSC)',
        'student_below_ssc': 'Student (Below SSC)',
        'citizen': 'Citizen',
        'gov_employee': 'Government Employee',
        'non_gov_employee': 'Non-Government Employee',
        'journalist': 'Journalist',
        'ngo_worker': 'NGO Worker'
    };

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db; margin-bottom: 16px;">Application Submitted Successfully 📝</h2>
        
        <p>Dear ${fullName},</p>
        
        <p>Thank you for submitting your bus pass application. Your application has been received and is currently under review.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #ddd;">
          <tr>
            <td style="padding: 12px 16px; border: 1px solid #ddd; font-weight: bold; background: #fafafa; width: 40%;">Application ID</td>
            <td style="padding: 12px 16px; border: 1px solid #ddd; color: #3498db; font-weight: bold;">${applicationId}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; border: 1px solid #ddd; font-weight: bold; background: #fafafa;">Category</td>
            <td style="padding: 12px 16px; border: 1px solid #ddd;">${categoryMap[applicationType] || applicationType}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; border: 1px solid #ddd; font-weight: bold; background: #fafafa;">Route</td>
            <td style="padding: 12px 16px; border: 1px solid #ddd;">${fromPlace || 'N/A'} &rarr; ${toPlace || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; border: 1px solid #ddd; font-weight: bold; background: #fafafa;">Status</td>
            <td style="padding: 12px 16px; border: 1px solid #ddd; color: #f39c12; font-weight: bold;">PENDING</td>
          </tr>
        </table>
        
        <p style="margin-top: 20px; padding: 12px; background: #e8f4fd; border: 1px solid #3498db; border-radius: 6px; font-size: 13px;">
          📌 <strong>Note:</strong> Save your Application ID. You will receive an email and SMS notification once your application is reviewed by the admin.
        </p>
        
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #888;">APSRTC Bus Pass Portal &mdash; Andhra Pradesh State Road Transport Corporation</p>
      </div>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject: 'APSRTC Bus Pass - Application Submitted 📝',
        html: htmlBody
    });
};

/**
 * Send approval email to the applicant
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.fullName - Applicant's full name
 * @param {string} params.applicationId - Application ID
 * @param {string} params.renewalId - Generated Renewal ID
 * @param {string} params.fromPlace - Route start
 * @param {string} params.toPlace - Route end
 */
export const sendApprovalMail = async ({ to, fullName, applicationId, renewalId, fromPlace, toPlace }) => {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27ae60; margin-bottom: 16px;">Application Approved ✅</h2>
        
        <p>Dear ${fullName},</p>
        
        <p>Your bus pass application has been <strong>verified and approved</strong>. You are now eligible for your APSRTC Bus Pass.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #ddd;">
          <tr>
            <td style="padding: 12px 16px; border: 1px solid #ddd; font-weight: bold; background: #fafafa; width: 40%;">Application ID</td>
            <td style="padding: 12px 16px; border: 1px solid #ddd;">${applicationId}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; border: 1px solid #ddd; font-weight: bold; background: #fafafa;">Renewal ID</td>
            <td style="padding: 12px 16px; border: 1px solid #ddd; color: #27ae60; font-weight: bold;">${renewalId}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; border: 1px solid #ddd; font-weight: bold; background: #fafafa;">Route</td>
            <td style="padding: 12px 16px; border: 1px solid #ddd;">${fromPlace || 'N/A'} &rarr; ${toPlace || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; border: 1px solid #ddd; font-weight: bold; background: #fafafa;">Status</td>
            <td style="padding: 12px 16px; border: 1px solid #ddd; color: #27ae60; font-weight: bold;">APPROVED</td>
          </tr>
        </table>
        
        <p>Please use your <strong>Renewal ID: ${renewalId}</strong> to proceed with payment on the platform.</p>
        
        <p style="margin-top: 20px; padding: 12px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; font-size: 13px;">
          ⚠️ <strong>Important:</strong> Save your Application ID and Renewal ID. You will need them for future reference and renewal.
        </p>
        
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #888;">APSRTC Bus Pass Portal &mdash; Andhra Pradesh State Road Transport Corporation</p>
      </div>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject: 'APSRTC Bus Pass - Application Approved ✅',
        html: htmlBody
    });
};

/**
 * Send rejection email to the applicant
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.fullName - Applicant's full name
 * @param {string} params.applicationId - Application ID
 */
export const sendRejectionMail = async ({ to, fullName, applicationId }) => {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #e74c3c; padding: 20px; text-align: center;">
          <h2 style="color: #fff; margin: 0;">Application Rejected</h2>
        </div>
        <div style="padding: 25px;">
          <p>Dear <strong>${fullName}</strong>,</p>
          <p>Unfortunately, your application has been rejected.</p>
          
          <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px;">Application ID:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #333; font-size: 14px; text-align: right;">${applicationId}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #555; font-size: 14px;">Your details were not accurate or the uploaded documents were invalid. Please cross-check your details and apply again.</p>
          <p>Status: <strong style="color: #e74c3c;">REJECTED</strong></p>
        </div>
        <div style="background: #f1f1f1; padding: 12px; text-align: center; font-size: 12px; color: #888;">
          APSRTC Bus Pass Portal &mdash; Andhra Pradesh State Road Transport Corporation
        </div>
      </div>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject: 'APSRTC Bus Pass - Application Rejected',
        html: htmlBody
    });
};
