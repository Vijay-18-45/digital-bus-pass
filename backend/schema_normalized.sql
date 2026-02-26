-- =========================================
-- APSRTC Bus Pass System - NORMALIZED Schema
-- Eliminates NULL waste with separate tables
-- =========================================

CREATE DATABASE IF NOT EXISTS bus_pass_system;
USE bus_pass_system;

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS passes;
DROP TABLE IF EXISTS student_above_ssc;
DROP TABLE IF EXISTS student_below_ssc;
DROP TABLE IF EXISTS citizen_applications;
DROP TABLE IF EXISTS gov_employee_applications;
DROP TABLE IF EXISTS non_gov_employee_applications;
DROP TABLE IF EXISTS journalist_applications;
DROP TABLE IF EXISTS ngo_applications;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS otps;
DROP TABLE IF EXISTS users;

-- =========================================
-- CORE TABLES
-- =========================================

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- OTPs table (for email verification)
CREATE TABLE otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    INDEX idx_email (email),
    INDEX idx_expires (expires_at)
);

-- =========================================
-- BASE APPLICATIONS TABLE (Common Fields Only)
-- =========================================

CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id VARCHAR(20) UNIQUE NOT NULL,
    application_type ENUM('student_above_ssc', 'student_below_ssc', 'citizen', 'gov_employee', 'non_gov_employee', 'journalist', 'ngo_worker') NOT NULL,
    
    -- Common Personal Details
    full_name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255),
    gender ENUM('Male', 'Female', 'Other'),
    date_of_birth DATE,
    aadhar_number VARCHAR(12),
    mobile VARCHAR(15) NOT NULL,
    email VARCHAR(255),
    
    -- Common Route Details
    from_place VARCHAR(255),
    to_place VARCHAR(255),
    pass_type VARCHAR(50),
    pass_duration VARCHAR(50),
    
    -- Photo
    photo LONGTEXT,
    
    -- Document Uploads
    id_card_doc LONGTEXT,
    salary_certificate_doc LONGTEXT,
    address_proof_doc LONGTEXT,
    aadhar_proof_doc LONGTEXT,
    other_doc LONGTEXT,
    
    -- Status & Timestamps
    status ENUM('pending', 'approved', 'rejected', 'processing') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_application_id (application_id),
    INDEX idx_status (status),
    INDEX idx_type (application_type)
);

-- =========================================
-- STUDENT ABOVE SSC (Type-Specific Fields)
-- =========================================

CREATE TABLE student_above_ssc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id VARCHAR(20) UNIQUE NOT NULL,
    
    -- Address
    door_street VARCHAR(255),
    village_town VARCHAR(255),
    mandal_district VARCHAR(255),
    pincode VARCHAR(10),
    
    -- Route
    via VARCHAR(255),
    depot VARCHAR(255),
    
    -- Institution Details
    institution_name VARCHAR(255),
    course_year VARCHAR(100),
    
    -- SSC Details
    ssc_board VARCHAR(100),
    ssc_year VARCHAR(4),
    ssc_htno VARCHAR(50),
    is_employee_child BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
);

-- =========================================
-- STUDENT BELOW SSC (Type-Specific Fields)
-- =========================================

CREATE TABLE student_below_ssc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id VARCHAR(20) UNIQUE NOT NULL,
    
    -- Address
    door_street VARCHAR(255),
    village_town VARCHAR(255),
    mandal_district VARCHAR(255),
    pincode VARCHAR(10),
    
    -- Route
    via VARCHAR(255),
    depot VARCHAR(255),
    
    -- School Details
    school_name VARCHAR(255),
    class_studying VARCHAR(50),
    
    FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
);

-- =========================================
-- CITIZEN APPLICATIONS (Type-Specific Fields)
-- =========================================

CREATE TABLE citizen_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id VARCHAR(20) UNIQUE NOT NULL,
    
    -- Address
    residential_address TEXT,
    
    -- Route
    boarding_point VARCHAR(255),
    via VARCHAR(255),
    
    -- Occupation
    occupation VARCHAR(100),
    
    FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
);

-- =========================================
-- GOVERNMENT EMPLOYEE (Type-Specific Fields)
-- =========================================

CREATE TABLE gov_employee_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id VARCHAR(20) UNIQUE NOT NULL,
    
    -- Address
    residential_address TEXT,
    office_address TEXT,
    
    -- Employment Details
    designation VARCHAR(100),
    gov_emp_id_pf VARCHAR(50),
    dept_ministry VARCHAR(255),
    office_name VARCHAR(255),
    employment_type VARCHAR(100),
    appointment_date DATE,
    retirement_date DATE,
    pay_scale VARCHAR(100),
    working_district VARCHAR(255),
    
    -- Route
    boarding_point VARCHAR(255),
    
    FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
);

-- =========================================
-- NON-GOVERNMENT EMPLOYEE (Type-Specific Fields)
-- =========================================

CREATE TABLE non_gov_employee_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id VARCHAR(20) UNIQUE NOT NULL,
    
    -- Address
    residential_address TEXT,
    office_address TEXT,
    
    -- Employment Details
    designation VARCHAR(100),
    employee_id VARCHAR(50),
    company_name VARCHAR(255),
    sector_type VARCHAR(100),
    employment_type VARCHAR(100),
    joining_date DATE,
    office_district VARCHAR(255),
    
    -- Route
    boarding_point VARCHAR(255),
    
    FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
);

-- =========================================
-- JOURNALIST (Type-Specific Fields)
-- =========================================

CREATE TABLE journalist_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id VARCHAR(20) UNIQUE NOT NULL,
    
    -- Address
    residential_address TEXT,
    office_address TEXT,
    
    -- Professional Details
    media_organization VARCHAR(255),
    designation VARCHAR(100),
    press_id_number VARCHAR(50),
    experience_years INT,
    
    -- Route
    validity VARCHAR(50),
    
    FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
);

-- =========================================
-- NGO WORKER (Type-Specific Fields)
-- =========================================

CREATE TABLE ngo_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id VARCHAR(20) UNIQUE NOT NULL,
    
    -- Address
    residential_address TEXT,
    ngo_address TEXT,
    
    -- NGO Details
    ngo_name VARCHAR(255),
    ngo_registration_number VARCHAR(50),
    designation VARCHAR(100),
    experience_years INT,
    date_of_appointment DATE,
    date_of_retirement DATE,
    scale_pay VARCHAR(100),
    depot_details VARCHAR(255),
    
    -- Route
    validity VARCHAR(50),
    
    FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
);

-- =========================================
-- PASSES TABLE
-- =========================================

CREATE TABLE passes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pass_id VARCHAR(20) UNIQUE NOT NULL,
    application_id VARCHAR(20) NOT NULL,
    
    -- Pass Details
    pass_type VARCHAR(50),
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    
    -- Status
    status ENUM('active', 'expired', 'cancelled', 'suspended') DEFAULT 'active',
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE,
    INDEX idx_pass_id (pass_id),
    INDEX idx_status (status)
);

-- =========================================
-- PAYMENTS TABLE
-- =========================================

CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id VARCHAR(30) UNIQUE NOT NULL,
    application_id VARCHAR(20) NOT NULL,
    
    -- Payment Details
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    
    -- Status
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE,
    INDEX idx_payment_id (payment_id),
    INDEX idx_status (status)
);

-- =========================================
-- SUCCESS MESSAGE
-- =========================================
SELECT 'Normalized schema created successfully!' AS message;
