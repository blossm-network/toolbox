module.exports = ({
  name,
  context: {
    root: contextRoot,
    domain: contextDomain,
    service: contextService,
    network: contextNetwork,
  } = {},
  keys = [],
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
  }${keys.reduce((result, key) => (result += `.${key}`), "")}${
    principalRoot ? `.${principalRoot}` : ""
  }${principalService ? `.${principalService}` : ""}${
    principalNetwork ? `.${principalNetwork}` : ""
  }`;
