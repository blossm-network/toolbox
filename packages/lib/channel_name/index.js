module.exports = ({
  name,
  context: {
    root: contextRoot,
    domain: contextDomain,
    service: contextService,
    network: contextNetwork,
  } = {},
  key,
  principal: {
    root: principalRoot,
    service: principalService,
    network: principalNetwork,
  } = {},
}) =>
  `${name}${contextRoot ? `.${contextRoot}` : ""}${
    contextDomain ? `.${contextDomain}` : ""
  }${contextService ? `.${contextService}` : ""}${
    contextNetwork ? `.${contextNetwork}` : ""
  }${key ? `.${key}` : ""}${principalRoot ? `.${principalRoot}` : ""}${
    principalService ? `.${principalService}` : ""
  }${principalNetwork ? `.${principalNetwork}` : ""}`;
