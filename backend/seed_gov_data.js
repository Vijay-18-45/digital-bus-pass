import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../backend/.env') });

async function seedData() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'bus_pass_system',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log('Seeding demo data for Gov Dashboard...');

        // 1. Ensure we have applications
        const [apps] = await pool.query('SELECT application_id FROM applications LIMIT 10');
        if (apps.length === 0) {
            console.log('No applications found. Please submit some forms first.');
            return;
        }

        // 2. Update some applications to 'approved'
        await pool.query("UPDATE applications SET status = 'approved' LIMIT 5");

        // 3. Create some payments
        for (let i = 0; i < apps.length; i++) {
            const appId = apps[i].application_id;
            const amount = 500 + (i * 100);
            await pool.query(
                `INSERT IGNORE INTO payments (application_id, amount, status, payment_method) 
                 VALUES (?, ?, 'completed', 'UPI')`,
                [appId, amount]
            );

            // 4. Create some passes
            const passId = 'PASS_DEMO_' + i;
            await pool.query(
                `INSERT IGNORE INTO passes (pass_id, application_id, pass_type, valid_from, valid_until, status) 
                 VALUES (?, ?, 'Monthly Pass', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 MONTH), 'active')`,
                [passId, appId]
            );
        }

        console.log('✅ Seeding complete.');
    } catch (err) {
        console.error('❌ Seeding failed:', err);
    } finally {
        await pool.end();
    }
}

seedData();
