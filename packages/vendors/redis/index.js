const logger = require("@blossm/logger");
const deps = require("./deps");

const client =
  process.env.REDIS_IP &&
  deps.redis.createClient({
    host: process.env.REDIS_IP,
  });

client &&
  client.on("error", function (error) {
    logger.error("The cache had an error.", { error });
  });

module.exports = {
  writeObject: (key, object) =>
    client &&
    new Promise((resolve, reject) =>
      client.hmset(key, object, (err) => (err ? reject(err) : resolve()))
    ),
  readObject: (key) =>
    new Promise((resolve, reject) =>
      client
        ? client.hgetall(key, (err, object) =>
            err ? reject(err) : resolve(object)
          )
        : resolve()
    ),
};
