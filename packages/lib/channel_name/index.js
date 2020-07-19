module.exports = ({
  name,
  context: {
    root: contextRoot,
    domain: contextDomain,
    service: contextService,
    network: contextNetwork,
  },
}) =>
  `${name}.${contextRoot}.${contextDomain}.${contextService}.${contextNetwork}`;
