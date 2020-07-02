module.exports = ({
  name,
  sourceRoot,
  sourceDomain,
  sourceService,
  sourceNetwork,
  context,
  contextRoot,
  contextService,
  contextNetwork,
}) =>
  `${name}${sourceRoot ? `.${sourceRoot}` : ""}${
    sourceDomain ? `.${sourceDomain}` : ""
  }${sourceService ? `.${sourceService}` : ""}${
    sourceNetwork ? `.${sourceNetwork}` : ""
  }.${context}.${contextRoot}.${contextService}.${contextNetwork}`;
