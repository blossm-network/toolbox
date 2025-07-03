import deps from "./deps.js";

let client;

if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
  client = deps.redis.createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
    },
  });

  client.on("error", (error) => {
    console.error("Redis error", error);
  });
  client.on("connect", () => {
    console.log("Redis connected");
  });
  client.connect();
}

const fallbackObjectCache = {};

export const writeObject = async (key, object) => {
  if (client && client.isReady) {
    await client.HMSET(key, object);
  } else {
    fallbackObjectCache[key] = object;
  }
};

export const readObject = async (key) => {
  if (client && client.isReady) {
    return await client.HGETALL(key);
  }
  return fallbackObjectCache[key];
};

export const setExpiry = async (key, { seconds }) => {
  if (client && client.isReady) {
    await client.EXPIRE(key, seconds);
  }
};
