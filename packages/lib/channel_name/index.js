module.exports = ({
  name,
  source: {
    root: sourceRoot,
    domain: sourceDomain,
    service: sourceService,
    network: sourceNetwork,
  } = {},
  context: {
    root: contextRoot,
    domain: contextDomain,
    service: contextService,
    network: contextNetwork,
  },
}) =>
  `${name}${sourceRoot ? `.${sourceRoot}` : ""}${
    sourceDomain ? `.${sourceDomain}` : ""
  }${sourceService ? `.${sourceService}` : ""}${
    sourceNetwork ? `.${sourceNetwork}` : ""
  }.${contextRoot}.${contextDomain}.${contextService}.${contextNetwork}`;
