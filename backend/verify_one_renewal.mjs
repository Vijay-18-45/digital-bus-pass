import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();
const renewalId = "RNW-MM5ETMR68KJK";
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bus_pass_system"
});

const [apps] = await pool.query(
  "SELECT application_id, full_name, status, renewal_id, created_at FROM applications WHERE renewal_id = ?",
  [renewalId]
);
const [passes] = await pool.query(
  "SELECT pass_number, application_id, issue_date, expiry_date, status FROM passes WHERE application_id IN (SELECT application_id FROM applications WHERE renewal_id = ?)",
  [renewalId]
);
const [payments] = await pool.query(
  "SELECT payment_id, application_id, amount, status, paid_at FROM payments WHERE application_id IN (SELECT application_id FROM applications WHERE renewal_id = ?) ORDER BY created_at DESC",
  [renewalId]
);

console.log("=== app ===");
console.log(JSON.stringify(apps, null, 2));
console.log("=== passes ===");
console.log(JSON.stringify(passes, null, 2));
console.log("=== payments ===");
console.log(JSON.stringify(payments, null, 2));

await pool.end();
