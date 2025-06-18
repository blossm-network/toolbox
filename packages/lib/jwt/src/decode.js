import deps from "../deps.js";

export default (token) => {
  const headers = deps.decodeJwt(token, { header: true });
  const claims = deps.decodeJwt(token);
  return { headers, claims };
};
