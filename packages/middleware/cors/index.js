import deps from "./deps.js";

export default ({ app, allow = [], credentials = false, methods = [] }) => {
  const own = `https://${process.env.NETWORK}`;
  const options = {
    origin: deps.allow([own, ...allow]).check,
    methods: methods.join(","),
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials,
  };
  // Origins that were named, as opposed to let in by "*".
  const named = [own, ...allow].filter((origin) => origin != "*");
  app.use(
    deps.cors(
      allow.includes("*")
        ? // Any origin with cookies would let any site act as the visitor.
          // An origin let in only by "*" is answered without credentials;
          // the network's own origin and named ones keep them.
          (req, callback) =>
            callback(null, {
              ...options,
              credentials: credentials && named.includes(req.headers.origin),
            })
        : options,
    ),
  );
  app.options("*", deps.cors());
};
