import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

client.messages.list({limit: 5})
  .then(messages => {
    messages.forEach(m => console.log('Message from:', m.from, 'to:', m.to, 'body:', m.body));
  })
  .catch(error => console.error('Error listing messages:', error));
