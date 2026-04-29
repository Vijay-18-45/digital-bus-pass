import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bus_pass_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
export const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL Connected Successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL Connection Error:', error.message);
        return false;
    }
};

// Initialize normalized database tables
export const initializeDatabase = async () => {
    try {
        const connection = await pool.getConnection();
        
        // Create users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE,
                phone VARCHAR(20) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL
            )
        `);

        // Create OTPs table (identifier can be email or phone)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS otps (
                id INT AUTO_INCREMENT PRIMARY KEY,
                identifier VARCHAR(255) NOT NULL,
                otp VARCHAR(6) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                is_used BOOLEAN DEFAULT FALSE,
                INDEX idx_identifier (identifier),
                INDEX idx_expires (expires_at)
            )
        `);


        // BASE APPLICATIONS TABLE (Common Fields Only - No NULL waste)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                application_id VARCHAR(20) UNIQUE NOT NULL,
                application_type ENUM('student_above_ssc', 'student_below_ssc', 'citizen', 'gov_employee', 'non_gov_employee', 'journalist', 'ngo_worker') NOT NULL,
                
                full_name VARCHAR(255) NOT NULL,
                father_name VARCHAR(255),
                gender ENUM('Male', 'Female', 'Other'),
                date_of_birth DATE,
                aadhar_number VARCHAR(12),
                mobile VARCHAR(15) NOT NULL,
                email VARCHAR(255),
                
                from_place VARCHAR(255),
                to_place VARCHAR(255),
                pass_type VARCHAR(50),
                pass_duration VARCHAR(50),
                
                photo LONGTEXT,
                id_card_doc LONGTEXT,
                salary_certificate_doc LONGTEXT,
                address_proof_doc LONGTEXT,
                aadhar_proof_doc LONGTEXT,
                other_doc LONGTEXT,
                
                status ENUM('pending', 'approved', 'rejected', 'processing') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_application_id (application_id),
                INDEX idx_status (status),
                INDEX idx_type (application_type)
            )
        `);

        // Add renewal_id column if it doesn't exist (migration for existing databases)
        try {
            await connection.query(`
                ALTER TABLE applications ADD COLUMN renewal_id VARCHAR(30) UNIQUE DEFAULT NULL AFTER status
            `);
            console.log('✅ Added renewal_id column to applications');
        } catch (e) {
            // Column already exists, ignore
            if (e.code !== 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ renewal_id column already exists');
            }
        }

        // Backfill renewal_id for any approved applications that don't have one
        const [missingRenewal] = await connection.query(
            "SELECT application_id FROM applications WHERE status = 'approved' AND renewal_id IS NULL"
        );
        if (missingRenewal.length > 0) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            for (const row of missingRenewal) {
                let rid = '';
                for (let i = 0; i < 12; i++) rid += chars.charAt(Math.floor(Math.random() * chars.length));
                await connection.query('UPDATE applications SET renewal_id = ? WHERE application_id = ?', [rid, row.application_id]);
            }
            console.log(`✅ Backfilled ${missingRenewal.length} approved applications with renewal IDs`);
        }

        // STUDENT ABOVE SSC - Type-specific fields only
        await connection.query(`
            CREATE TABLE IF NOT EXISTS student_above_ssc (
                id INT AUTO_INCREMENT PRIMARY KEY,
                application_id VARCHAR(20) UNIQUE NOT NULL,
                door_street VARCHAR(255),
                village_town VARCHAR(255),
                mandal_district VARCHAR(255),
                pincode VARCHAR(10),
                via VARCHAR(255),
                depot VARCHAR(255),
                institution_name VARCHAR(255),
                course_year VARCHAR(100),
                registration_number VARCHAR(100),
                ssc_board VARCHAR(100),
                ssc_year VARCHAR(4),
                ssc_htno VARCHAR(50),
                is_govt_employee_child BOOLEAN DEFAULT FALSE,
                parent_employee_name VARCHAR(255),
                parent_pf_number VARCHAR(100),
                study_certificate_doc LONGTEXT,
                FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
            )
        `);

        // STUDENT BELOW SSC
        await connection.query(`
            CREATE TABLE IF NOT EXISTS student_below_ssc (
                id INT AUTO_INCREMENT PRIMARY KEY,
                application_id VARCHAR(20) UNIQUE NOT NULL,
                door_street VARCHAR(255),
                village_town VARCHAR(255),
                mandal_district VARCHAR(255),
                pincode VARCHAR(10),
                via VARCHAR(255),
                depot VARCHAR(255),
                school_name VARCHAR(255),
                class_studying VARCHAR(50),
                is_govt_employee_child BOOLEAN DEFAULT FALSE,
                parent_employee_name VARCHAR(255),
                parent_pf_number VARCHAR(100),
                FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
            )
        `);

        // CITIZEN APPLICATIONS
        await connection.query(`
            CREATE TABLE IF NOT EXISTS citizen_applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                application_id VARCHAR(20) UNIQUE NOT NULL,
                residential_address TEXT,
                via VARCHAR(255),
                occupation VARCHAR(100),
                depot_details VARCHAR(255),
                address_proof_type VARCHAR(100),
                FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
            )
        `);

        // GOVERNMENT EMPLOYEE
        await connection.query(`
            CREATE TABLE IF NOT EXISTS gov_employee_applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                application_id VARCHAR(20) UNIQUE NOT NULL,
                residential_address TEXT,
                office_address TEXT,
                designation VARCHAR(100),
                gov_emp_id_pf VARCHAR(50),
                dept_ministry VARCHAR(255),
                office_name VARCHAR(255),
                employment_type VARCHAR(100),
                appointment_date DATE,
                retirement_date DATE,
                pay_scale VARCHAR(100),
                working_district VARCHAR(255),
                depot_details VARCHAR(255),
                FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
            )
        `);

        // NON-GOVERNMENT EMPLOYEE
        await connection.query(`
            CREATE TABLE IF NOT EXISTS non_gov_employee_applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                application_id VARCHAR(20) UNIQUE NOT NULL,
                residential_address TEXT,
                office_address TEXT,
                designation VARCHAR(100),
                employee_id VARCHAR(50),
                company_name VARCHAR(255),
                sector_type VARCHAR(100),
                employment_type VARCHAR(100),
                joining_date DATE,
                office_district VARCHAR(255),
                depot_details VARCHAR(255),
                monthly_income VARCHAR(100),
                FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
            )
        `);

        // JOURNALIST
        await connection.query(`
            CREATE TABLE IF NOT EXISTS journalist_applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                application_id VARCHAR(20) UNIQUE NOT NULL,
                residential_address TEXT,
                office_address TEXT,
                media_organization VARCHAR(255),
                designation VARCHAR(100),
                press_id_number VARCHAR(50),
                experience_years INT,
                validity VARCHAR(50),
                depot_details VARCHAR(255),
                FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
            )
        `);

        // NGO WORKER
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ngo_applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                application_id VARCHAR(20) UNIQUE NOT NULL,
                residential_address TEXT,
                ngo_address TEXT,
                ngo_name VARCHAR(255),
                ngo_registration_number VARCHAR(50),
                designation VARCHAR(100),
                experience_years INT,
                validity VARCHAR(50),
                depot_details VARCHAR(255),
                date_of_appointment DATE,
                date_of_retirement DATE,
                scale_pay VARCHAR(100),
                FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
            )
        `);

        // PASSES TABLE
        await connection.query(`
            CREATE TABLE IF NOT EXISTS passes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pass_number VARCHAR(20) UNIQUE NOT NULL,
                ticket_number VARCHAR(20) UNIQUE,
                application_id VARCHAR(20) NOT NULL,
                holder_name VARCHAR(100),
                institution_name VARCHAR(200),
                from_place VARCHAR(100),
                to_place VARCHAR(100),
                photo LONGTEXT,
                plan_months INT DEFAULT 1,
                amount DECIMAL(10,2),
                issue_date DATE NOT NULL,
                expiry_date DATE NOT NULL,
                is_renewal BOOLEAN DEFAULT FALSE,
                status ENUM('active', 'expired', 'cancelled', 'suspended') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE,
                INDEX idx_pass_number (pass_number),
                INDEX idx_status (status)
            )
        `);

        // PAYMENTS TABLE
        await connection.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                payment_id VARCHAR(30) UNIQUE NOT NULL,
                application_id VARCHAR(20) NOT NULL,
                pass_number VARCHAR(20) NULL,
                amount DECIMAL(10, 2) NOT NULL,
                plan_months INT DEFAULT 1,
                is_renewal BOOLEAN DEFAULT FALSE,
                payment_method VARCHAR(50),
                transaction_id VARCHAR(100),
                status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
                paid_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE,
                INDEX idx_payment_id (payment_id),
                INDEX idx_pass_number (pass_number),
                INDEX idx_status (status)
            )
        `);

        // RENEWAL PAYMENTS TABLE (separate ledger for all renewal transactions)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS renewal_payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                payment_id VARCHAR(30) UNIQUE NOT NULL,
                application_id VARCHAR(20) NOT NULL,
                pass_number VARCHAR(20) NULL,
                amount DECIMAL(10, 2) NOT NULL,
                plan_months INT DEFAULT 1,
                is_renewal BOOLEAN DEFAULT TRUE,
                payment_method VARCHAR(50),
                transaction_id VARCHAR(100),
                status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
                paid_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE,
                INDEX idx_payment_id (payment_id),
                INDEX idx_pass_number (pass_number),
                INDEX idx_status (status)
            )
        `);

        // Add plan_months and is_renewal columns if they don't exist (migration for existing tables)
        try {
            await connection.query(`ALTER TABLE payments ADD COLUMN plan_months INT DEFAULT 1 AFTER amount`);
        } catch (e) { /* column already exists */ }
        try {
            await connection.query(`ALTER TABLE payments ADD COLUMN is_renewal BOOLEAN DEFAULT FALSE AFTER plan_months`);
        } catch (e) { /* column already exists */ }
        try {
            await connection.query(`ALTER TABLE payments ADD COLUMN pass_number VARCHAR(20) NULL AFTER application_id`);
        } catch (e) { /* column already exists */ }
        try {
            await connection.query(`ALTER TABLE payments ADD INDEX idx_pass_number (pass_number)`);
        } catch (e) { /* index already exists */ }

        // Ensure renewal_payments schema for existing databases
        try {
            await connection.query(`ALTER TABLE renewal_payments ADD COLUMN pass_number VARCHAR(20) NULL AFTER application_id`);
        } catch (e) { /* column already exists */ }
        try {
            await connection.query(`ALTER TABLE renewal_payments ADD COLUMN plan_months INT DEFAULT 1 AFTER amount`);
        } catch (e) { /* column already exists */ }
        try {
            await connection.query(`ALTER TABLE renewal_payments ADD COLUMN is_renewal BOOLEAN DEFAULT TRUE AFTER plan_months`);
        } catch (e) { /* column already exists */ }
        try {
            await connection.query(`ALTER TABLE renewal_payments ADD INDEX idx_pass_number (pass_number)`);
        } catch (e) { /* index already exists */ }

        connection.release();
        console.log('✅ All normalized tables created/verified');
        return true;
    } catch (error) {
        console.error('❌ Database initialization error:', error.message);
        return false;
    }
};

// Generate unique application ID
export const generateApplicationId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = 'APP';
    for (let i = 0; i < 12; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
};

// =========================================
// APPLICATION OPERATIONS (Normalized)
// =========================================

// Create application with type-specific data
export const createApplication = async (data) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const applicationId = generateApplicationId();
        const applicationType = data.applicationType;
        
        // 1. Insert into base applications table
        await connection.query(`
            INSERT INTO applications (
                application_id, application_type, full_name, father_name, gender,
                date_of_birth, aadhar_number, mobile, email, from_place, to_place,
                pass_type, pass_duration, photo, id_card_doc, salary_certificate_doc,
                address_proof_doc, aadhar_proof_doc, other_doc
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            applicationId,
            applicationType,
            data.fullName,
            data.fatherName || null,
            data.gender || null,
            data.dateOfBirth || null,
            data.aadharNumber || data.aadhaarNumber || null,  // Accept both spellings
            data.mobileNumber || data.mobile,
            data.email || null,
            data.fromPlace || null,
            data.toPlace || null,
            data.passType || null,
            data.passDuration || data.validity || null,
            data.photo || null,
            data.idCardDoc || null,
            data.salaryCertificateDoc || null,
            data.addressProofDoc || null,
            data.aadharProofDoc || null,
            data.otherDoc || null
        ]);
        
        // 2. Insert into type-specific table
        switch (applicationType) {
            case 'student_above_ssc':
                await connection.query(`
                    INSERT INTO student_above_ssc (
                        application_id, door_street, village_town, mandal_district,
                        pincode, via, depot, institution_name, course_year, registration_number,
                        ssc_board, ssc_year, ssc_htno, is_govt_employee_child,
                        parent_employee_name, parent_pf_number, study_certificate_doc
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    applicationId,
                    data.doorStreet || null,
                    data.villageTown || null,
                    data.mandalDistrict || null,
                    data.pincode || null,
                    data.via || null,
                    data.depot || null,
                    data.institutionName || null,
                    data.courseYear || null,
                    data.registrationNumber || null,
                    data.sscBoard || null,
                    data.sscYear || null,
                    data.sscHtno || null,
                    data.isGovtEmployeeChild || data.isEmployeeChild || false,
                    data.parentEmployeeName || null,
                    data.parentPfNumber || null,
                    data.studyCertificateDoc || null
                ]);
                break;
                
            case 'student_below_ssc':
                await connection.query(`
                    INSERT INTO student_below_ssc (
                        application_id, door_street, village_town, mandal_district,
                        pincode, via, depot, school_name, class_studying,
                        is_govt_employee_child, parent_employee_name, parent_pf_number
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    applicationId,
                    data.doorStreet || null,
                    data.villageTown || null,
                    data.mandalDistrict || null,
                    data.pincode || null,
                    data.via || null,
                    data.depot || null,
                    data.schoolName || null,
                    data.classStudying || null,
                    data.isGovtEmployeeChild || data.isEmployeeChild || false,
                    data.parentEmployeeName || null,
                    data.parentPfNumber || null
                ]);
                break;
                
            case 'citizen':
                await connection.query(`
                    INSERT INTO citizen_applications (
                        application_id, residential_address, via, occupation,
                        depot_details, address_proof_type
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    applicationId,
                    data.residentialAddress || data.doorStreet || null,
                    data.via || null,
                    data.occupation || null,
                    data.depotDetails || null,
                    data.addressProofType || null
                ]);
                break;
                
            case 'gov_employee':
                await connection.query(`
                    INSERT INTO gov_employee_applications (
                        application_id, residential_address, office_address, designation,
                        gov_emp_id_pf, dept_ministry, office_name, employment_type,
                        appointment_date, retirement_date, pay_scale, working_district, depot_details
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    applicationId,
                    data.residentialAddress || null,
                    data.officeAddress || null,
                    data.designation || null,
                    data.govEmpIdPf || null,
                    data.deptMinistry || null,
                    data.officeName || null,
                    data.employmentType || null,
                    data.appointmentDate || null,
                    data.retirementDate || null,
                    data.payScale || null,
                    data.workingDistrict || null,
                    data.depotDetails || null
                ]);
                break;
                
            case 'non_gov_employee':
                await connection.query(`
                    INSERT INTO non_gov_employee_applications (
                        application_id, residential_address, office_address, designation,
                        employee_id, company_name, sector_type, employment_type,
                        joining_date, office_district, depot_details, monthly_income
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    applicationId,
                    data.residentialAddress || null,
                    data.officeAddress || null,
                    data.designation || null,
                    data.employeeId || null,
                    data.companyName || null,
                    data.sectorType || null,
                    data.employmentType || null,
                    data.joiningDate || null,
                    data.officeDistrict || null,
                    data.depotDetails || null,
                    data.monthlyIncome || null
                ]);
                break;
                
            case 'journalist':
                await connection.query(`
                    INSERT INTO journalist_applications (
                        application_id, residential_address, office_address, media_organization,
                        designation, press_id_number, experience_years, validity, depot_details
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    applicationId,
                    data.residentialAddress || null,
                    data.officeAddress || null,
                    data.mediaOrganization || null,
                    data.designation || null,
                    data.pressIdNumber || null,
                    data.experienceYears || null,
                    data.validity || null,
                    data.depotDetails || null
                ]);
                break;
                
            case 'ngo_worker':
                await connection.query(`
                    INSERT INTO ngo_applications (
                        application_id, residential_address, ngo_address, ngo_name,
                        ngo_registration_number, designation, experience_years, validity, depot_details,
                        date_of_appointment, date_of_retirement, scale_pay
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    applicationId,
                    data.residentialAddress || null,
                    data.ngoAddress || null,
                    data.ngoName || null,
                    data.ngoRegistrationNumber || null,
                    data.designation || null,
                    data.experienceYears || null,
                    data.validity || null,
                    data.depotDetails || null,
                    data.dateOfAppointment || null,
                    data.dateOfRetirement || null,
                    data.scalePay || null
                ]);
                break;
        }
        
        await connection.commit();
        return { success: true, applicationId };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Get application with type-specific details
export const getApplication = async (applicationId) => {
    const connection = await pool.getConnection();
    try {
        // Get base application
        const [apps] = await connection.query(
            'SELECT * FROM applications WHERE application_id = ?',
            [applicationId]
        );
        
        if (apps.length === 0) return null;
        
        const app = apps[0];
        
        // Get type-specific details
        let details = null;
        const typeTableMap = {
            'student_above_ssc': 'student_above_ssc',
            'student_below_ssc': 'student_below_ssc',
            'citizen': 'citizen_applications',
            'gov_employee': 'gov_employee_applications',
            'non_gov_employee': 'non_gov_employee_applications',
            'journalist': 'journalist_applications',
            'ngo_worker': 'ngo_applications'
        };
        
        const tableName = typeTableMap[app.application_type];
        if (tableName) {
            const [typeDetails] = await connection.query(
                `SELECT * FROM ${tableName} WHERE application_id = ?`,
                [applicationId]
            );
            if (typeDetails.length > 0) {
                details = typeDetails[0];
            }
        }
        
        return { ...app, details };
    } finally {
        connection.release();
    }
};

// Get all applications
export const getAllApplications = async (filters = {}) => {
    let query = 'SELECT * FROM applications WHERE 1=1';
    const params = [];
    
    if (filters.type) {
        query += ' AND application_type = ?';
        params.push(filters.type);
    }
    if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    if (filters.limit) {
        query += ' LIMIT ?';
        params.push(parseInt(filters.limit));
    }
    
    const [rows] = await pool.query(query, params);
    return rows;
};

// Update application status
export const updateApplicationStatus = async (applicationId, status, remarks = null) => {
    const [result] = await pool.query(
        'UPDATE applications SET status = ? WHERE application_id = ?',
        [status, applicationId]
    );
    return result.affectedRows > 0;
};

// =========================================
// OTP OPERATIONS
// =========================================

export const saveOTP = async (email, otp) => {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await pool.query(
        'INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?)',
        [email, otp, expiresAt]
    );
};

export const verifyOTP = async (email, otp) => {
    const [rows] = await pool.query(
        `SELECT * FROM otps 
         WHERE email = ? AND otp = ? AND is_used = FALSE AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [email, otp]
    );
    
    if (rows.length > 0) {
        await pool.query('UPDATE otps SET is_used = TRUE WHERE id = ?', [rows[0].id]);
        return true;
    }
    return false;
};

// =========================================
// PASS OPERATIONS
// =========================================

export const createPass = async (applicationId, holderName, fromPlace, toPlace, planMonths, amount, issueDate, expiryDate) => {
    const passNumber = 'APPTD-' + Math.floor(100000 + Math.random() * 900000);
    const ticketNumber = 'TK' + Math.floor(10000000 + Math.random() * 90000000);
    await pool.query(
        `INSERT INTO passes (pass_number, ticket_number, application_id, holder_name, from_place, to_place, plan_months, amount, issue_date, expiry_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [passNumber, ticketNumber, applicationId, holderName, fromPlace, toPlace, planMonths, amount, issueDate, expiryDate]
    );
    return { passNumber, ticketNumber };
};

export const getPassByApplication = async (applicationId) => {
    const [rows] = await pool.query(
        'SELECT * FROM passes WHERE application_id = ?',
        [applicationId]
    );
    return rows[0] || null;
};

// =========================================
// PAYMENT OPERATIONS
// =========================================

export const createPayment = async (applicationId, amount, method) => {
    const paymentId = 'PAY' + Date.now().toString(36).toUpperCase();
    await pool.query(
        `INSERT INTO payments (payment_id, application_id, amount, payment_method)
         VALUES (?, ?, ?, ?)`,
        [paymentId, applicationId, amount, method]
    );
    return paymentId;
};

export const updatePaymentStatus = async (paymentId, status, transactionId = null) => {
    await pool.query(
        `UPDATE payments SET status = ?, transaction_id = ?, paid_at = NOW()
         WHERE payment_id = ?`,
        [status, transactionId, paymentId]
    );
};

// Auto-expire passes that have passed their expiry_date
export const autoExpirePasses = async () => {
    try {
        const [result] = await pool.query(
            `UPDATE passes SET status = 'expired' WHERE status = 'active' AND expiry_date < CURDATE()`
        );
        if (result.affectedRows > 0) {
            console.log(`✅ Auto-expired ${result.affectedRows} pass(es)`);
        }
    } catch (error) {
        console.error('❌ Auto-expire passes error:', error.message);
    }
};

export default pool;

