module.exports = ({
  name,
  domain,
  domainRoot,
  domainService,
  domainNetwork,
  context,
  contextRoot,
  contextService,
  contextNetwork,
}) =>
  `${name}${domain ? `.${domain}` : ""}${domainRoot ? `.${domainRoot}` : ""}${
    domainService ? `.${domainService}` : ""
  }${
    domainNetwork ? `.${domainNetwork}` : ""
  }.${context}.${contextRoot}.${contextService}.${contextNetwork}`;
