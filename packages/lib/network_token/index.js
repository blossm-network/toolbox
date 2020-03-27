module.exports = async ({ tokenFn, host }) =>
  tokenFn ? await tokenFn({ host }) : null;
