import deps from "./deps.js";

export const __client =
  process.env.REDIS_IP && deps.redis.createClient({
    host: process.env.REDIS_IP,
  });

__client && __client.on("error", () => {});

console.log({ __client });

const fallbackObjectCache = {};

export const writeObject = (key, object) => {
  return __client
    ? new Promise((resolve, reject) =>
        __client.hmset(key, object, (err) => (err ? reject(err) : resolve()))
      )
    : (fallbackObjectCache[key] = object);
}


export const readObject = (key) =>
  __client
    ? new Promise((resolve, reject) =>
        __client.hgetall(key, (err, object) =>
          err ? reject(err) : resolve(object)
        )
      )
    : fallbackObjectCache[key];

export const setExpiry = (key, { seconds }) =>
  __client &&
  new Promise((resolve, reject) =>
    __client.expire(key, seconds, (err) => (err ? reject(err) : resolve()))
  );
