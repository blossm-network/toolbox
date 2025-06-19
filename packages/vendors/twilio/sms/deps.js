import twilio from "twilio";

export default {
  twilio: (accountSid, authToken) => twilio(accountSid, authToken),
} 
