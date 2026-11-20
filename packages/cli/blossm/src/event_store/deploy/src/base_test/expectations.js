// Statuses the integration suite expects that differ between stores. A store
// replaces this file with its own. Mongo rejects an invalid payload while
// saving it, which surfaces as a server error.
export default { invalidPayloadStatus: 500 };
