export default ({ hash, headers }) => ({
  hash,
  topic: headers.topic,
  created: headers.committed,
  data: {
    root: headers.root,
    action: headers.action,
    domain: headers.domain,
    service: headers.service,
    network: headers.network,
    timestamp: headers.committed,
  },
});
