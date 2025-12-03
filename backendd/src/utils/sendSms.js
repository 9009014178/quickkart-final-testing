const twilio = require('twilio');

const sendSms = async (to, body) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioNumber) {
    console.error('Twilio credentials not found in .env file.');
    return; // Don't crash if keys are missing
  }

  const client = twilio(accountSid, authToken);

  try {
    const message = await client.messages.create({
       body: body,
       from: twilioNumber,
       // IMPORTANT: For trial accounts, 'to' must be a verified phone number.
       // Add the user's phone number to your Twilio verified numbers list.
       // Make sure the number includes the country code (e.g., +91XXXXXXXXXX)
       to: to
     });
    console.log(`SMS sent successfully to ${to}. SID: ${message.sid}`);
  } catch (error) {
    console.error(`Failed to send SMS to ${to}:`, error);
  }
};

module.exports = sendSms;