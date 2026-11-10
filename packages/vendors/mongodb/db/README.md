Read and write from a MongoDB database.

Run the adapter integration checks against a disposable localhost replica set:

```sh
BLOSSM_TEST_MONGODB_URI="mongodb://127.0.0.1:27017/?replicaSet=test" npm test
```

The checks create and drop their own database and are skipped without this variable.
