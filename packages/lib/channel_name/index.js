//TODO test
module.exports = ({
  name,
  context: {
    root: contextRoot,
    domain: contextDomain,
    service: contextService,
    network: contextNetwork,
  } = {},
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
  }${principalRoot ? `.${principalRoot}` : ""}${
    principalService ? `.${principalService}` : ""
  }${principalNetwork ? `.${principalNetwork}` : ""}`;
