import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

client.incomingPhoneNumbers.list({limit: 5})
  .then(numbers => {
    numbers.forEach(number => console.log('Phone Number:', number.phoneNumber));
  })
  .catch(error => console.error('Error listing numbers:', error));
