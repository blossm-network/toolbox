module.exports = async ({ tokenFn, network }) =>
  tokenFn ? await tokenFn({ network }) : null;
