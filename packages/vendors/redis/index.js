import deps from "./deps.js";

let client;

// if (process.env.REDIS_IP) {
//   client = deps.redis.createClient({
//     socket: {
//       host: process.env.REDIS_IP
//     }
//   });
  
//   client.on("error", () => {});
//   await client.connect();
// }

const fallbackObjectCache = {};

export const writeObject = async (key, object) => {
  if (client) {
    await client.hmset(key, object);
  } else {
    fallbackObjectCache[key] = object;
  }
};

export const readObject = async (key) => {
  if (client) {
    return await client.hgetall(key);
  }
  return fallbackObjectCache[key];
};

export const setExpiry = async (key, { seconds }) => {
  if (client) {
    await client.expire(key, seconds);
  }
};
