import ensureDnsRecord from "./ensure_dns_record.js";
import loadBalance from "./load_balance.js";
import mapDomain from "./map_domain.js";

// How a public gateway's hostname reaches its service. The three gateway
// builds share this, so they cannot come to differ.
//
// With a load balancer configured the hostname points at it and the service
// accepts nothing that did not come through it. Without one, Cloud Run maps
// the hostname straight onto the service.
export default ({
  uri,
  dnsZone,
  project,
  region,
  serviceName,
  cloudRun: { loadBalancer } = {},
}) =>
  loadBalancer
    ? loadBalance({ uri, dnsZone, project, region, serviceName, loadBalancer })
    : [
        ensureDnsRecord({ uri, dnsZone, project }),
        mapDomain({ uri, project, region, serviceName }),
      ];
