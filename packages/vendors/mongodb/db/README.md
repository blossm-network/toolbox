# MongoDB database

`store(options)` returns a promise. Await it before using the model or starting
its server. When connection options are supplied, connection retries complete
before model construction; connection and model initialization failures reject
startup. `Model.init()` also waits for indexes when automatic indexing is enabled.
Existing synchronous consumers must change to `await store(options)`.

`connect(options)` registers lifecycle handlers before opening the connection.
Credentials are raw values: the adapter encodes their URI components once.
