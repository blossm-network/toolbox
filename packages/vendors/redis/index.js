import deps from "./deps.js";

console.log({ REDIS_IP: process.env.REDIS_IP });
const client =
  process.env.REDIS_IP &&
  deps.redis.createClient({
    host: process.env.REDIS_IP,
  });

client && client.on("error", () => {});

const fallbackObjectCache = {};

const writeObject = (key, object) => {
  console.log({ client });
  return client
    ? new Promise((resolve, reject) =>
        client.hmset(key, object, (err) => (err ? reject(err) : resolve()))
      )
    : (fallbackObjectCache[key] = object);
}


const readObject = (key) =>
  client
    ? new Promise((resolve, reject) =>
        client.hgetall(key, (err, object) =>
          err ? reject(err) : resolve(object)
        )
      )
    : fallbackObjectCache[key];

const setExpiry = (key, { seconds }) =>
  client &&
  new Promise((resolve, reject) =>
    client.expire(key, seconds, (err) => (err ? reject(err) : resolve()))
  );

export {
  writeObject,
  readObject,
  setExpiry,
};
