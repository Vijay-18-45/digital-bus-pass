import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bus_pass_system"
});

const queries = {
  totals: "SELECT COUNT(*) total_apps, SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) approved_apps, SUM(CASE WHEN renewal_id IS NOT NULL AND renewal_id <> '' THEN 1 ELSE 0 END) apps_with_renewal FROM applications",
  approvedMissingRenewal: "SELECT application_id, status, renewal_id FROM applications WHERE status='approved' AND (renewal_id IS NULL OR renewal_id='') ORDER BY created_at DESC",
  duplicateRenewal: "SELECT renewal_id, COUNT(*) cnt FROM applications WHERE renewal_id IS NOT NULL AND renewal_id <> '' GROUP BY renewal_id HAVING COUNT(*) > 1",
  renewalPresentButNotApproved: "SELECT application_id, status, renewal_id FROM applications WHERE renewal_id IS NOT NULL AND renewal_id <> '' AND status <> 'approved' ORDER BY created_at DESC",
  orphanPasses: "SELECT p.pass_number, p.application_id FROM passes p LEFT JOIN applications a ON a.application_id = p.application_id WHERE a.application_id IS NULL",
  appsWithoutPassAfterPayment: "SELECT pay.payment_id, pay.application_id, pay.status FROM payments pay LEFT JOIN passes p ON p.application_id = pay.application_id WHERE pay.status='completed' AND p.application_id IS NULL",
  passesWithoutCompletedPayment: "SELECT p.pass_number, p.application_id FROM passes p LEFT JOIN payments pay ON pay.application_id = p.application_id AND pay.status='completed' WHERE pay.payment_id IS NULL",
  renewalToPassLink: "SELECT a.application_id, a.renewal_id, a.status, p.pass_number FROM applications a LEFT JOIN passes p ON p.application_id = a.application_id WHERE a.renewal_id IS NOT NULL AND a.renewal_id <> '' ORDER BY a.created_at DESC LIMIT 50"
};

for (const [name, sql] of Object.entries(queries)) {
  const [rows] = await pool.query(sql);
  console.log(`\n=== ${name} ===`);
  console.log(JSON.stringify(rows, null, 2));
}

await pool.end();
