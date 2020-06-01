module.exports = async ({ tokenFn, network, key }) =>
  tokenFn ? await tokenFn({ network, key }) : null;
