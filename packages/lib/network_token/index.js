module.exports = ({ tokenFn, network }) =>
  tokenFn ? tokenFn({ network }) : null;
