set -e

mongo <<EOF
// Login to admin database with admin user
use $MONGO_INITDB_DATABASE
db.auth('$MONGO_INITDB_ROOT_USERNAME', '$MONGO_INITDB_ROOT_PASSWORD')

// Create user in application database with full permissions
db.createUser({
  user:  '$MONGO_USER',
  pwd: '$MONGO_USER_PASSWORD',
  roles: [{
    role: 'readWrite',
    db: '$MONGO_DATABASE'
  }]
})
EOF
