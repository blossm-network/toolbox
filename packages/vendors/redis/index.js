const deps = require("./deps");

let client;
const fallbackObjectCache = {};
module.exports = {
  writeObject: (key, object) => {
    if ((!client || !client.connected) && process.env.REDIS_IP) {
      client = deps.redis.createClient({
        host: process.env.REDIS_IP,
      });
    }

    return client
      ? new Promise((resolve, reject) =>
          client.hmset(key, object, (err) => (err ? reject(err) : resolve()))
        )
      : (fallbackObjectCache[key] = object);
  },
  readObject: (key) => {
    if ((!client || !client.connected) && process.env.REDIS_IP) {
      client = deps.redis.createClient({
        host: process.env.REDIS_IP,
      });
    }

    return client
      ? new Promise((resolve, reject) =>
          client.hgetall(key, (err, object) =>
            err ? reject(err) : resolve(object)
          )
        )
      : fallbackObjectCache[key];
  },
};
