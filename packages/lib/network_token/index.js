export default ({ tokenFn, network }) =>
  tokenFn ? tokenFn({ network }) : null;
