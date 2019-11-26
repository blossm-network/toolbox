set -e

mongo <<EOF
// Login to admin database with admin user
use $MONGODB_INITDB_DATABASE
// db.auth('$MONGODB_INITDB_ROOT_USERNAME', '$MONGODB_INITDB_ROOT_PASSWORD')

// Create user in application database with full permissions
db.createUser({
  user:  '$MONGODB_USER',
  pwd: '$MONGODB_USER_PASSWORD',
  roles: [{
    role: 'readWrite',
    db: '$MONGODB_DATABASE'
  }]
})
EOF
