const deps = require("./deps");

const client =
  process.env.REDIS_IP &&
  deps.redis.createClient({
    host: process.env.REDIS_IP,
  });

client && client.on("error", () => {});

const fallbackObjectCache = {};
module.exports = {
  writeObject: (key, object) =>
    client
      ? new Promise((resolve, reject) =>
          client.hmset(key, object, (err) => (err ? reject(err) : resolve()))
        )
      : (fallbackObjectCache[key] = object),
  readObject: (key) =>
    client
      ? new Promise((resolve, reject) =>
          client.hgetall(key, (err, object) =>
            err ? reject(err) : resolve(object)
          )
        )
      : fallbackObjectCache[key],
  setExpiry: (key, { seconds }) =>
    client &&
    new Promise((resolve, reject) =>
      client.expire(key, seconds, (err) => (err ? reject(err) : resolve()))
    ),
};
