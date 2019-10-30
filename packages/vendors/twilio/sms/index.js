const deps = require("./deps");

module.exports = (accountSid, authToken) => {
  const { messages } = deps.twilio(accountSid, authToken);
  return {
    send: async ({ to, from, body, media }) =>
      await messages.create({
        to,
        from,
        body,
        ...(media && { mediaUrl: media })
      }),
    list: async ({ sentAfter, sentBefore, limit = 20 } = {}) =>
      await messages.list({
        ...(sentAfter && { dateSentAfter: sentAfter }),
        ...(sentBefore && { dateSentBefore: sentBefore }),
        ...(limit && { limit })
      })
  };
};
