import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import pool from './db_normalized.js';

dotenv.config();

export const adminRouter = express.Router();

// Create transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const initializeAdmin = async () => {
    try {
        const connection = await pool.getConnection();
        await connection.query(`
            CREATE TABLE IF NOT EXISTS admin_details (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id VARCHAR(50) UNIQUE NOT NULL,
                admin_password VARCHAR(255) NOT NULL,
                depo_name VARCHAR(100) NOT NULL
            )
        `);

        // Insert predefined admin credentials
        // Using INSERT IGNORE so it won't duplicate on multiple server starts
        await connection.query(`
            INSERT IGNORE INTO admin_details (admin_id, admin_password, depo_name)
            VALUES 
            ('admin1', 'admin123', 'Vijayawada'),
            ('admin2', 'admin123', 'Guntur'),
            ('admin3', 'admin123', 'Vizag')
        `);

        connection.release();
        console.log('✅ Admin credentials initialized');
    } catch (error) {
        console.error('❌ Admin initialization error:', error.message);
    }
};

adminRouter.post('/login', async (req, res) => {
    const { admin_id, admin_password, depo_name } = req.body;

    try {
        const [rows] = await pool.query(
            'SELECT * FROM admin_details WHERE admin_id = ? AND admin_password = ? AND depo_name = ?',
            [admin_id, admin_password, depo_name]
        );

        if (rows.length > 0) {
            res.json({ success: true, message: 'Login successful', admin: rows[0] });
        } else {
            res.status(401).json({ success: false, message: 'Invalid Admin ID, Password, or Depo Name' });
        }
    } catch (error) {
        console.error('Admin Login Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

adminRouter.get('/applications/:depoName', async (req, res) => {
    const { depoName } = req.params;

    try {
        // Query applications that have matching depot in student_above_ssc
        const [aboveSSC] = await pool.query(`
            SELECT a.*, 
                   s.door_street, s.village_town, s.mandal_district, s.pincode, s.via, s.depot, s.institution_name, s.course_year, s.ssc_board, s.ssc_year, s.ssc_htno, s.is_employee_child,
                   'Student Above SSC' as category 
            FROM applications a
            JOIN student_above_ssc s ON a.application_id = s.application_id
            WHERE s.depot = ?
        `, [depoName]);

        // Query applications that have matching depot in student_below_ssc
        const [belowSSC] = await pool.query(`
            SELECT a.*, 
                   s.door_street, s.village_town, s.mandal_district, s.pincode, s.via, s.depot, s.school_name, s.class_studying,
                   'Student Below SSC' as category 
            FROM applications a
            JOIN student_below_ssc s ON a.application_id = s.application_id
            WHERE s.depot = ?
        `, [depoName]);

        const allApplications = [...aboveSSC, ...belowSSC];

        // Sort by created_at descending
        allApplications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json({ success: true, applications: allApplications });
    } catch (error) {
        console.error('Admin Fetch Applications Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

adminRouter.post('/applications/:applicationId/status', async (req, res) => {
    const { applicationId } = req.params;
    const { status } = req.body;

    try {
        // Fetch the application
        const [rows] = await pool.query('SELECT * FROM applications WHERE application_id = ?', [applicationId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        const application = rows[0];

        // Update the status in the DB
        await pool.query('UPDATE applications SET status = ? WHERE application_id = ?', [status, applicationId]);

        // Send email based on status
        if (application.email) {
            let emailSubject = '';
            let emailBody = '';

            if (status === 'approved') {
                emailSubject = "APSRTC Bus Pass - Application Approved";
                emailBody = `
                  <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                    <h2 style="color: #27ae60;">Application Approved</h2>
                    <p>Dear ${application.full_name},</p>
                    <p>Your bus pass application details have been accurately verified.</p>
                    <p>Status: <strong style="color: #27ae60;">ACCEPTED</strong></p>
                    <p>Please proceed to the platform to complete your payment.</p>
                  </div>
                `;
            } else if (status === 'rejected') {
                emailSubject = "APSRTC Bus Pass - Application Rejected";
                emailBody = `
                  <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                    <h2 style="color: #e74c3c;">Application Rejected</h2>
                    <p>Dear ${application.full_name},</p>
                    <p>Unfortunately, your application (ID: ${application.application_id}) has been rejected.</p>
                    <p>Your details were not accurate or the uploaded documents were invalid. Please cross-check your details and apply again.</p>
                    <p>Status: <strong style="color: #e74c3c;">REJECTED</strong></p>
                  </div>
                `;
            }

            if (emailBody !== '') {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: application.email,
                    subject: emailSubject,
                    html: emailBody
                });
            }
        }

        res.json({ success: true, message: `Application ${status}` });
    } catch (error) {
        console.error('Update Application Status Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});
