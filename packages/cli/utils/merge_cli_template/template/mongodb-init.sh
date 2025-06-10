#!/bin/bash
set -e

mongosh admin --username '$MONGODB_INITDB_ROOT_USERNAME' --password '$MONGODB_INITDB_ROOT_PASSWORD'  <<EOF
// Login to admin database with admin user
// use $MONGODB_INITDB_DATABASE
db = db.getSiblingDB("$MONGODB_DATABASE");
// db.auth('$MONGODB_INITDB_ROOT_USERNAME', '$MONGODB_INITDB_ROOT_PASSWORD')

// Create user in application database with full permissions
db.createUser({
  user:  '$MONGODB_USER',
  pwd: '$MONGODB_USER_PASSWORD',
  roles: [{
    role: 'readWrite',
    db: '$MONGODB_DATABASE'
  }, {
    role: 'dbAdmin',
    db: '$MONGODB_DATABASE'
  }, {
    role: 'userAdmin',
    db: '$MONGODB_DATABASE'
  }]
})
EOF
