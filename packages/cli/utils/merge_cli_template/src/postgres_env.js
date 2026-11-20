// Owns the PostgreSQL event-store environment contract shared by Cloud Run
// descriptions, local Compose services and the generated entrypoint.
// PG_PASSWORD is supplied separately: a Secret Manager binding when deployed,
// the disposable fixture value locally.
export const postgresPasswordEnv = "PG_PASSWORD";

export default ({ host, database, user, max, namespace }) => ({
  PG_HOST: host,
  PG_DATABASE: database,
  PG_USER: user,
  PG_MAX: `${max}`,
  PG_NAMESPACE: namespace,
});
