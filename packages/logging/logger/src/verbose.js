import transports from "@blossm/gcp-log-transports";

export default (message, metadata) => transports.verbose(message, metadata);
