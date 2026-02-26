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
        // Query all student_above_ssc applications
        const [aboveSSC] = await pool.query(`
            SELECT a.*, 
                   s.door_street, s.village_town, s.mandal_district, s.pincode, s.via, s.depot, s.institution_name, s.course_year, s.registration_number, s.ssc_board, s.ssc_year, s.ssc_htno, s.is_govt_employee_child, s.parent_employee_name, s.parent_pf_number, s.study_certificate_doc,
                   'Student Above SSC' as category 
            FROM applications a
            JOIN student_above_ssc s ON a.application_id = s.application_id
        `);

        // Query all student_below_ssc applications
        const [belowSSC] = await pool.query(`
            SELECT a.*, 
                   s.door_street, s.village_town, s.mandal_district, s.pincode, s.via, s.depot, s.school_name, s.class_studying, s.is_govt_employee_child, s.parent_employee_name, s.parent_pf_number,
                   'Student Below SSC' as category 
            FROM applications a
            JOIN student_below_ssc s ON a.application_id = s.application_id
        `);

        // Query all citizen applications
        const [citizens] = await pool.query(`
            SELECT a.*, 
                   c.residential_address, c.via, c.occupation, c.depot_details,
                   'Citizen' as category,
                   COALESCE(c.depot_details, 'All Depots') as depot
            FROM applications a
            JOIN citizen_applications c ON a.application_id = c.application_id
        `);

        // Query all government employee applications
        const [govEmps] = await pool.query(`
            SELECT a.*, 
                   g.residential_address, g.office_address, g.designation, g.gov_emp_id_pf, g.dept_ministry, g.office_name, g.employment_type, g.working_district, g.depot_details,
                   'Government Employee' as category,
                   COALESCE(g.depot_details, g.working_district, 'All Depots') as depot
            FROM applications a
            JOIN gov_employee_applications g ON a.application_id = g.application_id
        `);

        // Query all non-government employee applications
        const [nonGovEmps] = await pool.query(`
            SELECT a.*, 
                   n.residential_address, n.office_address, n.designation, n.employee_id, n.company_name, n.sector_type, n.employment_type, n.office_district, n.depot_details,
                   'Non-Government Employee' as category,
                   COALESCE(n.depot_details, n.office_district, 'All Depots') as depot
            FROM applications a
            JOIN non_gov_employee_applications n ON a.application_id = n.application_id
        `);

        // Query journalist applications (no depot filter - show all to relevant admins)
        const [journalists] = await pool.query(`
            SELECT a.*, 
                   j.residential_address, j.office_address, j.media_organization, j.designation, j.press_id_number, j.experience_years, j.validity, j.depot_details,
                   'Journalist' as category,
                   COALESCE(j.depot_details, 'All Depots') as depot
            FROM applications a
            JOIN journalist_applications j ON a.application_id = j.application_id
        `);

        // Query NGO applications (no depot filter - show all to relevant admins)
        const [ngoWorkers] = await pool.query(`
            SELECT a.*, 
                   ng.residential_address, ng.ngo_address, ng.ngo_name, ng.ngo_registration_number, ng.designation, ng.experience_years, ng.validity, ng.depot_details,
                   ng.date_of_appointment, ng.date_of_retirement, ng.scale_pay,
                   'NGO Worker' as category,
                   COALESCE(ng.depot_details, 'All Depots') as depot
            FROM applications a
            JOIN ngo_applications ng ON a.application_id = ng.application_id
        `);

        const allApplications = [...aboveSSC, ...belowSSC, ...citizens, ...govEmps, ...nonGovEmps, ...journalists, ...ngoWorkers];

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

// Get application statistics
adminRouter.get('/stats/:depoName', async (req, res) => {
    const { depoName } = req.params;
    
    try {
        const [pending] = await pool.query(
            "SELECT COUNT(*) as count FROM applications WHERE status = 'pending'"
        );
        const [approved] = await pool.query(
            "SELECT COUNT(*) as count FROM applications WHERE status = 'approved'"
        );
        const [rejected] = await pool.query(
            "SELECT COUNT(*) as count FROM applications WHERE status = 'rejected'"
        );
        const [total] = await pool.query(
            "SELECT COUNT(*) as count FROM applications"
        );
        
        res.json({
            success: true,
            stats: {
                pending: pending[0].count,
                approved: approved[0].count,
                rejected: rejected[0].count,
                total: total[0].count
            }
        });
    } catch (error) {
        console.error('Admin Stats Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Get all applications (no depot filter - for super admin view)
adminRouter.get('/all-applications', async (req, res) => {
    try {
        const [applications] = await pool.query(`
            SELECT a.*, 
                   CASE 
                       WHEN a.application_type = 'student_above_ssc' THEN 'Student Above SSC'
                       WHEN a.application_type = 'student_below_ssc' THEN 'Student Below SSC'
                       WHEN a.application_type = 'citizen' THEN 'Citizen'
                       WHEN a.application_type = 'gov_employee' THEN 'Government Employee'
                       WHEN a.application_type = 'non_gov_employee' THEN 'Non-Government Employee'
                       WHEN a.application_type = 'journalist' THEN 'Journalist'
                       WHEN a.application_type = 'ngo_worker' THEN 'NGO Worker'
                       ELSE a.application_type
                   END as category
            FROM applications a
            ORDER BY a.created_at DESC
        `);
        
        res.json({ success: true, applications });
    } catch (error) {
        console.error('Fetch All Applications Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});
