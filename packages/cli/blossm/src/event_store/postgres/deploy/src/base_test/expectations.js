// The PostgreSQL store validates a payload against the declared schema before
// it reaches the database, so an invalid one is a client error.
export default { invalidPayloadStatus: 400 };
