#!/usr/bin/env bash
set -euo pipefail

# The official image sources this file while its temporary bootstrap mongod is
# running. Only the health check initializes the final replica-set daemon.
if [[ "${1:-}" == "ready" ]]; then
  [[ ! -e "${TMPDIR:-/tmp}/docker-entrypoint-temp-mongod.pid" ]] || exit 1

  mongosh --norc --quiet "mongodb://${MONGODB_REPLICA_HOST}/?directConnection=true" --eval "$(cat <<'JS'
const replicaSet = process.env.MONGODB_REPLICA_SET;
try {
  const status = rs.status();
  if (status.set !== replicaSet) throw new Error("Unexpected fixture replica set.");
} catch (error) {
  if (error.code !== 94) throw error;
  const initialized = rs.initiate({
    _id: replicaSet,
    members: [{ _id: 0, host: process.env.MONGODB_REPLICA_HOST }],
  });
  if (!initialized.ok) throw new Error("Replica-set initialization failed.");
}
if (!db.hello().isWritablePrimary) quit(1);

const admin = db.getSiblingDB(process.env.MONGODB_INITDB_DATABASE);
const databases = JSON.parse(process.env.MONGODB_DATABASES);
const roles = databases.flatMap(database => [
  { role: "readWrite", db: database },
  { role: "dbAdmin", db: database },
]);
const user = admin.getUser(process.env.MONGODB_USER);
if (!user) {
  admin.createUser({ user: process.env.MONGODB_USER,
    pwd: process.env.MONGODB_USER_PASSWORD, roles });
} else {
  const identity = roles => roles.map(({ role, db }) => `${db}:${role}`).sort();
  if (JSON.stringify(identity(user.roles)) !== JSON.stringify(identity(roles)))
    admin.updateUser(process.env.MONGODB_USER,
      { pwd: process.env.MONGODB_USER_PASSWORD, roles });
}
quit(0);
JS
)"
fi
