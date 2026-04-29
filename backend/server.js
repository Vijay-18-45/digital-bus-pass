import dotenv from "dotenv";
dotenv.config(); // MUST be first before any env var usage

import express from "express";
import cors from "cors";
import twilio from "twilio";
import nodemailer from "nodemailer";
import pool, { testConnection, initializeDatabase, createApplication, getApplication, getAllApplications, updateApplicationStatus, autoExpirePasses } from "./db_normalized.js";
import { adminRouter, govAdminRouter, initializeAdmin } from "./adminRoutes.js";
import { sendSubmissionMail } from "./utils/sendApprovalMail.js";
import { sendSubmissionSMS } from "./utils/sendSMS.js";

const app = express();
app.use(express.json({ limit: '10mb' })); // Increased for photo uploads
app.use(cors());

const PORT = process.env.PORT || 5000;

app.use('/api/admin', adminRouter);
app.use('/api/gov-admin', govAdminRouter);

// Twilio client (initialized after dotenv.config)
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;

console.log('✅ Twilio configured with phone:', TWILIO_PHONE);

// Email transporter for email OTP
const emailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Generate unique IDs
const generateApplicationId = () => "APP" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
const generatePassNumber = () => "APPTD-" + Math.floor(100000 + Math.random() * 900000);
const generateTicketNumber = () => "TK" + Math.floor(10000000 + Math.random() * 90000000);
const generatePaymentId = () => "PAY" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 6).toUpperCase();
const PLAN_PRICING = {
  1: 20,
  2: 30,
  3: 40
};

const getInstitutionNameForApplication = async (applicationId, applicationType) => {
  if (!applicationId || !applicationType) return null;

  if (applicationType === "student_above_ssc") {
    const [rows] = await pool.query(
      "SELECT institution_name FROM student_above_ssc WHERE application_id = ? LIMIT 1",
      [applicationId]
    );
    return rows[0]?.institution_name || null;
  }

  if (applicationType === "student_below_ssc") {
    const [rows] = await pool.query(
      "SELECT school_name FROM student_below_ssc WHERE application_id = ? LIMIT 1",
      [applicationId]
    );
    return rows[0]?.school_name || null;
  }

  if (applicationType === "gov_employee") {
    const [rows] = await pool.query(
      "SELECT office_name FROM gov_employee_applications WHERE application_id = ? LIMIT 1",
      [applicationId]
    );
    return rows[0]?.office_name || null;
  }

  if (applicationType === "non_gov_employee") {
    const [rows] = await pool.query(
      "SELECT company_name FROM non_gov_employee_applications WHERE application_id = ? LIMIT 1",
      [applicationId]
    );
    return rows[0]?.company_name || null;
  }

  if (applicationType === "journalist") {
    const [rows] = await pool.query(
      "SELECT media_organization FROM journalist_applications WHERE application_id = ? LIMIT 1",
      [applicationId]
    );
    return rows[0]?.media_organization || null;
  }

  if (applicationType === "ngo_worker") {
    const [rows] = await pool.query(
      "SELECT ngo_name FROM ngo_applications WHERE application_id = ? LIMIT 1",
      [applicationId]
    );
    return rows[0]?.ngo_name || null;
  }

  return null;
};

// ==================== ROUTES ====================

// Test route
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "APSRTC Bus Pass API Server Running" });
});

// Health check
app.get("/health", async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    server: "running",
    database: dbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

// ==================== OTP ROUTES (Twilio SMS) ====================

// Send OTP via SMS or Email
app.post("/send-sms-otp", async (req, res) => {
  let { phone, email, loginMethod } = req.body;

  // Determine identifier based on login method
  let identifier;
  
  if (loginMethod === 'email') {
    if (!email) {
      return res.status(400).json({ message: "Email address is required" });
    }
    identifier = email.toLowerCase().trim();
  } else {
    if (!phone) {
      return res.status(400).json({ message: "Mobile number is required" });
    }
    // Normalize to E.164 format (assume India +91 if no country code)
    if (!phone.startsWith("+")) {
      phone = "+91" + phone.replace(/^0+/, "");
    }
    identifier = phone;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    // Delete any existing OTPs for this identifier
    await pool.query("DELETE FROM otps WHERE identifier = ?", [identifier]);

    // Store OTP in database
    await pool.query(
      "INSERT INTO otps (identifier, otp, expires_at) VALUES (?, ?, ?)",
      [identifier, otp, expiresAt]
    );

    if (loginMethod === 'email') {
      // Send OTP via Email
      await emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "APSRTC Bus Pass - Your OTP Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #e31e24;">APSRTC Bus Pass Portal</h2>
            <p>Your OTP verification code is:</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${otp}</span>
            </div>
            <p style="color: #666; font-size: 14px;">This code is valid for 10 minutes. Do not share it with anyone.</p>
          </div>
        `
      });
      console.log(`✅ OTP sent to email ${email}: ${otp}`);
    } else {
      // Send SMS via Twilio
      await twilioClient.messages.create({
        body: `Your APSRTC Bus Pass OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`,
        from: TWILIO_PHONE,
        to: phone
      });
      console.log(`✅ OTP sent to ${phone}: ${otp}`);
    }

    // Create or update user
    if (loginMethod === 'email') {
      await pool.query(
        "INSERT INTO users (email) VALUES (?) ON DUPLICATE KEY UPDATE last_login = CURRENT_TIMESTAMP",
        [email]
      );
    } else {
      await pool.query(
        "INSERT INTO users (phone) VALUES (?) ON DUPLICATE KEY UPDATE last_login = CURRENT_TIMESTAMP",
        [phone]
      );
    }

    res.json({ message: "OTP sent successfully" });

  } catch (error) {
    console.error("Send OTP Error:", error.message);
    res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
});

// Verify OTP (SMS or Email)
app.post("/verify-sms-otp", async (req, res) => {
  let { phone, email, otp, loginMethod } = req.body;

  // Determine identifier
  let identifier;
  
  if (loginMethod === 'email') {
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    identifier = email.toLowerCase().trim();
  } else {
    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP are required" });
    }
    // Normalize phone
    if (!phone.startsWith("+")) {
      phone = "+91" + phone.replace(/^0+/, "");
    }
    identifier = phone;
  }

  try {
    const [rows] = await pool.query(
      "SELECT * FROM otps WHERE identifier = ? AND otp = ? AND expires_at > NOW() AND is_used = FALSE",
      [identifier, otp]
    );

    if (rows.length > 0) {
      // Mark OTP as used
      await pool.query("UPDATE otps SET is_used = TRUE WHERE id = ?", [rows[0].id]);

      // Update user last login
      if (loginMethod === 'email') {
        await pool.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE email = ? OR phone = ?", [identifier, identifier]);
      } else {
        await pool.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE phone = ?", [phone]);
      }

      return res.json({ 
        message: "OTP verified successfully", 
        phone: phone || null,
        email: email || null,
        role: 'user',
        adminData: null
      });
    } else {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Verification failed" });
  }
});

// ==================== APPLICATION ROUTES ====================

// Submit application (for all form types) - NORMALIZED
app.post("/api/applications", async (req, res) => {
  const data = req.body;

  // Debug logging
  console.log('=== RECEIVED APPLICATION DATA ===');
  console.log('applicationType:', data.applicationType);
  console.log('fullName:', data.fullName);
  console.log('mobileNumber:', data.mobileNumber);
  console.log('mobile:', data.mobile);
  console.log('All data keys:', Object.keys(data));
  console.log('================================');

  // Detailed validation with specific error messages
  const missingFields = [];
  if (!data.applicationType) missingFields.push('Application Type');
  if (!data.fullName || data.fullName.trim() === '') missingFields.push('Full Name');
  if (!data.mobileNumber && !data.mobile) missingFields.push('Mobile Number');
  if (!data.email || data.email.trim() === '') missingFields.push('Email');

  // Aadhaar required for all except citizen (optional for citizen who may use other ID)
  const aadhaarValue = data.aadharNumber || data.aadhaarNumber;
  if (data.applicationType !== 'citizen' && (!aadhaarValue || aadhaarValue.trim() === '')) {
    missingFields.push('Aadhaar Number');
  }

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: `Required fields missing: ${missingFields.join(', ')}`,
      missingFields: missingFields
    });
  }

  try {
    const result = await createApplication(data);

    // Send submission confirmation email
    if (data.email) {
      try {
        await sendSubmissionMail({
          to: data.email,
          fullName: data.fullName,
          applicationId: result.applicationId,
          applicationType: data.applicationType,
          fromPlace: data.fromPlace,
          toPlace: data.toPlace
        });
        console.log(`✅ Submission email sent to ${data.email}`);
      } catch (emailErr) {
        console.error('⚠️ Submission email failed:', emailErr.message);
      }
    }

    // Send submission confirmation SMS
    const mobile = data.mobileNumber || data.mobile;
    if (mobile) {
      try {
        await sendSubmissionSMS({
          to: mobile,
          fullName: data.fullName,
          applicationId: result.applicationId
        });
        console.log(`✅ Submission SMS sent to ${mobile}`);
      } catch (smsErr) {
        console.error('⚠️ Submission SMS failed:', smsErr.message);
      }
    }

    res.status(201).json({
      message: "Application submitted successfully",
      applicationId: result.applicationId,
      status: "pending"
    });
  } catch (error) {
    console.error("Submit Application Error:", error);
    res.status(500).json({ message: "Failed to submit application", error: error.message });
  }
});

// Get application by Renewal ID (for payment flow)
app.get("/api/applications/renewal/:renewalId", async (req, res) => {
  const { renewalId } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT a.application_id, a.application_type, a.full_name, a.father_name, a.gender, a.date_of_birth,
              a.aadhar_number, a.mobile, a.email, a.from_place, a.to_place, a.pass_type, a.pass_duration,
              a.photo, a.status, a.renewal_id, a.created_at,
              CASE 
                WHEN a.application_type = 'student_above_ssc' THEN (SELECT institution_name FROM student_above_ssc s WHERE s.application_id = a.application_id LIMIT 1)
                WHEN a.application_type = 'student_below_ssc' THEN (SELECT school_name FROM student_below_ssc s WHERE s.application_id = a.application_id LIMIT 1)
                WHEN a.application_type = 'gov_employee' THEN (SELECT office_name FROM gov_employee_applications g WHERE g.application_id = a.application_id LIMIT 1)
                WHEN a.application_type = 'non_gov_employee' THEN (SELECT company_name FROM non_gov_employee_applications n WHERE n.application_id = a.application_id LIMIT 1)
                WHEN a.application_type = 'journalist' THEN (SELECT media_organization FROM journalist_applications j WHERE j.application_id = a.application_id LIMIT 1)
                WHEN a.application_type = 'ngo_worker' THEN (SELECT ngo_name FROM ngo_applications n WHERE n.application_id = a.application_id LIMIT 1)
                ELSE NULL
              END AS institution_name
       FROM applications a
       WHERE a.renewal_id = ? AND a.status = 'approved'`,
      [renewalId.trim().toUpperCase()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "No approved application found with this Renewal ID" });
    }

    res.json({ success: true, application: rows[0] });
  } catch (error) {
    console.error("Get by Renewal ID Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch application" });
  }
});

// Get application by ID - NORMALIZED (joins with type-specific table)
app.get("/api/applications/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const application = await getApplication(id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json(application);
  } catch (error) {
    console.error("Get Application Error:", error);
    res.status(500).json({ message: "Failed to fetch application" });
  }
});

// Get applications by email or mobile (for tracing) - COMPREHENSIVE with fallback
app.post("/api/applications/trace", async (req, res) => {
  const { identifier, dateOfBirth } = req.body;
  console.log("🔍 TRACE REQUEST - Identifier:", identifier, "DOB:", dateOfBirth);

  try {
    // Account for timezone shifts - dates might be off by ±1 day due to UTC storage
    // This query uses DATE arithmetic to handle timezone variations
    const [rows] = await pool.query(
      `SELECT a.application_id, a.application_type, a.full_name, a.father_name, a.gender, 
              a.date_of_birth, a.mobile, a.email, a.from_place, a.to_place, a.status, 
              a.renewal_id, a.created_at, a.photo, a.aadhar_number
       FROM applications a
       WHERE (a.mobile = ? OR a.aadhar_number = ? OR a.email = ?) AND 
             ABS(DATEDIFF(DATE(a.date_of_birth), STR_TO_DATE(?, '%Y-%m-%d'))) <= 1`,
      [identifier, identifier, identifier, dateOfBirth]
    );

    console.log("📊 Query Results:", rows.length, "applications found");
    if (rows.length > 0) {
      console.log("📝 First result:", { full_name: rows[0].full_name, mobile: rows[0].mobile, dob: rows[0].date_of_birth });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "No applications found" });
    }

    // For each application, enrich with institution name and pass/payment data
    const enriched = await Promise.all(rows.map(async (app) => {
      // Fetch institution name based on application type
      let institution_name = null;
      
      if (app.application_type === 'student_above_ssc') {
        const [inst] = await pool.query(
          `SELECT institution_name FROM student_above_ssc WHERE application_id = ? LIMIT 1`,
          [app.application_id]
        );
        institution_name = inst[0]?.institution_name || null;
      } else if (app.application_type === 'student_below_ssc') {
        const [inst] = await pool.query(
          `SELECT school_name FROM student_below_ssc WHERE application_id = ? LIMIT 1`,
          [app.application_id]
        );
        institution_name = inst[0]?.school_name || null;
      } else if (app.application_type === 'gov_employee') {
        const [inst] = await pool.query(
          `SELECT office_name FROM gov_employee_applications WHERE application_id = ? LIMIT 1`,
          [app.application_id]
        );
        institution_name = inst[0]?.office_name || null;
      } else if (app.application_type === 'non_gov_employee') {
        const [inst] = await pool.query(
          `SELECT company_name FROM non_gov_employee_applications WHERE application_id = ? LIMIT 1`,
          [app.application_id]
        );
        institution_name = inst[0]?.company_name || null;
      } else if (app.application_type === 'journalist') {
        const [inst] = await pool.query(
          `SELECT media_organization FROM journalist_applications WHERE application_id = ? LIMIT 1`,
          [app.application_id]
        );
        institution_name = inst[0]?.media_organization || null;
      } else if (app.application_type === 'ngo_worker') {
        const [inst] = await pool.query(
          `SELECT ngo_name FROM ngo_applications WHERE application_id = ? LIMIT 1`,
          [app.application_id]
        );
        institution_name = inst[0]?.ngo_name || null;
      }

      // Fetch latest pass - using actual column names
      const [passes] = await pool.query(
        `SELECT pass_number, ticket_number, issue_date, expiry_date, status FROM passes 
         WHERE application_id = ? ORDER BY created_at DESC LIMIT 1`,
        [app.application_id]
      );

      // Fetch latest payment
      const [payments] = await pool.query(
        `SELECT payment_id, amount, status, paid_at FROM payments 
         WHERE application_id = ? ORDER BY created_at DESC LIMIT 1`,
        [app.application_id]
      );

      const latestPass = passes[0] || null;
      const latestPayment = payments[0] || null;

      // Return enriched data with all fields properly mapped
      const enrichedResult = {
        application_id: app.application_id,
        application_type: app.application_type,
        full_name: app.full_name,
        father_name: app.father_name,
        gender: app.gender,
        date_of_birth: app.date_of_birth,
        mobile: app.mobile,
        email: app.email,
        from_place: app.from_place,
        to_place: app.to_place,
        status: app.status,
        renewal_id: app.renewal_id || null,
        created_at: app.created_at,
        photo: app.photo || null,
        aadhar_number: app.aadhar_number,
        institution_name: institution_name,
        pass: latestPass ? {
          passId: latestPass.pass_number,
          ticketNumber: latestPass.ticket_number,
          validFrom: latestPass.issue_date,
          validUntil: latestPass.expiry_date,
          status: latestPass.status,
          daysRemaining: latestPass.expiry_date ? Math.max(0, Math.floor((new Date(latestPass.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))) : 0
        } : null,
        payment: latestPayment ? {
          paymentId: latestPayment.payment_id,
          amount: latestPayment.amount,
          status: latestPayment.status,
          paidAt: latestPayment.paid_at
        } : null
      };

      console.log("✅ Enriched Result:", enrichedResult);
      return enrichedResult;
    }));

    console.log("📤 Final Response Count:", enriched.length);
    res.json(enriched);
  } catch (error) {
    console.error("❌ Trace Application Error:", error);
    res.status(500).json({ message: "Failed to trace applications" });
  }
});

// Get single application with all details (for UpdateDetails page)
app.get("/api/applications/details/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT a.application_id, a.application_type, a.full_name, a.father_name, a.gender,
              a.date_of_birth, a.mobile, a.email, a.from_place, a.to_place, a.status, a.renewal_id,
              a.photo, a.created_at, a.updated_at,
              CASE 
                WHEN a.application_type = 'student_above_ssc' THEN (SELECT institution_name FROM student_above_ssc s WHERE s.application_id = a.application_id LIMIT 1)
                WHEN a.application_type = 'student_below_ssc' THEN (SELECT school_name FROM student_below_ssc s WHERE s.application_id = a.application_id LIMIT 1)
                WHEN a.application_type = 'gov_employee' THEN (SELECT office_name FROM gov_employee_applications g WHERE g.application_id = a.application_id LIMIT 1)
                WHEN a.application_type = 'non_gov_employee' THEN (SELECT company_name FROM non_gov_employee_applications n WHERE n.application_id = a.application_id LIMIT 1)
                WHEN a.application_type = 'journalist' THEN (SELECT media_organization FROM journalist_applications j WHERE j.application_id = a.application_id LIMIT 1)
                WHEN a.application_type = 'ngo_worker' THEN (SELECT ngo_name FROM ngo_applications n WHERE n.application_id = a.application_id LIMIT 1)
                ELSE NULL
              END AS institution_name
       FROM applications a
       WHERE a.application_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({ success: true, application: rows[0] });
  } catch (error) {
    console.error("Get Application Details Error:", error);
    res.status(500).json({ message: "Failed to fetch application details" });
  }
});

// Update application details
app.put("/api/applications/:id", async (req, res) => {
  const { id } = req.params;
  const { full_name, mobile, email, from_place, to_place } = req.body;

  try {
    // Update main application table
    const updateFields = [];
    const values = [];

    if (full_name !== undefined) {
      updateFields.push('full_name = ?');
      values.push(full_name);
    }
    if (mobile !== undefined) {
      updateFields.push('mobile = ?');
      values.push(mobile);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      values.push(email);
    }
    if (from_place !== undefined) {
      updateFields.push('from_place = ?');
      values.push(from_place);
    }
    if (to_place !== undefined) {
      updateFields.push('to_place = ?');
      values.push(to_place);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(id);

    const [result] = await pool.query(
      `UPDATE applications SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE application_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({ success: true, message: "Application updated successfully" });
  } catch (error) {
    console.error("Update Application Error:", error);
    res.status(500).json({ message: "Failed to update application" });
  }
});

// ==================== PASS ROUTES ====================

// Create pass (after payment)
app.post("/api/passes", async (req, res) => {
  const { applicationId, planMonths, amount, isRenewal } = req.body;

  try {
    // Get application details
    const [apps] = await pool.query(
      "SELECT * FROM applications WHERE application_id = ?",
      [applicationId]
    );

    if (apps.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    const app = apps[0];
    const institutionName =
      (await getInstitutionNameForApplication(app.application_id, app.application_type)) ||
      app.institution_name ||
      null;
    const [existingPassRows] = await pool.query(
      `SELECT id, pass_number, expiry_date
       FROM passes
       WHERE application_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      [applicationId]
    );

    const existingPass = existingPassRows[0] || null;
    const passNumber = existingPass?.pass_number || generatePassNumber();
    const ticketNumber = generateTicketNumber();
    const issueDate = new Date();
    const renewalBaseDate = existingPass?.expiry_date
      ? new Date(existingPass.expiry_date)
      : issueDate;
    const expiryStartDate = renewalBaseDate > issueDate ? renewalBaseDate : issueDate;
    const expiryDate = new Date(expiryStartDate);
    expiryDate.setMonth(expiryDate.getMonth() + planMonths);

    if (existingPass) {
      await pool.query(
        `UPDATE passes
         SET ticket_number = ?, holder_name = ?, institution_name = ?, from_place = ?, to_place = ?, photo = ?,
             plan_months = ?, amount = ?, issue_date = ?, expiry_date = ?, is_renewal = ?, status = 'active'
         WHERE id = ?`,
        [
          ticketNumber,
          app.full_name,
          institutionName,
          app.from_place,
          app.to_place,
          app.photo,
          planMonths,
          amount,
          issueDate,
          expiryDate,
          isRenewal || false,
          existingPass.id
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO passes (
          pass_number, ticket_number, application_id,
          holder_name, institution_name, from_place, to_place, photo,
          plan_months, amount, issue_date, expiry_date, is_renewal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          passNumber, ticketNumber, applicationId,
          app.full_name, institutionName, app.from_place, app.to_place, app.photo,
          planMonths, amount, issueDate, expiryDate, isRenewal || false
        ]
      );
    }

    // Keep application status in valid enum values
    await pool.query(
      "UPDATE applications SET status = 'approved' WHERE application_id = ? AND status IN ('pending', 'processing')",
      [applicationId]
    );

    res.status(201).json({
      message: "Pass created successfully",
      passNumber,
      ticketNumber,
      issueDate: issueDate.toISOString(),
      expiryDate: expiryDate.toISOString()
    });
  } catch (error) {
    console.error("Create Pass Error:", error);
    res.status(500).json({ message: "Failed to create pass" });
  }
});

// Get pass by pass number
app.get("/api/passes/:passNumber", async (req, res) => {
  const { passNumber } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT p.*, a.full_name, a.father_name, a.gender, a.date_of_birth, a.mobile, a.email,
              a.application_type, a.renewal_id,
              COALESCE(p.photo, a.photo) AS photo,
              CASE 
                WHEN a.application_type = 'student_above_ssc' THEN (SELECT institution_name FROM student_above_ssc s WHERE s.application_id = a.application_id LIMIT 1)
                WHEN a.application_type = 'student_below_ssc' THEN (SELECT school_name FROM student_below_ssc s WHERE s.application_id = a.application_id LIMIT 1)
                WHEN a.application_type = 'gov_employee' THEN (SELECT office_name FROM gov_employee_applications g WHERE g.application_id = a.application_id LIMIT 1)
                WHEN a.application_type = 'non_gov_employee' THEN (SELECT company_name FROM non_gov_employee_applications n WHERE n.application_id = a.application_id LIMIT 1)
                WHEN a.application_type = 'journalist' THEN (SELECT media_organization FROM journalist_applications j WHERE j.application_id = a.application_id LIMIT 1)
                WHEN a.application_type = 'ngo_worker' THEN (SELECT ngo_name FROM ngo_applications n WHERE n.application_id = a.application_id LIMIT 1)
                ELSE NULL
              END AS linked_institution_name
       FROM passes p
       JOIN applications a ON p.application_id = a.application_id
       WHERE p.pass_number = ?`,
      [passNumber]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Pass not found" });
    }

    const pass = rows[0];
    res.json({
      ...pass,
      institution_name: pass.linked_institution_name || pass.institution_name || null,
      holder_name: pass.holder_name || pass.full_name || null
    });
  } catch (error) {
    console.error("Get Pass Error:", error);
    res.status(500).json({ message: "Failed to fetch pass" });
  }
});

// Get all passes for a user (by email or mobile identifier)
app.get("/api/passes/user/:identifier", async (req, res) => {
  const rawIdentifier = decodeURIComponent(req.params.identifier || "").trim();

  if (!rawIdentifier) {
    return res.status(400).json({ message: "User identifier is required" });
  }

  const normalizedDigits = rawIdentifier.replace(/\D/g, "");
  const mobileCandidate = normalizedDigits.length >= 10 ? normalizedDigits.slice(-10) : rawIdentifier;

  try {
    const [rows] = await pool.query(
      `SELECT p.*, a.full_name, a.father_name, a.gender, a.date_of_birth, a.mobile, a.email,
              a.application_type, a.renewal_id,
              COALESCE(p.photo, a.photo) AS photo,
              CASE 
                WHEN a.application_type = 'student_above_ssc' THEN (SELECT institution_name FROM student_above_ssc s WHERE s.application_id = a.application_id LIMIT 1)
                WHEN a.application_type = 'student_below_ssc' THEN (SELECT school_name FROM student_below_ssc s WHERE s.application_id = a.application_id LIMIT 1)
                WHEN a.application_type = 'gov_employee' THEN (SELECT office_name FROM gov_employee_applications g WHERE g.application_id = a.application_id LIMIT 1)
                WHEN a.application_type = 'non_gov_employee' THEN (SELECT company_name FROM non_gov_employee_applications n WHERE n.application_id = a.application_id LIMIT 1)
                WHEN a.application_type = 'journalist' THEN (SELECT media_organization FROM journalist_applications j WHERE j.application_id = a.application_id LIMIT 1)
                WHEN a.application_type = 'ngo_worker' THEN (SELECT ngo_name FROM ngo_applications n WHERE n.application_id = a.application_id LIMIT 1)
                ELSE NULL
              END AS linked_institution_name
       FROM passes p 
       JOIN applications a ON p.application_id = a.application_id 
       WHERE a.email = ?
          OR a.mobile = ?
          OR a.mobile = ?
          OR RIGHT(
               REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(a.mobile, '+', ''), '-', ''), ' ', ''), '(', ''), ')', ''),
               10
             ) = ?
       ORDER BY p.created_at DESC`,
      [rawIdentifier, rawIdentifier, mobileCandidate, mobileCandidate]
    );

    const normalized = rows.map((row) => ({
      ...row,
      institution_name: row.linked_institution_name || row.institution_name || null,
      holder_name: row.holder_name || row.full_name || null
    }));

    res.json(normalized);
  } catch (error) {
    console.error("Get User Passes Error:", error);
    res.status(500).json({ message: "Failed to fetch passes" });
  }
});

// One-time utility: backfill older passes with latest application details
app.post("/api/passes/backfill-details", async (req, res) => {
  try {
    const [passes] = await pool.query(
      `SELECT p.id, p.application_id, p.holder_name, p.institution_name, p.from_place, p.to_place, p.photo,
              a.full_name, a.from_place AS app_from_place, a.to_place AS app_to_place, a.photo AS app_photo,
              a.application_type
       FROM passes p
       JOIN applications a ON p.application_id = a.application_id`
    );

    let updated = 0;

    for (const pass of passes) {
      const institutionName =
        (await getInstitutionNameForApplication(pass.application_id, pass.application_type)) ||
        pass.institution_name ||
        null;

      const nextHolder = pass.holder_name || pass.full_name || null;
      const nextFrom = pass.from_place || pass.app_from_place || null;
      const nextTo = pass.to_place || pass.app_to_place || null;
      const nextPhoto = pass.photo || pass.app_photo || null;

      const shouldUpdate =
        !pass.holder_name ||
        !pass.institution_name ||
        !pass.from_place ||
        !pass.to_place ||
        !pass.photo;

      if (!shouldUpdate) {
        continue;
      }

      await pool.query(
        `UPDATE passes
         SET holder_name = ?, institution_name = ?, from_place = ?, to_place = ?, photo = ?
         WHERE id = ?`,
        [nextHolder, institutionName, nextFrom, nextTo, nextPhoto, pass.id]
      );

      updated += 1;
    }

    res.json({
      success: true,
      message: "Pass backfill completed",
      total: passes.length,
      updated
    });
  } catch (error) {
    console.error("Backfill Pass Details Error:", error);
    res.status(500).json({ success: false, message: "Failed to backfill pass details" });
  }
});

// ==================== PAYMENT ROUTES ====================

const getPaymentById = async (paymentId) => {
  const [normalRows] = await pool.query(
    "SELECT * FROM payments WHERE payment_id = ? LIMIT 1",
    [paymentId]
  );
  if (normalRows.length > 0) {
    return { payment: normalRows[0], tableName: "payments" };
  }

  const [renewalRows] = await pool.query(
    "SELECT * FROM renewal_payments WHERE payment_id = ? LIMIT 1",
    [paymentId]
  );
  if (renewalRows.length > 0) {
    return { payment: renewalRows[0], tableName: "renewal_payments" };
  }

  return { payment: null, tableName: null };
};

// Create payment (initiates a pending payment record)
app.post("/api/payments", async (req, res) => {
  const { applicationId, amount, paymentMethod, planMonths, isRenewal } = req.body;

  if (!applicationId || !amount || !planMonths) {
    return res.status(400).json({ message: "applicationId, amount, and planMonths are required" });
  }

  const months = Number(planMonths);
  const requestedAmount = Number(amount);
  const expectedAmount = PLAN_PRICING[months];

  if (!expectedAmount) {
    return res.status(400).json({
      success: false,
      message: "Invalid plan. Allowed plans are 1, 2, or 3 months."
    });
  }

  if (requestedAmount !== expectedAmount) {
    return res.status(400).json({
      success: false,
      message: `Invalid amount for selected plan. ${months} month plan requires ₹${expectedAmount}.`
    });
  }

  const paymentId = generatePaymentId();

  try {
    const [existingPassRows] = await pool.query(
      `SELECT pass_number
       FROM passes
       WHERE application_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      [applicationId]
    );
    const linkedPassNumber = existingPassRows[0]?.pass_number || null;
    const isEffectiveRenewal = Boolean(isRenewal) || Boolean(linkedPassNumber);
    const targetTable = isEffectiveRenewal ? "renewal_payments" : "payments";

    await pool.query(
      `INSERT INTO ${targetTable} (payment_id, application_id, pass_number, amount, plan_months, is_renewal, payment_method, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [paymentId, applicationId, linkedPassNumber, requestedAmount, months, isEffectiveRenewal, paymentMethod || 'phonepay_qr']
    );

    res.status(201).json({
      success: true,
      message: "Payment initiated",
      paymentId,
      amount: requestedAmount,
      planMonths: months
    });
  } catch (error) {
    console.error("Create Payment Error:", error);
    res.status(500).json({ success: false, message: "Failed to initiate payment" });
  }
});

// Complete payment → mark as SUCCESS + create pass
app.post("/api/payments/:paymentId/complete", async (req, res) => {
  const { paymentId } = req.params;
  const { transactionId, paymentStatus } = req.body;

  const formatPassResponse = (passRow, appRow, paymentRow) => ({
    passNumber: passRow.pass_number,
    ticketNumber: passRow.ticket_number,
    holderName: passRow.holder_name || appRow?.full_name || null,
    from: passRow.from_place || appRow?.from_place || null,
    to: passRow.to_place || appRow?.to_place || null,
    planMonths: passRow.plan_months ?? paymentRow?.plan_months ?? 1,
    amount: passRow.amount ?? paymentRow?.amount ?? null,
    issueDate: passRow.issue_date ? new Date(passRow.issue_date).toISOString() : null,
    expiryDate: passRow.expiry_date ? new Date(passRow.expiry_date).toISOString() : null,
    isRenewal: Boolean(passRow.is_renewal ?? paymentRow?.is_renewal),
    photo: passRow.photo || appRow?.photo || null,
    renewalId: appRow?.renewal_id || null,
    applicationId: paymentRow?.application_id || appRow?.application_id || null,
    email: appRow?.email || null,
    mobile: appRow?.mobile || null,
    fatherName: appRow?.father_name || null,
    applicationType: appRow?.application_type || null,
    institutionName: passRow.institution_name || appRow?.institution_name || null
  });

  if (paymentStatus !== 'SUCCESS') {
    return res.status(400).json({
      success: false,
      message: "Payment not successful. Pass can be generated only after successful transaction."
    });
  }

  try {
    // 1. Get the payment record
    const { payment, tableName } = await getPaymentById(paymentId);

    if (!payment || !tableName) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    if (payment.status === 'completed') {
      const [apps] = await pool.query(
        "SELECT * FROM applications WHERE application_id = ?",
        [payment.application_id]
      );
      const appRow = apps[0] || null;

      const [existingPasses] = await pool.query(
        `SELECT pass_number, ticket_number, application_id, holder_name, institution_name,
                from_place, to_place, photo, plan_months, amount, issue_date, expiry_date, is_renewal
         FROM passes
         WHERE application_id = ?
         ORDER BY created_at DESC, id DESC
         LIMIT 1`,
        [payment.application_id]
      );

      if (existingPasses.length > 0) {
        return res.json({
          success: true,
          message: "Payment already completed. Returning existing pass.",
          paymentId,
          transactionId: payment.transaction_id || transactionId || null,
          pass: formatPassResponse(existingPasses[0], appRow, payment)
        });
      }
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ success: false, message: "Only pending payments can be completed" });
    }

    const expectedAmount = PLAN_PRICING[Number(payment.plan_months)];
    if (!expectedAmount || Number(payment.amount) !== expectedAmount) {
      return res.status(400).json({
        success: false,
        message: "Payment details mismatch for selected plan. Please retry payment."
      });
    }

    // 2. Mark payment as SUCCESS
    const txnId = transactionId || ("DEMO_TXN_" + Date.now().toString(36).toUpperCase());

    // 3. Get application details to create pass
    const [apps] = await pool.query(
      "SELECT * FROM applications WHERE application_id = ?",
      [payment.application_id]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: "Application not found for this payment" });
    }

    const app = apps[0];
    const institutionName =
      (await getInstitutionNameForApplication(app.application_id, app.application_type)) ||
      app.institution_name ||
      null;
    const [existingPassRows] = await pool.query(
      `SELECT id, pass_number, ticket_number, issue_date, expiry_date, is_renewal
       FROM passes
       WHERE application_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      [payment.application_id]
    );

    const existingPass = existingPassRows[0] || null;
    const passNumber = existingPass?.pass_number || payment.pass_number || generatePassNumber();
    const ticketNumber = generateTicketNumber();
    const issueDate = new Date();
    const renewalBaseDate = existingPass?.expiry_date
      ? new Date(existingPass.expiry_date)
      : issueDate;
    const expiryStartDate = renewalBaseDate > issueDate ? renewalBaseDate : issueDate;
    const expiryDate = new Date(expiryStartDate);
    expiryDate.setMonth(expiryDate.getMonth() + (payment.plan_months || 1));

    // 4. Keep pass number permanent: renewals update existing pass row instead of creating a new pass number
    if (existingPass) {
      await pool.query(
        `UPDATE passes
         SET ticket_number = ?,
             holder_name = ?,
             institution_name = ?,
             from_place = ?,
             to_place = ?,
             photo = ?,
             plan_months = ?,
             amount = ?,
             issue_date = ?,
             expiry_date = ?,
             is_renewal = ?,
             status = 'active'
         WHERE id = ?`,
        [
          ticketNumber,
          app.full_name,
          institutionName,
          app.from_place,
          app.to_place,
          app.photo,
          payment.plan_months || 1,
          payment.amount,
          issueDate,
          expiryDate,
          payment.is_renewal || false,
          existingPass.id
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO passes (
          pass_number, ticket_number, application_id,
          holder_name, institution_name, from_place, to_place, photo,
          plan_months, amount, issue_date, expiry_date, is_renewal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          passNumber,
          ticketNumber,
          payment.application_id,
          app.full_name,
          institutionName,
          app.from_place,
          app.to_place,
          app.photo,
          payment.plan_months || 1,
          payment.amount,
          issueDate,
          expiryDate,
          payment.is_renewal || false
        ]
      );
    }

    await pool.query(
      `UPDATE ${tableName}
       SET status = 'completed', transaction_id = ?, paid_at = CURRENT_TIMESTAMP, pass_number = ?
       WHERE payment_id = ?`,
      [txnId, passNumber, paymentId]
    );

    // 5. Ensure application status is in a valid, payable state
    await pool.query(
      "UPDATE applications SET status = 'approved' WHERE application_id = ? AND status IN ('pending', 'processing')",
      [payment.application_id]
    );

    res.json({
      success: true,
      message: "Payment completed and pass generated",
      paymentId,
      transactionId: txnId,
      pass: formatPassResponse(
        {
          pass_number: passNumber,
          ticket_number: ticketNumber,
          application_id: payment.application_id,
          holder_name: app.full_name,
          institution_name: institutionName,
          from_place: app.from_place,
          to_place: app.to_place,
          photo: app.photo,
          plan_months: payment.plan_months,
          amount: payment.amount,
          issue_date: issueDate,
          expiry_date: expiryDate,
          is_renewal: payment.is_renewal
        },
        app,
        payment
      )
    });
  } catch (error) {
    console.error("Complete Payment Error:", error);
    res.status(500).json({ success: false, message: "Failed to complete payment" });
  }
});

// Fail payment
app.post("/api/payments/:paymentId/fail", async (req, res) => {
  const { paymentId } = req.params;

  try {
    const { payment, tableName } = await getPaymentById(paymentId);

    if (!payment || !tableName) {
      return res.status(404).json({ success: false, message: "Payment not found or not pending" });
    }

    const [result] = await pool.query(
      `UPDATE ${tableName} SET status = 'failed' WHERE payment_id = ? AND status = 'pending'`,
      [paymentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Payment not found or not pending" });
    }

    res.json({ success: true, message: "Payment marked as failed", paymentId });
  } catch (error) {
    console.error("Fail Payment Error:", error);
    res.status(500).json({ success: false, message: "Failed to update payment status" });
  }
});

// Get payment status
app.get("/api/payments/:paymentId/status", async (req, res) => {
  const { paymentId } = req.params;

  try {
    const { payment, tableName } = await getPaymentById(paymentId);

    if (!payment || !tableName) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    res.json({
      success: true,
      paymentType: tableName === "renewal_payments" ? "renewal" : "initial",
      payment: {
        payment_id: payment.payment_id,
        application_id: payment.application_id,
        pass_number: payment.pass_number,
        amount: payment.amount,
        plan_months: payment.plan_months,
        status: payment.status,
        transaction_id: payment.transaction_id,
        paid_at: payment.paid_at,
        created_at: payment.created_at
      }
    });
  } catch (error) {
    console.error("Get Payment Status Error:", error);
    res.status(500).json({ success: false, message: "Failed to get payment status" });
  }
});

// ==================== SERVER START ====================

const startServer = async () => {
  // Test database connection
  const dbConnected = await testConnection();

  if (dbConnected) {
    // Initialize database tables
    await initializeDatabase();
    // Initialize Admin credentials
    await initializeAdmin();
    
    // Pass Automation: Run every hour to check for expired passes
    autoExpirePasses(); 
    setInterval(autoExpirePasses, 3600000); 
    console.log("🕒 Pass Automation Service: ACTIVE (Interval: 1 hour)");
  } else {
    console.warn("⚠️ Starting server without database connection. Some features may not work.");
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();