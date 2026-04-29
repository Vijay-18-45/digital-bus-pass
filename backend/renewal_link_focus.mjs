import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bus_pass_system"
});

const checks = {
  multiPassPerApp: "SELECT application_id, COUNT(*) pass_count FROM passes GROUP BY application_id HAVING COUNT(*) > 1 ORDER BY pass_count DESC",
  completedPaymentMissingId: "SELECT id, payment_id, application_id, amount, status, created_at FROM payments WHERE status='completed' AND (payment_id IS NULL OR payment_id='')",
  paymentToPassCounts: "SELECT pay.application_id, COUNT(DISTINCT pay.payment_id) completed_payments, COUNT(DISTINCT p.pass_number) passes FROM payments pay LEFT JOIN passes p ON p.application_id=pay.application_id WHERE pay.status='completed' GROUP BY pay.application_id ORDER BY completed_payments DESC, passes DESC"
};

for (const [name, sql] of Object.entries(checks)) {
  const [rows] = await pool.query(sql);
  console.log(`\n=== ${name} ===`);
  console.log(JSON.stringify(rows, null, 2));
}

await pool.end();
