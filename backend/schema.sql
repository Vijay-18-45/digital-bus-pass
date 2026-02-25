-- =========================================
-- APSRTC Bus Pass System Database Schema
-- =========================================

-- Create database
CREATE DATABASE IF NOT EXISTS bus_pass_system;
USE bus_pass_system;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- OTPs table (for email verification)
CREATE TABLE IF NOT EXISTS otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    INDEX idx_email (email),
    INDEX idx_expires (expires_at)
);

-- Applications table (all pass types)
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id VARCHAR(20) UNIQUE NOT NULL,
    application_type ENUM('student_above_ssc', 'student_below_ssc', 'citizen', 'gov_employee', 'non_gov_employee', 'journalist', 'ngo') NOT NULL,
    
    -- Personal Details
    full_name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255),
    gender ENUM('Male', 'Female', 'Other'),
    date_of_birth DATE,
    aadhaar_number VARCHAR(12),
    mobile VARCHAR(15) NOT NULL,
    email VARCHAR(255),
    
    -- Address Details
    door_street TEXT,
    village_town VARCHAR(255),
    mandal_district VARCHAR(255),
    pincode VARCHAR(6),
    residential_address TEXT,
    office_address TEXT,
    
    -- Route Details
    from_place VARCHAR(255),
    to_place VARCHAR(255),
    via VARCHAR(255),
    depot VARCHAR(255),
    boarding_point VARCHAR(255),
    pass_type VARCHAR(50),
    pass_duration VARCHAR(50),
    
    -- Institution/Organization Details
    institution_name VARCHAR(255),
    course_year VARCHAR(100),
    designation VARCHAR(100),
    organization_name VARCHAR(255),
    employee_id VARCHAR(50),
    office_name VARCHAR(255),
    
    -- Student specific (Above SSC)
    ssc_board VARCHAR(100),
    ssc_year VARCHAR(4),
    ssc_htno VARCHAR(50),
    is_employee_child BOOLEAN DEFAULT FALSE,
    
    -- Student specific (Below SSC)
    school_name VARCHAR(255),
    class_studying VARCHAR(50),
    
    -- Employee specific (Government)
    department VARCHAR(255),
    gov_emp_id_pf VARCHAR(50),
    appointment_date DATE,
    retirement_date DATE,
    pay_scale VARCHAR(100),
    employment_type VARCHAR(100),
    working_district_city VARCHAR(255),
    
    -- Employee specific (Non-Government)
    org_category VARCHAR(100),
    joining_date DATE,
    monthly_income VARCHAR(50),
    
    -- Journalist specific
    accreditation_no VARCHAR(50),
    media_house_name VARCHAR(255),
    
    -- NGO specific
    ngo_registration_no VARCHAR(50),
    ngo_name VARCHAR(255),
    applicant_designation_ngo VARCHAR(100),
    
    -- Citizen specific
    address_proof_type VARCHAR(100),
    
    -- Photo (base64)
    photo LONGTEXT,
    
    -- Document uploads (base64 or file paths)
    aadhar_proof LONGTEXT,
    address_proof LONGTEXT,
    gov_id_card LONGTEXT,
    salary_certificate LONGTEXT,
    company_id_card LONGTEXT,
    employment_certificate LONGTEXT,
    accreditation_card LONGTEXT,
    ngo_registration_doc LONGTEXT,
    
    -- Status
    status ENUM('pending', 'approved', 'rejected', 'payment_pending', 'completed') DEFAULT 'pending',
    remarks TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_type (application_type),
    INDEX idx_email (email),
    INDEX idx_mobile (mobile)
);

-- Passes table
CREATE TABLE IF NOT EXISTS passes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pass_number VARCHAR(20) UNIQUE NOT NULL,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    application_id VARCHAR(20) NOT NULL,
    
    -- Pass holder details
    holder_name VARCHAR(255) NOT NULL,
    institution_name VARCHAR(255),
    from_place VARCHAR(255) NOT NULL,
    to_place VARCHAR(255) NOT NULL,
    photo LONGTEXT,
    
    -- Plan details
    plan_months INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    
    -- Validity
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    is_renewal BOOLEAN DEFAULT FALSE,
    
    -- Status
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_pass_number (pass_number),
    INDEX idx_status (status),
    INDEX idx_expiry (expiry_date)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id VARCHAR(50) UNIQUE NOT NULL,
    pass_id INT,
    application_id VARCHAR(20),
    
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('upi', 'card', 'netbanking', 'wallet') DEFAULT 'upi',
    payment_status ENUM('pending', 'success', 'failed', 'refunded') DEFAULT 'pending',
    transaction_id VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    FOREIGN KEY (pass_id) REFERENCES passes(id),
    INDEX idx_payment_id (payment_id),
    INDEX idx_status (payment_status)
);

-- Clean up expired OTPs (run periodically)
-- DELETE FROM otps WHERE expires_at < NOW() OR is_used = TRUE;
