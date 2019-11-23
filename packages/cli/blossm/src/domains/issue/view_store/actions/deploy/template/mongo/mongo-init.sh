set -e

mongo <<EOF
use $MONGODB_INITDB_DATABASE

db.createUser({
  user:  '$MONGODB_USER',
  pwd: '$MONGODB_USER_PASSWORD',
  roles: [{
    role: 'readWrite',
    db: '$MONGODB_DATABASE'
  }]
})
EOF
