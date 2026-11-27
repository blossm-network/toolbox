// The network is the one that owns the view. It comes right after the name, so
// no other network can make a name that reaches this network's subscribers.
export default ({
  name,
  network,
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
  `${name}${network ? `.${network}` : ""}${contextRoot ? `.${contextRoot}` : ""}${
    contextDomain ? `.${contextDomain}` : ""
  }${contextService ? `.${contextService}` : ""}${
    contextNetwork ? `.${contextNetwork}` : ""
  }${key ? `.${key}` : ""}${principalRoot ? `.${principalRoot}` : ""}${
    principalService ? `.${principalService}` : ""
  }${principalNetwork ? `.${principalNetwork}` : ""}`;
