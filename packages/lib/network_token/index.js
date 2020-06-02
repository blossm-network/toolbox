module.exports = ({ tokenFn, network, key }) =>
  tokenFn ? tokenFn({ network, key }) : null;
