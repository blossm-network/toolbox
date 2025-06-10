set -e

mongosh <<EOF

// Login to admin database
use $MONGODB_INITDB_DATABASE

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
  }]
})
EOF
