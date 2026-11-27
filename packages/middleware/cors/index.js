import deps from "./deps.js";

export default ({ app, allow = [], credentials = false, methods = [] }) => {
  app.use(
    deps.cors({
      origin: deps.allow([`https://${process.env.NETWORK}`, ...allow]).check,
      methods: methods.join(","),
      preflightContinue: false,
      optionsSuccessStatus: 204,
      // Any origin with cookies would let any site act as the visitor.
      credentials: credentials && !allow.includes("*"),
    }),
  );
  app.options("*", deps.cors());
};
