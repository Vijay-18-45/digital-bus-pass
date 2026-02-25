import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";
import pool, { testConnection, initializeDatabase, createApplication, getApplication, getAllApplications, updateApplicationStatus } from "./db_normalized.js";
import { adminRouter, initializeAdmin } from "./adminRoutes.js";

dotenv.config();

// n8n Webhook URL (Production)
const N8N_WEBHOOK_URL = "https://arise09876567.app.n8n.cloud/webhook/b9ba466d-cadb-46a2-b131-1b42208211dd";

// Function to send data to n8n webhook
const sendToWebhook = async (data) => {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (response.ok) {
      console.log('✅ Data sent to n8n webhook successfully');
      return true;
    } else {
      console.error('❌ Webhook response error:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to send data to n8n webhook:', error.message);
    return false;
  }
};

const app = express();
app.use(express.json({ limit: '10mb' })); // Increased for photo uploads
app.use(cors());

const PORT = process.env.PORT || 5000;

app.use('/api/admin', adminRouter);

// Create transporter
const transporter = nodemailer.createTransport({
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

// ==================== OTP ROUTES ====================

// Send OTP Email
app.post("/send-email", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    // Delete any existing OTPs for this email
    await pool.query("DELETE FROM otps WHERE email = ?", [email]);

    // Store OTP in database
    await pool.query(
      "INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?)",
      [email, otp, expiresAt]
    );

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "APSRTC Bus Pass - Your OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #e31e24;">APSRTC Digital Bus Pass</h2>
          <p>Your One-Time Password (OTP) for verification is:</p>
          <h1 style="color: #333; letter-spacing: 5px; font-size: 32px;">${otp}</h1>
          <p style="color: #666;">This OTP is valid for 10 minutes.</p>
          <hr style="border: 1px solid #eee;">
          <p style="font-size: 12px; color: #999;">If you didn't request this OTP, please ignore this email.</p>
        </div>
      `
    });

    // Create or update user
    await pool.query(
      "INSERT INTO users (email) VALUES (?) ON DUPLICATE KEY UPDATE last_login = CURRENT_TIMESTAMP",
      [email]
    );

    res.json({ message: "OTP sent successfully" });

  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// Verify OTP
app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT * FROM otps WHERE email = ? AND otp = ? AND expires_at > NOW() AND is_used = FALSE",
      [email, otp]
    );

    if (rows.length > 0) {
      // Mark OTP as used
      await pool.query("UPDATE otps SET is_used = TRUE WHERE id = ?", [rows[0].id]);

      // Update user last login
      await pool.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE email = ?", [email]);

      return res.json({ message: "OTP verified successfully", email });
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
    
    // Only trigger webhook if application was successfully created
    if (result && result.applicationId) {
      const webhookData = {
        applicationId: result.applicationId,
        applicationType: data.applicationType,
        fullName: data.fullName,
        email: data.email,
        mobile: data.mobileNumber || data.mobile,
        aadharNumber: data.aadharNumber || data.aadhaarNumber,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        fromPlace: data.fromPlace,
        toPlace: data.toPlace,
        via: data.via,
        depot: data.depot,
        institutionName: data.institutionName,
        institutionAddress: data.institutionAddress,
        course: data.course,
        designation: data.designation,
        employeeId: data.employeeId,
        department: data.department,
        officeAddress: data.officeAddress,
        status: "pending",
        submittedAt: new Date().toISOString()
      };
      
      // Send to webhook after successful form submission
      console.log('📤 Triggering webhook for successful application:', result.applicationId);
      sendToWebhook(webhookData);
    }
    
    res.status(201).json({ 
      message: "Application submitted successfully", 
      applicationId: result.applicationId,
      status: "pending"
    });
  } catch (error) {
    console.error("Submit Application Error:", error);
    // Webhook NOT triggered on error - form submission failed
    res.status(500).json({ message: "Failed to submit application", error: error.message });
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

// Get applications by email or mobile (for tracing)
app.post("/api/applications/trace", async (req, res) => {
  const { identifier, dateOfBirth } = req.body;

  try {
    const [rows] = await pool.query(
      `SELECT application_id, application_type, full_name, status, from_place, to_place, created_at 
       FROM applications 
       WHERE (mobile = ? OR aadhar_number = ? OR email = ?) AND date_of_birth = ?`,
      [identifier, identifier, identifier, dateOfBirth]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No applications found" });
    }

    res.json(rows);
  } catch (error) {
    console.error("Trace Application Error:", error);
    res.status(500).json({ message: "Failed to trace applications" });
  }
});

// Update application details
app.put("/api/applications/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Build dynamic update query
  const allowedFields = ['full_name', 'mobile', 'email', 'from_place', 'to_place', 'via', 'depot'];
  const updateFields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase(); // camelCase to snake_case
    if (allowedFields.includes(dbField)) {
      updateFields.push(`${dbField} = ?`);
      values.push(value);
    }
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ message: "No valid fields to update" });
  }

  values.push(id);

  try {
    const [result] = await pool.query(
      `UPDATE applications SET ${updateFields.join(', ')} WHERE application_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({ message: "Application updated successfully" });
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
    const passNumber = generatePassNumber();
    const ticketNumber = generateTicketNumber();
    const issueDate = new Date();
    const expiryDate = new Date(issueDate);
    expiryDate.setMonth(expiryDate.getMonth() + planMonths);

    await pool.query(
      `INSERT INTO passes (
        pass_number, ticket_number, application_id,
        holder_name, institution_name, from_place, to_place, photo,
        plan_months, amount, issue_date, expiry_date, is_renewal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        passNumber, ticketNumber, applicationId,
        app.full_name, app.institution_name, app.from_place, app.to_place, app.photo,
        planMonths, amount, issueDate, expiryDate, isRenewal || false
      ]
    );

    // Update application status
    await pool.query(
      "UPDATE applications SET status = 'completed' WHERE application_id = ?",
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
      "SELECT * FROM passes WHERE pass_number = ?",
      [passNumber]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Pass not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Get Pass Error:", error);
    res.status(500).json({ message: "Failed to fetch pass" });
  }
});

// Get all passes for a user (by email)
app.get("/api/passes/user/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT p.* FROM passes p 
       JOIN applications a ON p.application_id = a.application_id 
       WHERE a.email = ? 
       ORDER BY p.created_at DESC`,
      [email]
    );

    res.json(rows);
  } catch (error) {
    console.error("Get User Passes Error:", error);
    res.status(500).json({ message: "Failed to fetch passes" });
  }
});

// ==================== PAYMENT ROUTES ====================

// Create payment
app.post("/api/payments", async (req, res) => {
  const { applicationId, amount, paymentMethod } = req.body;

  const paymentId = generatePaymentId();

  try {
    await pool.query(
      `INSERT INTO payments (payment_id, application_id, amount, payment_method, payment_status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [paymentId, applicationId, amount, paymentMethod || 'upi']
    );

    res.status(201).json({
      message: "Payment initiated",
      paymentId,
      amount
    });
  } catch (error) {
    console.error("Create Payment Error:", error);
    res.status(500).json({ message: "Failed to initiate payment" });
  }
});

// Complete payment (mock - in real app, this would be a webhook from payment gateway)
app.post("/api/payments/:paymentId/complete", async (req, res) => {
  const { paymentId } = req.params;
  const { transactionId, status } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE payments SET payment_status = ?, transaction_id = ?, completed_at = CURRENT_TIMESTAMP 
       WHERE payment_id = ?`,
      [status || 'success', transactionId, paymentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({ message: "Payment completed", paymentId });
  } catch (error) {
    console.error("Complete Payment Error:", error);
    res.status(500).json({ message: "Failed to complete payment" });
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
  } else {
    console.warn("⚠️ Starting server without database connection. Some features may not work.");
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();