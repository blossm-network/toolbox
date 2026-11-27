import { isIP } from "node:net";

import deps from "./deps.js";

// The caller's address, as Google saw it. Google appends to X-Forwarded-For
// the address that connected to it, and then the load balancer's own when
// there is one; CLIENT_ADDRESS_HOPS says how many it appended. Everything
// before that was written by the caller, so it is never read.
//
// When in doubt there is no address: a hop count that isn't a whole number of
// one or more, a header shorter than the count, or an entry that isn't an
// address. A count higher than what Google really appends would land on the
// caller's own text, so a count above one is only right for a service that
// can't be reached around its load balancer.
const callerAddress = (req) => {
  const hops = Number(process.env.CLIENT_ADDRESS_HOPS ?? 1);
  if (!Number.isInteger(hops) || hops < 1) return undefined;
  const address = String(req.headers["x-forwarded-for"] || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .at(-hops);
  return isIP(address || "") ? address : undefined;
};

export default ({
    name,
    domain,
    service,
    network,
    internalTokenFn,
    nodeExternalTokenFn,
    key,
    redirect,
  } = {}) =>
  async (req, res) => {
    await deps.validate(req.body);
    const { payload, headers, root } = req.body;

    try {
      let {
        body: response,
        headers: responseHeaders,
        statusCode,
      } = await deps
        .command({
          name,
          domain,
          ...(service && { service }),
          ...(network && {
            network: `${
              process.env.NODE_ENV == "production" ? "" : "snd."
            }${network}`,
          }),
        })
        .set({
          token: {
            internalFn: internalTokenFn,
            externalFn: ({ network } = {}) =>
              req.token
                ? { token: req.token, type: "Bearer" }
                : nodeExternalTokenFn({ network }),
          },
          ...(req.token && { currentToken: req.token }),
          ...(req.context && { context: req.context }),
          ...(req.claims && { claims: req.claims }),
        })
        .issue(payload, {
          ...(root && { root }),
          ...(headers.idempotency && {
            headers: { idempotency: headers.idempotency },
          }),
          tx: {
            ip: callerAddress(req),
            path: [
              {
                timestamp: deps.dateString(),
                issued: headers.issued,
                procedure: process.env.PROCEDURE,
                hash: process.env.OPERATION_HASH,
                domain: process.env.DOMAIN,
                service: process.env.SERVICE,
                network: process.env.NETWORK,
                host: process.env.HOST,
              },
            ],
          },
        });

      // If the response has tokens, send them as cookies.
      if (response) {
        if (response._tokens) {
          for (const token of response._tokens) {
            if (!token.network || !token.type || !token.value) continue;
            const { claims } = deps.decode(token.value);
            res.cookie(token.type, token.value, {
              domain: token.network,
              httpOnly: true,
              secure: true,
              expires: new Date(claims.exp),
            });
          }
          delete response._tokens;
        }
        if (response._revoke) {
          for (const token of response._revoke)
            res.clearCookie(token.type, {
              domain: token.network,
              httpOnly: true,
              secure: true,
            });
          delete response._revoke;
        }
      }

      if (responseHeaders && responseHeaders["set-cookie"])
        res.set("set-cookie", responseHeaders["set-cookie"]);

      res.status(statusCode).send(response);
    } catch (err) {
      throw err.statusCode == 403
        ? deps.forbiddenError.message(err.message, {
            info: { redirect },
          })
        : err;
    }
  };
