import deps from "../deps.js";

export default (whitelist) => {
  return {
    check: (origin, callback) => {
      !origin ||
      whitelist.indexOf(origin) !== -1 ||
      whitelist.indexOf("*") !== -1
        ? callback(null, true)
        : callback(deps.unauthorizedError.message("Not allowed by CORS."));
    },
  };
};
