import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

console.log('Sending test SMS using:');
console.log('SID:', accountSid);
console.log('From:', process.env.TWILIO_PHONE_NUMBER);

client.messages
  .create({
     body: 'Test OTP from APSRTC Digital Bus Pass: 987654',
     from: process.env.TWILIO_PHONE_NUMBER,
     to: '+918367592895' // Sending to user's provided number in the test script
   })
  .then(message => {
      console.log('✅ SMS Sent Successfully!');
      console.log('Message SID:', message.sid);
  })
  .catch(error => {
      console.error('❌ Twilio Error:', error.message);
      if (error.code === 21606) {
          console.error('Tip: The "From" phone number is not valid for your account.');
      }
      process.exit(1);
  });
