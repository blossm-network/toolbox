#!/bin/bash
set -e

mongosh <<'EOF'
// Create the fixture user in the authentication database for its named stores.
const admin = db.getSiblingDB(process.env.MONGODB_INITDB_DATABASE);
const roles = JSON.parse(process.env.MONGODB_DATABASES).flatMap(database => [
  { role: "readWrite", db: database },
  { role: "dbAdmin", db: database },
]);
admin.createUser({
  user: process.env.MONGODB_USER,
  pwd: process.env.MONGODB_USER_PASSWORD,
  roles,
});
EOF
