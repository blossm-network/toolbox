use $MONGO_INITDB_DATABASE
db.auth('$MONGO_USER', '$MONGO_PASS')
use $MONGO_DATABASE

let res = [
  db.container.drop(),
  db.container.createIndex({ myfield: 1 }, { unique: true }),
  db.container.createIndex({ thatfield: 1 }),
  db.container.insert({ myfield: 'hello', thatfield: 'testing' }),
  db.container.insert({ myfield: 'hello2', thatfield: 'testing' }),
  db.container.insert({ myfield: 'hello3', thatfield: 'testing' }),
]
printjson(res)
