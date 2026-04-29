import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function check() {
    try {
        console.log("Checking last 5 messages...");
        const messages = await client.messages.list({ limit: 5 });
        messages.forEach(m => {
            console.log(`To: ${m.to}, Status: ${m.status}, Body: ${m.body}, Error: ${m.errorMessage}`);
        });
    } catch (err) {
        console.error("Error fetching messages:", err.message);
    }
}

check();
