import deps from "./deps.js";

export default ({ database }) =>
  (fn) =>
    deps.db.createTransaction({ database, fn });
