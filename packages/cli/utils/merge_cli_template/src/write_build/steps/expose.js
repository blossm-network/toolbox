import ensureDnsRecord from "./ensure_dns_record.js";
import mapDomain from "./map_domain.js";

// How a public gateway's hostname reaches its service. The three gateway
// builds share this, so they cannot come to differ.
export default ({ uri, dnsZone, project, region, serviceName }) => [
  ensureDnsRecord({ uri, dnsZone, project }),
  mapDomain({ uri, project, region, serviceName }),
];
