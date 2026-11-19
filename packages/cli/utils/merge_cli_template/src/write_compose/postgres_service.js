import { postgresImage } from "../../runtime.js";
import postgresEnv, { postgresPasswordEnv } from "../postgres_env.js";

// A disposable local fixture. These values are public test data: they never
// come from config.yaml or Secret Manager, and no deployment reads them.
const database = "blossm";
const user = "tester";
const password = "local-fixture-only";
const host = "postgres";

export const postgresServiceKey = "postgres";

// The initial server accepts only socket connections while it prepares the
// database, so a TCP check reports ready only once the fixture is usable.
export const postgresReady = {
  [postgresServiceKey]: { condition: "service_healthy" },
};

// Every event store shares the fixture database under its own namespace,
// matching the deployed layout.
export const localPostgresEnv = (namespace) => ({
  ...postgresEnv({ host, database, user, max: 2, namespace }),
  [postgresPasswordEnv]: password,
});

export default () => ({
  image: postgresImage,
  container_name: host,
  environment: {
    POSTGRES_DB: database,
    POSTGRES_USER: user,
    POSTGRES_PASSWORD: password,
  },
  healthcheck: {
    test: ["CMD", "pg_isready", "-h", "127.0.0.1", "-U", user, "-d", database],
    interval: "1s",
    timeout: "5s",
    retries: 60,
  },
});
