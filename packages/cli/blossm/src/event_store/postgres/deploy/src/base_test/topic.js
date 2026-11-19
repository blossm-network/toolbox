// The local PostgreSQL store does not publish, so its suite needs no topic and
// makes no Pub/Sub call.
export default { create: async () => {}, del: async () => {} };
