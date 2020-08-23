const logger = require("@blossm/logger");
const deps = require("./deps");

const client =
  process.env.CACHE_IP &&
  deps.redis.createClient({
    host: process.env.CACHE_IP,
  });

client.on("error", function (error) {
  logger.error("The cache had an error.", { error });
});

module.exports = {
  set: (key, value) => client && client.set(key, value),
  get: (key) =>
    new Promise((resolve, reject) =>
      client
        ? client.get(key, (err, reply) => (err ? reject(err) : resolve(reply)))
        : resolve()
    ),
};
